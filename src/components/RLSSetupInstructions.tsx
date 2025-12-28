import { AlertCircle, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

const SETUP_SQL = `-- Run this SQL in your SOURCE project's SQL Editor
CREATE OR REPLACE FUNCTION get_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  cmd text,
  qual text,
  with_check text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_policies() TO service_role;`;

interface RLSSetupInstructionsProps {
  sourceProjectId?: string;
  onClose?: () => void;
}

export function RLSSetupInstructions({ sourceProjectId, onClose }: RLSSetupInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlEditorUrl = sourceProjectId 
    ? `https://supabase.com/dashboard/project/${sourceProjectId}/sql/`
    : null;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-blue-600" />
          Enable Automatic RLS Policy Fetching
        </CardTitle>
        <CardDescription>
          To automatically include RLS policies in your migration, you need to set up a helper function in your source project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Why is this needed?
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Supabase doesn't expose the PostgreSQL system catalog (pg_policies) through the REST API for security reasons. 
            To fetch RLS policies, we need to create a custom function in your database that can read these policies and expose them safely.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Follow these steps:</p>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-medium">Open your SOURCE project in Supabase</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Go to your Supabase dashboard and select the project you want to clone FROM
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-medium">Navigate to SQL Editor</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    In the left sidebar, click on "SQL Editor"
                  </p>
                  {sqlEditorUrl && (
                    <a
                      href={sqlEditorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Open SQL Editor for your source project
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <div className="flex-1">
                  <p className="font-medium">Copy and run the SQL below</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the "Copy SQL" button, paste it into the SQL Editor, and click "Run"
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  4
                </span>
                <div className="flex-1">
                  <p className="font-medium">Return to this app and continue</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Once the function is created, RLS policies will be automatically included in your migrations
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SQL to run in your source project:</label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
              <code>{SETUP_SQL}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Notes:
          </p>
          <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
            <li>You only need to do this ONCE per source project</li>
            <li>This function is safe and only reads policy information</li>
            <li>If you skip this step, you'll need to manually copy RLS policies</li>
            <li>The function uses SECURITY DEFINER to safely access system catalogs</li>
          </ul>
        </div>

        {onClose && (
          <Button onClick={onClose} className="w-full">
            I've Set Up the Function (or Skip)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
