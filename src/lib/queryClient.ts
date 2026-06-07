import { QueryClient } from '@tanstack/react-query';
import { AppFailure } from '@/api/errorMapper';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        // Don't retry auth/permission/validation failures — only transient ones.
        if (error instanceof AppFailure) {
          return error.code === 'network' && count < 2;
        }
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
