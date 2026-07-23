import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Stethoscope, X } from "lucide-react";
import { fetchDiagnoses, createDiagnosis, type Diagnosis } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Input } from "@/components/ui/input";

interface DiagnosisSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function DiagnosisSelect({ value, onChange, placeholder }: DiagnosisSelectProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: response } = useQuery({
    queryKey: ["diagnoses", "select"],
    queryFn: () => fetchDiagnoses({ limit: 100 }),
  });

  const catalog = response?.data ?? [];
  const trimmed = query.trim().toLowerCase();
  const suggestions = trimmed
    ? catalog.filter(
        (d) =>
          d.name.toLowerCase().includes(trimmed) &&
          !value.includes(d.name),
      )
    : catalog.filter((d) => !value.includes(d.name));
  const exactMatch = trimmed
    ? catalog.some((d) => d.name.toLowerCase() === trimmed)
    : false;

  const createMutation = useMutation({
    mutationFn: createDiagnosis,
    onSuccess: (diagnosis: Diagnosis) => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      addDiagnosis(diagnosis.name);
      setQuery("");
      setOpen(false);
      toast.success(`"${diagnosis.name}" added to diagnosis catalog`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function addDiagnosis(name: string) {
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
    setQuery("");
    setOpen(false);
  }

  function removeDiagnosis(name: string) {
    onChange(value.filter((d) => d !== name));
  }

  return (
    <div className="relative space-y-2">
      {/* Selected diagnosis tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-none border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
            >
              <Stethoscope className="size-3 shrink-0" />
              <span>{d}</span>
              <button
                type="button"
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-primary/60 hover:bg-primary/10 hover:text-primary"
                onClick={() => removeDiagnosis(d)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder ?? "Search or type to add a diagnosis..."}
          className="pl-9"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-64 overflow-y-auto">
          {suggestions.length > 0 && (
            <div className="divide-y">
              {suggestions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => addDiagnosis(d.name)}
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
              onClick={() => createMutation.mutate({ name: query.trim() })}
              disabled={createMutation.isPending}
            >
              <Plus className="size-3.5" /> Add "{query.trim()}" to catalog
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
