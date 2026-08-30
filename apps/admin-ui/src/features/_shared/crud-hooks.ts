import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-client";

import type { CrudApi, ListParams } from "./crud";

export function createCrudHooks<T extends { id: string | number }, TInput>(
  queryKey: string,
  api: CrudApi<T, TInput>,
  label?: string,
) {
  const noun = label ?? queryKey;

  function useList(params: ListParams) {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: () => api.list(params),
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (input: TInput) => api.create(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(`${noun} created`);
      },
      onError: (error) => toast.error(extractApiError(error)),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, input }: { id: string | number; input: Partial<TInput> }) =>
        api.update(id, input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(`${noun} updated`);
      },
      onError: (error) => toast.error(extractApiError(error)),
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string | number) => api.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(`${noun} deleted`);
      },
      onError: (error) => toast.error(extractApiError(error)),
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}