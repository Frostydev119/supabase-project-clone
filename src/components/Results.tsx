import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, FileDown, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { RLSSetupInstructions } from './RLSSetupInstructions';

interface ResultsProps {
  success: boolean;
  errors?: string[];
  sourceProjectId?: string;
  targetProjectId?: string;
  onReset: () => void;
  onBack?: () => void;
}

export function Results({ success, errors = [], sourceProjectId, targetProjectId, onReset, onBack }: ResultsProps) {
  const [showRLSInstructions, setShowRLSInstructions] = useState(false);

  if (showRLSInstructions) {
    return (
      <div className="space-y-4">
        <RLSSetupInstructions 
          sourceProjectId={sourceProjectId}
          onClose={() => setShowRLSInstructions(false)} 
        />
        <Button onClick={onReset} variant="outline" className="w-full max-w-3xl mx-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>
    );
  }
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {success ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Analysis Complete!
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-destructive" />
              Analysis Completed with Errors
            </>
          )}
        </CardTitle>
        <CardDescription>
          {success
            ? 'Schema analysis completed. Follow the steps below to complete the migration.'
            : 'The analysis completed but some errors occurred. Check the logs above for details.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <FileDown className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Step 1: Run the Migration SQL
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1 mb-2">
                    A migration SQL file has been downloaded. Open your target project's SQL Editor and run this file to create the database schema.
                  </p>
                  <div className="rounded bg-yellow-100 dark:bg-yellow-900 p-2 mb-2">
                    <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                      ⚠️ IMPORTANT: Check the SQL file for manual steps!
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                      If you have INSERT policies, they require manual creation. Look for the "MANUAL ACTION REQUIRED" section at the end of the SQL file with step-by-step instructions.
                    </p>
                  </div>
                  {targetProjectId && (
                    <a
                      href={`https://supabase.com/dashboard/project/${targetProjectId}/sql/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Open SQL Editor for your target project
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <ExternalLink className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Step 2: Verify RLS Policies
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1 mb-2">
                    If RLS policies weren't included in the migration file (check the comment at the top showing "RLS Policies: 0"), you need to set up the helper function first.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRLSInstructions(true)}
                    className="text-xs"
                  >
                    View RLS Setup Instructions
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                What was analyzed/created:
              </p>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                <li>Database schema (SQL migration file downloaded)</li>
                <li>Storage bucket configurations (automatically created)</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 space-y-3">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Errors occurred during analysis:
              </p>
              {errors.length > 0 ? (
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-800 dark:text-red-200">
                  Some components could not be analyzed. Please check your project settings and try again.
                </p>
              )}
            </div>

            {onBack && (
              <Button onClick={onBack} variant="outline" className="w-full">
                View Progress Details
              </Button>
            )}
          </>
        )}

        <Button onClick={onReset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Analyze Another Project
        </Button>
      </CardContent>
    </Card>
  );
}
