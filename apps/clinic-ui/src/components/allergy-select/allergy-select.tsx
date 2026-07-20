import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import {
  fetchAllergies,
  createAllergy,
  type Allergy,
  type AllergySeverity,
  type AllergyCategory,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AllergySelectProps {
  value: string[];
  onChange: (allergies: string[]) => void;
  /** When true, the selected-allergy badges are hidden — useful when displayed elsewhere. */
  hideSelected?: boolean;
}

export function AllergySelect({ value, onChange, hideSelected }: AllergySelectProps) {
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<AllergyCategory>("OTHER");
  const [newSeverity, setNewSeverity] = useState<AllergySeverity>("MODERATE");

  const { data: response } = useQuery({
    queryKey: ["allergies", "select"],
    queryFn: () => fetchAllergies({ limit: 100 }),
  });

  const catalog = response?.data ?? [];

  const availableAllergies = useMemo(
    () => catalog.filter((a) => !value.includes(a.name)),
    [catalog, value],
  );

  const filtered = useMemo(
    () =>
      search.trim().length >= 1
        ? availableAllergies.filter((a) =>
            a.name.toLowerCase().includes(search.trim().toLowerCase()),
          )
        : availableAllergies,
    [availableAllergies, search],
  );

  const createMutation = useMutation({
    mutationFn: createAllergy,
    onSuccess: (allergy: Allergy) => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      onChange([...value, allergy.name]);
      setCreateOpen(false);
      setNewName("");
      setSearch("");
      setShowResults(false);
      toast.success(`"${allergy.name}" added to allergy catalog`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function addAllergy(name: string) {
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
    setSearch("");
    setShowResults(false);
    searchRef.current?.focus();
  }

  function removeAllergy(name: string) {
    onChange(value.filter((a) => a !== name));
  }

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName.trim(),
      category: newCategory,
      severity: newSeverity,
    });
  }

  return (
    <div className="space-y-2">
      {/* Selected allergies (hidden when hideSelected is true) */}
      {!hideSelected && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((name) => (
            <Badge
              key={name}
              variant="outline"
              className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 pr-1"
            >
              <AlertTriangle className="mr-1 size-2.5" />
              {name}
              <button
                type="button"
                onClick={() => removeAllergy(name)}
                className="ml-1 rounded-full p-0.5 hover:bg-red-100 dark:hover:bg-red-900"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          placeholder={catalog.length === 0 ? "No allergies in catalog yet" : "Search allergies..."}
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />

      {/* Search results dropdown — absolutely positioned to overlay below */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-none border bg-popover shadow-md">
          {search.trim().length >= 1 && filtered.length === 0 ? (
            <div className="divide-y">
              <p className="px-3 py-3 text-xs text-muted-foreground">
                No allergies match "{search.trim()}"
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted transition-colors"
                onMouseDown={() => {
                  setNewName(search.trim());
                  setCreateOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                Create "{search.trim()}"
              </button>
            </div>
          ) : search.trim().length < 1 && availableAllergies.length === 0 ? (
            <div className="divide-y">
              <p className="px-3 py-3 text-xs text-muted-foreground">
                {catalog.length === 0
                  ? "No allergies in the catalog yet"
                  : "All allergies from catalog are already selected"}
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted transition-colors"
                onMouseDown={() => setCreateOpen(true)}
              >
                <Plus className="size-3.5" />
                {catalog.length === 0 ? "Create first allergy" : "Add new allergy to catalog"}
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((allergy) => (
                <button
                  key={allergy.id}
                  type="button"
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                onMouseDown={() => addAllergy(allergy.name)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{allergy.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {allergy.category}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                  {allergy.severity}
                </span>
              </button>
              ))}
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted transition-colors"
                onMouseDown={() => setCreateOpen(true)}
              >
                <Plus className="size-3.5" />
                Add new allergy
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Create new allergy sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Allergy</SheetTitle>
            <SheetDescription>
              Add a new allergy to the catalog for future use.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-allergy-name">Name *</FieldLabel>
                <Input
                  id="new-allergy-name"
                  placeholder="e.g. Penicillin, Peanuts"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as AllergyCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRUG">Drug</SelectItem>
                      <SelectItem value="FOOD">Food</SelectItem>
                      <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Severity</FieldLabel>
                  <Select value={newSeverity} onValueChange={(v) => setNewSeverity(v as AllergySeverity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MILD">Mild</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="SEVERE">Severe</SelectItem>
                      <SelectItem value="LIFE_THREATENING">Life Threatening</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
            >
              Create Allergy
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
