import { useState, useEffect } from 'react';
import { Database, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { SupabaseProject, ProjectCredentials } from '../types';
import { SupabaseApiService } from '../services/supabaseApi';

interface ProjectSelectorProps {
  accessToken: string;
  onProjectsSelected: (source: ProjectCredentials, target: ProjectCredentials) => void;
  onBack: () => void;
}

export function ProjectSelector({ accessToken, onProjectsSelected, onBack }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sourceProjectId, setSourceProjectId] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [sourceServiceKey, setSourceServiceKey] = useState('');
  const [targetServiceKey, setTargetServiceKey] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const api = new SupabaseApiService(accessToken);
      const projectsList = await api.getProjects();
      // Filter to only show active projects
      const activeProjects = projectsList.filter(project => 
        !project.status || project.status.toLowerCase() === 'active_healthy' || project.status.toLowerCase() === 'active'
      );
      setProjects(activeProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!sourceProjectId || !targetProjectId) {
      setError('Please select both source and target projects');
      return;
    }

    if (sourceProjectId === targetProjectId) {
      setError('Source and target projects must be different');
      return;
    }

    if (!sourceServiceKey || !targetServiceKey) {
      setError('Please enter service role keys for both projects');
      return;
    }

    const sourceProject = projects.find(p => p.id === sourceProjectId);
    const targetProject = projects.find(p => p.id === targetProjectId);

    if (!sourceProject || !targetProject) {
      setError('Invalid project selection');
      return;
    }

    onProjectsSelected(
      {
        projectId: sourceProject.id,
        projectRef: sourceProject.id,
        dbPassword: '',
        serviceRoleKey: sourceServiceKey,
      },
      {
        projectId: targetProject.id,
        projectRef: targetProject.id,
        dbPassword: '',
        serviceRoleKey: targetServiceKey,
      }
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Select Projects
        </CardTitle>
        <CardDescription>
          Choose the source project to clone from and the target project to clone to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Project</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={sourceProjectId}
              onChange={(e) => setSourceProjectId(e.target.value)}
            >
              <option value="">Select source project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.region})
                </option>
              ))}
            </select>
          </div>

          {sourceProjectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Service Role Key</label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={sourceServiceKey}
                onChange={(e) => setSourceServiceKey(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Find this in your project settings under API
                </p>
                <a
                  href={`https://supabase.com/dashboard/project/${sourceProjectId}/settings/api-keys/legacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Project</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
            >
              <option value="">Select target project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id} disabled={project.id === sourceProjectId}>
                  {project.name} ({project.region})
                </option>
              ))}
            </select>
          </div>

          {targetProjectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Service Role Key</label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={targetServiceKey}
                onChange={(e) => setTargetServiceKey(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Find this in your project settings under API
                </p>
                <a
                  href={`https://supabase.com/dashboard/project/${targetProjectId}/settings/api-keys/legacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!sourceProjectId || !targetProjectId || !sourceServiceKey || !targetServiceKey}
            className="flex-1"
          >
            Start Cloning
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
