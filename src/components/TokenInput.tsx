import { useState } from 'react';
import { Key, Loader2, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface TokenInputProps {
  onTokenValidated: (token: string) => void;
}

export function TokenInput({ onTokenValidated }: TokenInputProps) {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!token.trim()) {
      setError('Please enter your Supabase Access Token');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Use Netlify function in production, local in development
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/proxy'
        : '/.netlify/functions/proxy';
      
      const response = await fetch(`${apiUrl}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid or expired token. Please check your access token.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Make sure your token has the correct permissions.');
        } else {
          throw new Error(`API Error (${response.status}): ${errorText || 'Unable to fetch projects'}`);
        }
      }

      const data = await response.json();
      console.log('Successfully fetched projects:', data.length);
      onTokenValidated(token);
    } catch (err) {
      console.error('Token validation error:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to Supabase API. Check your internet connection or try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to validate token');
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-6 w-6" />
          Supabase Access Token
        </CardTitle>
        <CardDescription>
          Enter your Supabase Access Token to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Don't have a token?</strong>
          </p>
          <a
            href="https://supabase.com/dashboard/account/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create a new access token
            <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
            💡 <strong>Security tip:</strong> Set your token to expire in 1 hour for enhanced security when using this tool.
          </p>
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="sbp_xxxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            disabled={isValidating}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <Button
          onClick={handleValidate}
          disabled={isValidating || !token.trim()}
          className="w-full"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
