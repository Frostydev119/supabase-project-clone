import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { CloneProgress as CloneProgressType, ProjectCredentials, MigrationType } from '../types';
import { CloneService } from '../services/cloneService';

interface CloneProgressProps {
  source: ProjectCredentials;
  target: ProjectCredentials;
  migrationType: MigrationType;
  includeRLS: boolean;
  onComplete: (success: boolean, errors?: string[]) => void;
}

export function CloneProgress({ source, target, migrationType, includeRLS, onComplete }: CloneProgressProps) {
  const [progress, setProgress] = useState<CloneProgressType[]>([]);
  const [isCloning, setIsCloning] = useState(true);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode (development)
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    startCloning();
  }, []);

  const startCloning = async () => {
    const cloneService = new CloneService();
    
    const result = await cloneService.cloneProject(
      source,
      target,
      migrationType,
      includeRLS,
      (progressUpdate) => {
        setProgress((prev) => [...prev, progressUpdate]);
      }
    );

    setIsCloning(false);
    onComplete(result.success, result.errors);
  };

  const getStatusIcon = (status: CloneProgressType['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-6 w-6" />
          Cloning in Progress
        </CardTitle>
        <CardDescription>
          {isCloning ? 'Please wait while we clone your project...' : 'Cloning process completed'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progress.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(item.status)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{item.step}</p>
                {item.message && (
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                )}
                {item.error && (
                  <p className="text-sm text-destructive">{item.error}</p>
                )}
              </div>
            </div>
          ))}
          
          {isCloning && progress.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
