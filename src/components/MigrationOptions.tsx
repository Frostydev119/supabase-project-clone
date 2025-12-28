import { useState } from 'react';
import { Settings, ArrowRight, Info } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { RLSSetupInstructions } from './RLSSetupInstructions';
import { MigrationType } from '../types';

interface MigrationOptionsProps {
  sourceProjectId: string;
  onOptionsSelected: (type: MigrationType, includeRLS: boolean) => void;
  onBack: () => void;
}

export function MigrationOptions({ sourceProjectId, onOptionsSelected, onBack }: MigrationOptionsProps) {
  const [migrationType, setMigrationType] = useState<MigrationType>('schema');
  const [includeRLS, setIncludeRLS] = useState(true);
  const [showRLSInstructions, setShowRLSInstructions] = useState(false);

  const handleContinue = () => {
    onOptionsSelected(migrationType, includeRLS);
  };

  if (showRLSInstructions) {
    return (
      <RLSSetupInstructions 
        sourceProjectId={sourceProjectId}
        onClose={() => setShowRLSInstructions(false)} 
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Migration Options
        </CardTitle>
        <CardDescription>
          Choose what you want to migrate from your source project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">What do you want to migrate?</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="migrationType"
                  value="schema"
                  checked={migrationType === 'schema'}
                  onChange={(e) => setMigrationType(e.target.value as MigrationType)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Schema Only</div>
                  <div className="text-sm text-muted-foreground">
                    Migrate table structures, columns, constraints, and optionally RLS policies
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="migrationType"
                  value="data"
                  checked={migrationType === 'data'}
                  onChange={(e) => setMigrationType(e.target.value as MigrationType)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Data Only</div>
                  <div className="text-sm text-muted-foreground">
                    Export existing data from tables (requires existing schema in target)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="migrationType"
                  value="both"
                  checked={migrationType === 'both'}
                  onChange={(e) => setMigrationType(e.target.value as MigrationType)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Schema + Data</div>
                  <div className="text-sm text-muted-foreground">
                    Migrate both table structures and all existing data
                  </div>
                </div>
              </label>
            </div>
          </div>

          {(migrationType === 'schema' || migrationType === 'both') && (
            <div className="pt-4 border-t space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRLS}
                  onChange={(e) => setIncludeRLS(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">Include RLS Policies</div>
                  <div className="text-xs text-muted-foreground">
                    Include Row Level Security policies in the migration file
                  </div>
                </div>
              </label>

              {includeRLS && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-900 dark:text-blue-100 font-medium">
                        RLS policies require a one-time setup
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        You need to create a helper function in your source project to fetch RLS policies automatically.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRLSInstructions(true)}
                    className="w-full text-xs"
                  >
                    Show Setup Instructions
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> A SQL file will be generated and downloaded. You'll need to run it manually in your target project's SQL Editor.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
