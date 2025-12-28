import { useState } from 'react';
import { TokenInput } from './components/TokenInput';
import { ProjectSelector } from './components/ProjectSelector';
import { MigrationOptions } from './components/MigrationOptions';
import { CloneProgress } from './components/CloneProgress';
import { Results } from './components/Results';
import { ProjectCredentials, MigrationType } from './types';

type Step = 'token' | 'projects' | 'options' | 'cloning' | 'results';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('token');
  const [accessToken, setAccessToken] = useState('');
  const [sourceProject, setSourceProject] = useState<ProjectCredentials | null>(null);
  const [targetProject, setTargetProject] = useState<ProjectCredentials | null>(null);
  const [migrationType, setMigrationType] = useState<MigrationType>('schema');
  const [includeRLS, setIncludeRLS] = useState(true);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [cloneErrors, setCloneErrors] = useState<string[]>([]);

  const handleTokenValidated = (token: string) => {
    setAccessToken(token);
    setCurrentStep('projects');
  };

  const handleProjectsSelected = (source: ProjectCredentials, target: ProjectCredentials) => {
    setSourceProject(source);
    setTargetProject(target);
    setCurrentStep('options');
  };

  const handleOptionsSelected = (type: MigrationType, rls: boolean) => {
    setMigrationType(type);
    setIncludeRLS(rls);
    setCurrentStep('cloning');
  };

  const handleCloneComplete = (success: boolean, errors: string[] = []) => {
    setCloneSuccess(success);
    setCloneErrors(errors);
    setCurrentStep('results');
  };

  const handleReset = () => {
    setCurrentStep('token');
    setAccessToken('');
    setSourceProject(null);
    setTargetProject(null);
    setMigrationType('schema');
    setIncludeRLS(true);
    setCloneSuccess(false);
    setCloneErrors([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Supabase Project Cloner
          </h1>
          <p className="text-lg text-muted-foreground">
            Clone your Supabase project schema, storage, and policies with ease
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <StepIndicator step={1} label="Token" active={currentStep === 'token'} completed={currentStep !== 'token'} />
          <StepIndicator step={2} label="Projects" active={currentStep === 'projects'} completed={['options', 'cloning', 'results'].includes(currentStep)} />
          <StepIndicator step={3} label="Options" active={currentStep === 'options'} completed={['cloning', 'results'].includes(currentStep)} />
          <StepIndicator step={4} label="Migrate" active={currentStep === 'cloning'} completed={currentStep === 'results'} />
          <StepIndicator step={5} label="Done" active={currentStep === 'results'} completed={false} />
        </div>

        {currentStep === 'token' && (
          <TokenInput onTokenValidated={handleTokenValidated} />
        )}

        {currentStep === 'projects' && (
          <ProjectSelector
            accessToken={accessToken}
            onProjectsSelected={handleProjectsSelected}
            onBack={() => setCurrentStep('token')}
          />
        )}

        {currentStep === 'options' && sourceProject && (
          <MigrationOptions
            sourceProjectId={sourceProject.projectRef}
            onOptionsSelected={handleOptionsSelected}
            onBack={() => setCurrentStep('projects')}
          />
        )}

        {currentStep === 'cloning' && sourceProject && targetProject && (
          <CloneProgress
            source={sourceProject}
            target={targetProject}
            migrationType={migrationType}
            includeRLS={includeRLS}
            onComplete={handleCloneComplete}
          />
        )}

        {currentStep === 'results' && (
          <Results 
            success={cloneSuccess}
            errors={cloneErrors}
            sourceProjectId={sourceProject?.projectRef}
            targetProjectId={targetProject?.projectRef}
            onReset={handleReset}
            onBack={() => setCurrentStep('cloning')}
          />
        )}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
            completed
              ? 'bg-primary text-primary-foreground'
              : active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {step}
        </div>
        <span className="text-xs mt-1 text-muted-foreground">{label}</span>
      </div>
      {step < 5 && (
        <div
          className={`w-16 h-0.5 mb-5 transition-colors ${
            completed ? 'bg-primary' : 'bg-muted'
          }`}
        />
      )}
    </div>
  );
}

export default App;
