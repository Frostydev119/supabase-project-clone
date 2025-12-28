import { CloneProgress, CloneResult, ProjectCredentials, MigrationType } from '../types';
import { SchemaCloner } from './schemaCloner';
import { StorageCloner } from './storageCloner';
import { MigrationGenerator } from './migrationGenerator';

export class CloneService {
  async cloneProject(
    source: ProjectCredentials,
    target: ProjectCredentials,
    migrationType: MigrationType,
    includeRLS: boolean,
    onProgress: (progress: CloneProgress) => void
  ): Promise<CloneResult> {
    const steps: CloneProgress[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const updateProgress = (step: string, status: CloneProgress['status'], message?: string, error?: string) => {
      const progress: CloneProgress = { step, status, message, error };
      steps.push(progress);
      onProgress(progress);
    };

    try {
      const sourceUrl = `https://${source.projectRef}.supabase.co`;
      const targetUrl = `https://${target.projectRef}.supabase.co`;
      const sourceKey = source.serviceRoleKey || '';
      const targetKey = target.serviceRoleKey || '';

      updateProgress('validation', 'in-progress', 'Validating credentials...');
      
      if (!sourceKey || !targetKey) {
        throw new Error('Service role keys are required for both projects');
      }

      updateProgress('validation', 'completed', 'Credentials validated');

      const schemaCloner = new SchemaCloner(
        sourceUrl, 
        sourceKey, 
        targetUrl, 
        targetKey,
        source.projectRef,
        target.projectRef
      );

      let tables;
      let policies;
      let tableData;

      // Fetch schema
      if (migrationType === 'schema' || migrationType === 'both') {
        updateProgress('schema', 'in-progress', 'Analyzing source schema...');
        try {
          tables = await schemaCloner.cloneSchema((message) => {
            updateProgress('schema', 'in-progress', message);
          });
          
          if (tables.length > 0) {
            updateProgress('schema', 'completed', `Found ${tables.length} tables`);
          } else {
            updateProgress('schema', 'completed', 'No tables found in source project');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          updateProgress('schema', 'error', 'Schema analysis failed', errorMsg);
          errors.push(`Schema: ${errorMsg}`);
        }

        // Fetch RLS policies if requested
        if (includeRLS && tables && tables.length > 0) {
          updateProgress('rls', 'in-progress', 'Fetching RLS policies...');
          try {
            policies = await schemaCloner.fetchRLSPolicies((message) => {
              updateProgress('rls', 'in-progress', message);
            });
            updateProgress('rls', 'completed', `Found ${policies.length} RLS policies`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            updateProgress('rls', 'error', 'RLS fetch failed', errorMsg);
            errors.push(`RLS: ${errorMsg}`);
          }
        }
      }

      // Fetch data
      if (migrationType === 'data' || migrationType === 'both') {
        if (!tables) {
          updateProgress('data', 'in-progress', 'Fetching schema for data export...');
          tables = await schemaCloner.cloneSchema((message) => {
            updateProgress('data', 'in-progress', message);
          });
        }

        if (tables && tables.length > 0) {
          updateProgress('data', 'in-progress', 'Fetching table data...');
          try {
            tableData = await schemaCloner.fetchAllTableData(tables, (message) => {
              updateProgress('data', 'in-progress', message);
            });
            
            const totalRows = Array.from(tableData.values()).reduce((sum, data) => sum + data.length, 0);
            updateProgress('data', 'completed', `Fetched ${totalRows} total rows from ${tables.length} tables`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            updateProgress('data', 'error', 'Data fetch failed', errorMsg);
            errors.push(`Data: ${errorMsg}`);
          }
        }
      }

      // Generate migration file
      if (tables && tables.length > 0) {
        updateProgress('migration', 'in-progress', 'Generating migration file...');
        try {
          const migrationGen = new MigrationGenerator();
          const migrationSQL = migrationGen.generateFullMigration(
            tables,
            policies || [],
            migrationType,
            includeRLS,
            tableData
          );
          
          const filename = `supabase_migration_${migrationType}_${Date.now()}.sql`;
          migrationGen.downloadAsFile(migrationSQL, filename);
          
          updateProgress('migration', 'completed', `Migration file downloaded: ${filename}`);
          warnings.push('Migration SQL file has been downloaded. Run it in your target project\'s SQL Editor.');
          
          // Check if there are INSERT policies that need manual creation
          const hasSkippedInsertPolicies = migrationSQL.includes('MANUAL ACTION REQUIRED');
          if (hasSkippedInsertPolicies) {
            warnings.push('⚠️ IMPORTANT: Some INSERT policies require manual creation. See instructions in the downloaded SQL file.');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          updateProgress('migration', 'error', 'Migration generation failed', errorMsg);
          errors.push(`Migration: ${errorMsg}`);
        }
      }

      updateProgress('storage', 'in-progress', 'Cloning storage buckets...');
      const storageCloner = new StorageCloner(sourceUrl, sourceKey, targetUrl, targetKey);
      
      try {
        await storageCloner.cloneBuckets((message) => {
          updateProgress('storage', 'in-progress', message);
        });
        updateProgress('storage', 'completed', 'Storage bucket configurations created');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        updateProgress('storage', 'error', 'Storage cloning failed', errorMsg);
        errors.push(`Storage: ${errorMsg}`);
      }

      if (warnings.length > 0) {
        updateProgress('instructions', 'completed', 'Manual steps required - see details below');
      }

      updateProgress('complete', 'completed', 'Analysis completed!');

      return {
        success: errors.length === 0,
        steps,
        errors: [...errors, ...warnings],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProgress('error', 'error', 'Process failed', errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        steps,
        errors,
      };
    }
  }
}
