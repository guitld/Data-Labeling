import { useState, useCallback } from 'react';

interface UseApiCallOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useApiCall = (options: UseApiCallOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    apiCall: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (options.onSuccess) {
        options.onSuccess();
      }
      
      if (successMessage) {
        console.log(successMessage);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      console.error('API call failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
};
