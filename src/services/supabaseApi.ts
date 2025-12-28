import { SupabaseProject } from '../types';

// Use Netlify function in production, local proxy in development
const API_URL = import.meta.env.DEV 
  ? 'http://localhost:8888/.netlify/functions/proxy'
  : '/.netlify/functions/proxy';

export class SupabaseApiService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getProjects(): Promise<SupabaseProject[]> {
    return this.fetch('/projects');
  }

  async getProject(projectRef: string): Promise<SupabaseProject> {
    return this.fetch(`/projects/${projectRef}`);
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.getProjects();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export async function createSupabaseClient(projectUrl: string, serviceRoleKey: string) {
  return {
    projectUrl,
    serviceRoleKey,
    async fetch(endpoint: string, options: RequestInit = {}) {
      const response = await fetch(`${projectUrl}${endpoint}`, {
        ...options,
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase API Error: ${response.status} - ${error}`);
      }

      return response.json();
    },
  };
}
