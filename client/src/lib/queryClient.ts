import { QueryClient, QueryFunction } from "@tanstack/react-query";

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const res = await fetch(queryKey[0] as string, { credentials: "include" });
  if (!res.ok) {
    const message = `Request failed: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
  return res;
}