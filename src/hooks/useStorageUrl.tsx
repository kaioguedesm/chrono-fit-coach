import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private storage buckets
 * @param bucket - The storage bucket name ('avatars' or 'progress-photos')
 * @param path - The file path in the bucket
 * @param expiresIn - URL expiry time in seconds (default: 3600 = 1 hour)
 */
export function useStorageUrl(
  bucket: 'avatars' | 'progress-photos' | null,
  path: string | null,
  expiresIn: number = 3600
) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!bucket || !path) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const generateSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (signedUrlError) throw signedUrlError;

        if (isMounted) {
          setUrl(data?.signedUrl || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to generate signed URL'));
          setUrl(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [bucket, path, expiresIn]);

  return { url, loading, error };
}

/**
 * Utility function to get a signed URL directly (non-hook)
 */
export async function getSignedStorageUrl(
  bucket: 'avatars' | 'progress-photos',
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data?.signedUrl || null;
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return null;
  }
}
