import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBills, updateBillStatus } from "./api";
import type { BillStatus } from "./interface";

export function useBills() {
  return useQuery({ queryKey: ["bills"], queryFn: fetchBills, refetchInterval: 15_000 });
}

export function useUpdateBillStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillStatus }) => updateBillStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}
