import { DatabaseTable, RLSPolicy, MigrationType } from '../types';

export class MigrationGenerator {
  generateCreateTableSQL(table: DatabaseTable): string {
    const columns = table.columns
      .map(col => {
        let def = `  "${col.name}" ${this.mapTypeToPostgres(col.type)}`;
        if (!col.nullable) def += ' NOT NULL';
        if (col.default) def += ` DEFAULT ${this.formatDefaultValue(col.default)}`;
        return def;
      })
      .join(',\n');

    return `CREATE TABLE IF NOT EXISTS "${table.schema}"."${table.name}" (\n${columns}\n);`;
  }

  private formatDefaultValue(defaultValue: any): string {
    if (!defaultValue && defaultValue !== 0 && defaultValue !== false) return defaultValue;

    // Convert to string if it's not already
    const valueStr = String(defaultValue);
    const trimmed = valueStr.trim();

    // Check if it's a function call (contains parentheses)
    if (trimmed.includes('(') && trimmed.includes(')')) {
      // It's a function like now(), gen_random_uuid(), etc.
      return trimmed;
    }

    // Check if it's already quoted
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      return trimmed;
    }

    // Check if it's a number
    if (!isNaN(Number(trimmed))) {
      return trimmed;
    }

    // Check if it's a boolean
    if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
      return trimmed;
    }

    // Check if it's NULL
    if (trimmed.toUpperCase() === 'NULL') {
      return trimmed;
    }

    // Otherwise, it's a string literal that needs quotes
    return `'${trimmed}'`;
  }

  private skippedInsertPolicies: Array<{name: string, table: string, check?: string}> = [];

  generateRLSPolicySQL(policy: RLSPolicy): string {
    // Skip policies with invalid or undefined definitions
    if (!policy.definition || policy.definition === 'undefined' || policy.definition.trim() === '') {
      console.warn(`Skipping policy "${policy.name}" on table "${policy.table}" - invalid USING clause`);
      
      // Track INSERT policies for manual creation instructions
      if (policy.command.toUpperCase() === 'INSERT') {
        this.skippedInsertPolicies.push({
          name: policy.name,
          table: policy.table,
          check: policy.check
        });
      }
      
      return `-- SKIPPED: "${policy.name}" on "${policy.table}" - USING clause is undefined\n-- This is likely an INSERT-only policy. See instructions at the top of this file.`;
    }

    // Clean up the definition - remove outer parentheses if they exist
    // pg_policies.qual already includes parentheses, so we need to strip them
    const cleanDefinition = this.cleanPolicyExpression(policy.definition);
    const cleanCheck = policy.check ? this.cleanPolicyExpression(policy.check) : null;

    // PostgreSQL doesn't support IF NOT EXISTS for policies, so we need to drop first
    let sql = `DROP POLICY IF EXISTS "${policy.name}" ON "${policy.table}";\n`;
    sql += `CREATE POLICY "${policy.name}"\n`;
    sql += `  ON "${policy.table}"\n`;
    sql += `  FOR ${policy.command}\n`;
    
    // For INSERT policies, USING clause is optional (only WITH CHECK is required)
    // For other operations, USING clause is required
    const isInsertOnly = policy.command.toUpperCase() === 'INSERT';
    
    if (!isInsertOnly || cleanDefinition) {
      sql += `  USING (${cleanDefinition})`;
    }
    
    if (cleanCheck && cleanCheck !== 'undefined' && cleanCheck.trim() !== '') {
      if (!isInsertOnly || cleanDefinition) {
        sql += '\n';
      }
      sql += `  WITH CHECK (${cleanCheck})`;
    }
    
    sql += ';';
    return sql;
  }

  private cleanPolicyExpression(expression: string): string {
    if (!expression) return expression;
    
    const trimmed = expression.trim();
    
    // If the expression is wrapped in parentheses, remove the outer ones
    // pg_policies stores expressions like "(auth.uid() = user_id)" but we need "auth.uid() = user_id"
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      // Check if these are the outer parentheses by counting
      let depth = 0;
      let isOuterParen = true;
      
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '(') depth++;
        if (trimmed[i] === ')') depth--;
        
        // If depth reaches 0 before the end, these aren't outer parens
        if (depth === 0 && i < trimmed.length - 1) {
          isOuterParen = false;
          break;
        }
      }
      
      if (isOuterParen) {
        return trimmed.slice(1, -1).trim();
      }
    }
    
    return trimmed;
  }

  generateEnableRLSSQL(tableName: string): string {
    return `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`;
  }

  generateInsertDataSQL(table: DatabaseTable, data: any[]): string {
    if (data.length === 0) return '';

    const columns = table.columns.map(col => `"${col.name}"`).join(', ');
    const values = data.map(row => {
      const vals = table.columns.map(col => {
        const val = row[col.name];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      }).join(', ');
      return `  (${vals})`;
    }).join(',\n');

    return `INSERT INTO "${table.schema}"."${table.name}" (${columns})\nVALUES\n${values};`;
  }

  private mapTypeToPostgres(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'TEXT',
      'integer': 'INTEGER',
      'number': 'NUMERIC',
      'boolean': 'BOOLEAN',
      'array': 'JSONB',
      'object': 'JSONB',
      'uuid': 'UUID',
      'timestamp': 'TIMESTAMPTZ',
      'date': 'DATE',
      'time': 'TIME',
      'bigint': 'BIGINT',
      'numeric': 'NUMERIC',
    };
    return typeMap[type.toLowerCase()] || 'TEXT';
  }

  generateFullMigration(
    tables: DatabaseTable[], 
    policies: RLSPolicy[], 
    migrationType: MigrationType,
    includeRLS: boolean,
    tableData?: Map<string, any[]>
  ): string {
    // Reset skipped policies tracker
    this.skippedInsertPolicies = [];
    
    let sql = `-- ============================================
-- SUPABASE MIGRATION FILE
-- Generated: ${new Date().toISOString()}
-- Migration Type: ${migrationType}
-- Tables: ${tables.length}
${includeRLS ? `-- RLS Policies: ${policies.length}` : ''}
-- ============================================
`;

    // Schema migration
    if (migrationType === 'schema' || migrationType === 'both') {
      sql += `\n-- ============================================
-- SCHEMA MIGRATION
-- ============================================\n\n`;

      tables.forEach(table => {
        sql += `-- Table: ${table.name}\n`;
        sql += this.generateCreateTableSQL(table);
        sql += '\n\n';
      });

      // RLS Policies
      if (includeRLS && policies.length > 0) {
        sql += `\n-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================\n\n`;

        // Group policies by table
        const policiesByTable = new Map<string, RLSPolicy[]>();
        policies.forEach(policy => {
          if (!policiesByTable.has(policy.table)) {
            policiesByTable.set(policy.table, []);
          }
          policiesByTable.get(policy.table)!.push(policy);
        });

        policiesByTable.forEach((tablePolicies, tableName) => {
          sql += `-- Enable RLS on ${tableName}\n`;
          sql += this.generateEnableRLSSQL(tableName);
          sql += '\n\n';

          tablePolicies.forEach(policy => {
            sql += `-- Policy: ${policy.name}\n`;
            sql += this.generateRLSPolicySQL(policy);
            sql += '\n\n';
          });
        });
        
        // Add warning about skipped INSERT policies
        if (this.skippedInsertPolicies.length > 0) {
          sql += `\n-- ============================================
-- ⚠️ IMPORTANT: MANUAL ACTION REQUIRED
-- ============================================
-- The following INSERT policies could not be automatically migrated
-- because PostgreSQL's pg_policies view doesn't store the WITH CHECK
-- clause for INSERT-only policies in a way we can retrieve.
--
-- YOU MUST MANUALLY CREATE THESE POLICIES:
-- ============================================\n\n`;

          this.skippedInsertPolicies.forEach(policy => {
            sql += `-- Policy: "${policy.name}" on table "${policy.table}"\n`;
            sql += `-- To create this policy:\n`;
            sql += `-- 1. Go to: https://supabase.com/dashboard/project/YOUR_TARGET_PROJECT/auth/policies\n`;
            sql += `-- 2. Find the "${policy.table}" table\n`;
            sql += `-- 3. Click "New Policy"\n`;
            sql += `-- 4. Select "For INSERT operations"\n`;
            sql += `-- 5. Name it: "${policy.name}"\n`;
            sql += `-- 6. Set the WITH CHECK expression based on your source project's policy\n`;
            sql += `--    (Check your source project to see what the WITH CHECK clause should be)\n\n`;
          });
          
          sql += `-- ============================================\n`;
          sql += `-- Total INSERT policies requiring manual creation: ${this.skippedInsertPolicies.length}\n`;
          sql += `-- ============================================\n\n`;
        }
      }
    }

    // Data migration
    if ((migrationType === 'data' || migrationType === 'both') && tableData) {
      sql += `\n-- ============================================
-- DATA MIGRATION
-- ============================================\n\n`;

      tables.forEach(table => {
        const data = tableData.get(table.name);
        if (data && data.length > 0) {
          sql += `-- Data for table: ${table.name} (${data.length} rows)\n`;
          sql += this.generateInsertDataSQL(table, data);
          sql += '\n\n';
        }
      });
    }

    sql += `-- Migration completed\n`;
    return sql;
  }

  downloadAsFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
