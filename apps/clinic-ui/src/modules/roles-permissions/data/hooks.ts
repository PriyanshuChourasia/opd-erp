import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoles, fetchRole, createRole, updateRole, deleteRole, fetchPermissions, createPermission, deletePermission } from "./api";
import type { CreateRoleInput } from "./interface";

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
}

export function useRole(id: string) {
  return useQuery({ queryKey: ["role", id], queryFn: () => fetchRole(id), enabled: !!id });
}

export function usePermissions() {
  return useQuery({ queryKey: ["permissions"], queryFn: fetchPermissions });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast.success("Role created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleInput> }) => updateRole(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast.success("Role updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast.success("Role deleted successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
}
