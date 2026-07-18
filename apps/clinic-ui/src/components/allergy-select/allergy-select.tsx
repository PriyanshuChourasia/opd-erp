import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, AlertTriangle } from "lucide-react";
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
}

export function AllergySelect({ value, onChange }: AllergySelectProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<AllergyCategory>("OTHER");
  const [newSeverity, setNewSeverity] = useState<AllergySeverity>("MODERATE");

  const { data: response } = useQuery({
    queryKey: ["allergies", "select"],
    queryFn: () => fetchAllergies({ limit: 100 }),
  });

  const catalog = response?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createAllergy,
    onSuccess: (allergy: Allergy) => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      onChange([...value, allergy.name]);
      setCreateOpen(false);
      setNewName("");
      toast.success(`"${allergy.name}" added to allergy catalog`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function addAllergy(name: string) {
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
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

  const availableAllergies = catalog.filter((a) => !value.includes(a.name));

  return (
    <div className="space-y-2">
      {/* Selected allergies */}
      {value.length > 0 && (
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

      {/* Catalog dropdown */}
      {availableAllergies.length > 0 && (
        <Select
          value=""
          onValueChange={(v) => addAllergy(v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select from catalog..." />
          </SelectTrigger>
          <SelectContent>
            {availableAllergies.map((allergy) => (
              <SelectItem key={allergy.id} value={allergy.name}>
                <span className="flex items-center gap-2">
                  <span>{allergy.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {allergy.category}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Create new button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="mr-1.5 size-3.5" />
        {catalog.length === 0
          ? "Create first allergy in catalog"
          : "Add new allergy"}
      </Button>

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
