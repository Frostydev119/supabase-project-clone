import { StorageBucket } from '../types';

export class StorageCloner {
  private sourceUrl: string;
  private targetUrl: string;
  private sourceKey: string;
  private targetKey: string;

  constructor(
    sourceUrl: string,
    sourceKey: string,
    targetUrl: string,
    targetKey: string
  ) {
    this.sourceUrl = sourceUrl;
    this.targetUrl = targetUrl;
    this.sourceKey = sourceKey;
    this.targetKey = targetKey;
  }

  async getBuckets(): Promise<StorageBucket[]> {
    try {
      const response = await fetch(`${this.sourceUrl}/storage/v1/bucket`, {
        headers: {
          'apikey': this.sourceKey,
          'Authorization': `Bearer ${this.sourceKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch storage buckets');
      }

      return await response.json();
    } catch (error) {
      console.warn('Could not fetch storage buckets:', error);
      return [];
    }
  }

  async cloneBuckets(onProgress: (message: string) => void): Promise<void> {
    onProgress('Fetching storage buckets...');
    const buckets = await this.getBuckets();

    onProgress(`Found ${buckets.length} storage buckets to clone`);

    for (const bucket of buckets) {
      onProgress(`Creating bucket: ${bucket.name}`);
      await this.createBucket(bucket);
    }

    onProgress('Storage buckets cloning completed');
  }

  private async createBucket(bucket: StorageBucket): Promise<void> {
    try {
      const response = await fetch(`${this.targetUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'apikey': this.targetKey,
          'Authorization': `Bearer ${this.targetKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucket.id,
          name: bucket.name,
          public: bucket.public,
          file_size_limit: bucket.file_size_limit,
          allowed_mime_types: bucket.allowed_mime_types,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn(`Could not create bucket ${bucket.name}:`, error);
      }
    } catch (error) {
      console.warn(`Could not create bucket ${bucket.name}:`, error);
    }
  }

  async getBucketPolicies(bucketId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.sourceUrl}/storage/v1/bucket/${bucketId}/policies`,
        {
          headers: {
            'apikey': this.sourceKey,
            'Authorization': `Bearer ${this.sourceKey}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Could not fetch policies for bucket ${bucketId}:`, error);
    }

    return [];
  }
}
