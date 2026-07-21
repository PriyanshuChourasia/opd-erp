import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Stethoscope } from "lucide-react";
import { fetchDiagnoses, createDiagnosis, type Diagnosis } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Input } from "@/components/ui/input";

interface DiagnosisSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DiagnosisSelect({ value, onChange, placeholder }: DiagnosisSelectProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: response } = useQuery({
    queryKey: ["diagnoses", "select"],
    queryFn: () => fetchDiagnoses({ limit: 100 }),
  });

  const catalog = response?.data ?? [];
  const trimmed = value.trim().toLowerCase();
  const suggestions = trimmed
    ? catalog.filter((d) => d.name.toLowerCase().includes(trimmed))
    : catalog;
  const exactMatch = trimmed ? catalog.some((d) => d.name.toLowerCase() === trimmed) : true;

  const createMutation = useMutation({
    mutationFn: createDiagnosis,
    onSuccess: (diagnosis: Diagnosis) => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      onChange(diagnosis.name);
      setOpen(false);
      toast.success(`"${diagnosis.name}" added to diagnosis catalog`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder ?? "Search or type a diagnosis..."}
            className="pl-9"
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-none border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          onClick={() => { onChange(""); setOpen(true); }}
        >
          <Plus className="size-3.5" />
          New
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-64 overflow-y-auto">
          {suggestions.length > 0 && (
            <div className="divide-y">
              {suggestions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => select(d.name)}
                >
                  <Stethoscope className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{d.name}</span>
                  {d.icdCode && <span className="text-[10px] text-muted-foreground">{d.icdCode}</span>}
                </button>
              ))}
            </div>
          )}
          {trimmed.length > 0 && !exactMatch && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
              onClick={() => createMutation.mutate({ name: value.trim() })}
              disabled={createMutation.isPending}
            >
              <Plus className="size-3.5" /> Add "{value.trim()}" to catalog
            </button>
          )}
          {suggestions.length === 0 && trimmed.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No diagnoses in catalog yet</p>
          )}
        </div>
      )}
    </div>
  );
}
