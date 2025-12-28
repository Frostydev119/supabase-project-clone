import { DatabaseTable, RLSPolicy } from '../types';

export class SchemaCloner {
  private sourceUrl: string;
  private sourceKey: string;

  constructor(
    sourceUrl: string,
    sourceKey: string,
    _targetUrl: string,
    _targetKey: string,
    _sourceProjectRef: string,
    _targetProjectRef: string
  ) {
    this.sourceUrl = sourceUrl;
    this.sourceKey = sourceKey;
    // Target parameters are kept for API compatibility but not used
    // as this class only reads from the source project
  }

  async getTables(): Promise<DatabaseTable[]> {
    const response = await fetch(`${this.sourceUrl}/rest/v1/`, {
      headers: {
        'apikey': this.sourceKey,
        'Authorization': `Bearer ${this.sourceKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tables from source project');
    }

    const openApiSpec = await response.json();
    const tables: DatabaseTable[] = [];

    if (openApiSpec.definitions) {
      for (const [tableName, definition] of Object.entries(openApiSpec.definitions)) {
        if (typeof definition === 'object' && definition !== null && 'properties' in definition) {
          const props = (definition as any).properties;
          const columns = Object.entries(props).map(([name, prop]: [string, any]) => {
            // Determine the actual PostgreSQL type based on format
            let type = prop.type || 'unknown';
            
            // Check for specific formats that indicate PostgreSQL types
            if (prop.format) {
              if (prop.format === 'uuid') {
                type = 'uuid';
              } else if (prop.format === 'timestamp' || prop.format === 'date-time') {
                type = 'timestamp';
              } else if (prop.format === 'date') {
                type = 'date';
              } else if (prop.format === 'time') {
                type = 'time';
              } else if (prop.format === 'int4' || prop.format === 'integer') {
                type = 'integer';
              } else if (prop.format === 'int8' || prop.format === 'bigint') {
                type = 'bigint';
              } else if (prop.format === 'numeric' || prop.format === 'decimal') {
                type = 'numeric';
              }
            }
            
            return {
              name,
              type,
              nullable: !((definition as any).required || []).includes(name),
              default: prop.default,
            };
          });

          tables.push({
            schema: 'public',
            name: tableName,
            columns,
            constraints: [],
            indexes: [],
            policies: [],
          });
        }
      }
    }

    return tables;
  }

  async getRLSPolicies(): Promise<RLSPolicy[]> {
    // Unfortunately, Supabase doesn't expose pg_policies through the REST API directly
    // We need to use a workaround by creating a helper function
    
    // First, try to call a helper function if it exists
    try {
      const response = await fetch(`${this.sourceUrl}/rest/v1/rpc/get_policies`, {
        method: 'POST',
        headers: {
          'apikey': this.sourceKey,
          'Authorization': `Bearer ${this.sourceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        return data.map((row: any) => {
          // Clean up the definition and check values
          const definition = row.qual || row.definition || row.using;
          const check = row.with_check || row.check;
          
          return {
            name: row.policyname || row.name,
            table: row.tablename || row.table,
            command: row.cmd || row.command,
            // Only include definition if it's not null/undefined
            definition: definition && definition !== 'null' ? definition : undefined,
            // Only include check if it's not null/undefined
            check: check && check !== 'null' ? check : undefined,
          };
        });
      }
    } catch (error) {
      console.warn('Helper function get_policies not found:', error);
    }

    // If helper function doesn't exist, return empty array
    // User will need to manually copy RLS policies
    console.warn('RLS policies cannot be automatically fetched. Please create a helper function or copy policies manually.');
    console.warn('To enable automatic RLS fetching, run this SQL in your source project:');
    console.warn(`
      CREATE OR REPLACE FUNCTION get_policies()
      RETURNS TABLE (
        schemaname text,
        tablename text,
        policyname text,
        cmd text,
        qual text,
        with_check text
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          p.schemaname::text,
          p.tablename::text,
          p.policyname::text,
          p.cmd::text,
          p.qual::text,
          p.with_check::text
        FROM pg_policies p
        WHERE p.schemaname = 'public';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    return [];
  }

  async cloneSchema(onProgress: (message: string) => void): Promise<DatabaseTable[]> {
    onProgress('Fetching source schema...');
    const tables = await this.getTables();

    onProgress(`Found ${tables.length} tables in source project`);

    if (tables.length === 0) {
      onProgress('No tables found to clone');
    } else {
      onProgress(`Schema information retrieved: ${tables.map(t => t.name).join(', ')}`);
    }

    return tables;
  }

  async fetchRLSPolicies(onProgress: (message: string) => void): Promise<RLSPolicy[]> {
    onProgress('Fetching RLS policies...');
    const policies = await this.getRLSPolicies();
    
    if (policies.length > 0) {
      onProgress(`Found ${policies.length} RLS policies`);
    } else {
      onProgress('No RLS policies found (or unable to fetch them)');
    }
    
    return policies;
  }

  async fetchTableData(tableName: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.sourceUrl}/rest/v1/${tableName}?select=*`, {
        headers: {
          'apikey': this.sourceKey,
          'Authorization': `Bearer ${this.sourceKey}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Could not fetch data for table ${tableName}:`, error);
    }

    return [];
  }

  async fetchAllTableData(tables: DatabaseTable[], onProgress: (message: string) => void): Promise<Map<string, any[]>> {
    const tableData = new Map<string, any[]>();
    
    for (const table of tables) {
      onProgress(`Fetching data from ${table.name}...`);
      const data = await this.fetchTableData(table.name);
      tableData.set(table.name, data);
      onProgress(`Fetched ${data.length} rows from ${table.name}`);
    }
    
    return tableData;
  }
}
