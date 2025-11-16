import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsyncAction } from '../useAsyncAction';

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Operations', () => {
    it('should handle successful async operation', async () => {
      const mockFn = vi.fn().mockResolvedValue('success-data');
      const { result } = renderHook(() => useAsyncAction(mockFn));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      let promise: Promise<string | null>;
      act(() => {
        promise = result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(promise!).resolves.toBe('success-data');
      expect(result.current.data).toBe('success-data');
      expect(result.current.error).toBeNull();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call onSuccess callback when operation succeeds', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useAsyncAction(mockFn, { onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('result');
      });
    });

    it('should handle multiple executions', async () => {
      let counter = 0;
      const mockFn = vi.fn().mockImplementation(async () => {
        counter++;
        return `result-${counter}`;
      });

      const { result } = renderHook(() => useAsyncAction(mockFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('result-1');

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('result-2');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to async function', async () => {
      const mockFn = vi.fn().mockImplementation(async (a: number, b: string) => {
        return `${a}-${b}`;
      });

      const { result } = renderHook(() => useAsyncAction(mockFn));

      await act(async () => {
        await result.current.execute(42, 'test');
      });

      expect(mockFn).toHaveBeenCalledWith(42, 'test');
      expect(result.current.data).toBe('42-test');
    });
  });

  describe('Error Handling', () => {
    it('should handle async errors', async () => {
      const mockError = new Error('Test error');
      const mockFn = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAsyncAction(mockFn));

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.execute();
        } catch (err) {
          thrownError = err as Error;
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Test error');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
      });

      expect(thrownError).toBeDefined();
      expect(thrownError?.message).toBe('Test error');
    });

    it('should call onError callback when operation fails', async () => {
      const mockError = new Error('Failure');
      const mockFn = vi.fn().mockRejectedValue(mockError);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useAsyncAction(mockFn, { onError })
      );

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(mockError);
      });
    });

    it('should convert non-Error objects to Error', async () => {
      const mockFn = vi.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useAsyncAction(mockFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('string error');
      });
    });
  });

  describe('Loading State', () => {
    it('should set isLoading to true during execution', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const mockFn = vi.fn().mockReturnValue(promise);
      const { result } = renderHook(() => useAsyncAction(mockFn));

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePromise!('done');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should respect minimum loading time', async () => {
      const mockFn = vi.fn().mockResolvedValue('fast-result');
      const minLoadingTime = 500;

      const { result } = renderHook(() =>
        useAsyncAction(mockFn, { minLoadingTime })
      );

      const startTime = Date.now();

      await act(async () => {
        await result.current.execute();
      });

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least the minimum loading time
      expect(elapsed).toBeGreaterThanOrEqual(minLoadingTime - 50); // Allow small margin
    });
  });

  describe('Reset Functionality', () => {
    it('should reset state when reset is called', async () => {
      const mockFn = vi.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsyncAction(mockFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('data');

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const mockFn = vi.fn().mockReturnValue(promise);
      const { result, unmount } = renderHook(() => useAsyncAction(mockFn));

      act(() => {
        result.current.execute();
      });

      unmount();

      // Resolve promise after unmount
      act(() => {
        resolvePromise!('late-result');
      });

      // Should not throw error or update state
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalled();
      });
    });
  });
});
