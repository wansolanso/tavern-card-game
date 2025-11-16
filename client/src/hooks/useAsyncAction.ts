import { useState, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

export interface AsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  loadingKey?: string;
  minLoadingTime?: number; // Minimum time to show loading state (prevents flashing)
}

export interface AsyncActionState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Custom hook for managing async operations with loading states
 *
 * Features:
 * - Automatic loading state management
 * - Error handling and tracking
 * - Success/error callbacks
 * - Minimum loading time to prevent spinner flashing
 * - Request cancellation on unmount
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useAsyncAction(
 *   async (id: string) => {
 *     const response = await apiClient.post('/games', { id });
 *     return response.data;
 *   },
 *   {
 *     onSuccess: (data) => console.log('Success!', data),
 *     onError: (error) => console.error('Failed:', error),
 *     minLoadingTime: 300 // Show spinner for at least 300ms
 *   }
 * );
 *
 * // In component
 * <Button onClick={() => execute('game-123')} isLoading={isLoading}>
 *   Create Game
 * </Button>
 * ```
 */
export const useAsyncAction = <T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options?: AsyncActionOptions<T>
) => {
  const [state, setState] = useState<AsyncActionState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const startTimeRef = useRef<number | null>(null);

  // Execute the async function
  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      const minLoadingTime = options?.minLoadingTime ?? 0;
      startTimeRef.current = Date.now();

      setState({
        data: null,
        error: null,
        isLoading: true,
      });

      try {
        logger.debug('Executing async action...', { args });
        const result = await asyncFn(...args);

        // Calculate remaining time to show loading state
        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        // Wait for minimum loading time if needed
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          });

          options?.onSuccess?.(result);
          logger.debug('Async action completed successfully');
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        logger.error('Async action failed:', error);

        if (isMountedRef.current) {
          setState({
            data: null,
            error,
            isLoading: false,
          });

          options?.onError?.(error);
        }

        throw error;
      }
    },
    [asyncFn, options]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  // Cleanup on unmount
  useCallback(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
};

/**
 * Simplified version for actions that don't return data
 */
export const useAsyncCallback = <Args extends any[]>(
  asyncFn: (...args: Args) => Promise<void>,
  options?: Omit<AsyncActionOptions<void>, 'onSuccess'>
) => {
  return useAsyncAction(asyncFn, options);
};
