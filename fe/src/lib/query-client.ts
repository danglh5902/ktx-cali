import { QueryClient } from "@tanstack/react-query";
import { SessionExpiredError } from "./api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof SessionExpiredError) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
    },
  },
});
