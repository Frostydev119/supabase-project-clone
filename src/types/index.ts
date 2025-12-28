export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
  status?: string;
  database?: {
    host: string;
    version: string;
  };
}

export interface ProjectCredentials {
  projectId: string;
  projectRef: string;
  dbPassword: string;
  serviceRoleKey?: string;
}

export type MigrationType = 'schema' | 'data' | 'both';

export interface MigrationOptions {
  type: MigrationType;
  includeRLS: boolean;
}

export interface CloneProgress {
  step: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
  error?: string;
}

export interface CloneResult {
  success: boolean;
  steps: CloneProgress[];
  errors: string[];
}

export interface DatabaseTable {
  schema: string;
  name: string;
  columns: DatabaseColumn[];
  constraints: DatabaseConstraint[];
  indexes: DatabaseIndex[];
  policies: RLSPolicy[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface DatabaseConstraint {
  name: string;
  type: string;
  definition: string;
}

export interface DatabaseIndex {
  name: string;
  definition: string;
}

export interface RLSPolicy {
  name: string;
  table: string;
  command: string;
  definition: string;
  check?: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

export interface AuthSettings {
  site_url?: string;
  external_email_enabled?: boolean;
  external_phone_enabled?: boolean;
  mailer_autoconfirm?: boolean;
  sms_autoconfirm?: boolean;
}
