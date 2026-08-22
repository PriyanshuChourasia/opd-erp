import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Braces,
  Check,
  Download,
  Eye,
  GitBranch,
  Hash,
  KeyRound,
  Link2,
  Pencil,
  Plus,
  StickyNote,
  Table2,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import {
  fetchModules,
  fetchSchema,
  fetchSchemaChanges,
  fetchSchemaModel,
  saveSchemaChanges,
  type SchemaChangeInput,
  type SchemaField,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/10",
  POST: "bg-green-600/10 text-green-600 hover:bg-green-600/10",
  PATCH: "bg-amber-600/10 text-amber-600 hover:bg-amber-600/10",
  DELETE: "bg-red-600/10 text-red-600 hover:bg-red-600/10",
};

interface FieldAnnotation {
  remark?: string;
  remove?: boolean;
  edited?: { name: string; type: string };
}

/** A locally proposed (not yet in Prisma) field — may be a foreign key. */
type ProposedField = SchemaField & { targetModel?: string };

function serializePlan(
  meta: Record<string, FieldAnnotation>,
  proposed: ProposedField[],
): SchemaChangeInput[] {
  const changes: SchemaChangeInput[] = [];
  for (const [fieldName, m] of Object.entries(meta)) {
    if (m.remark) changes.push({ fieldName, kind: "REMARK", remark: m.remark });
    if (m.remove) changes.push({ fieldName, kind: "REMOVE" });
    if (m.edited) {
      changes.push({
        fieldName,
        kind: "EDIT",
        editedName: m.edited.name,
        editedType: m.edited.type || undefined,
      });
    }
  }
  for (const field of proposed) {
    changes.push({
      fieldName: field.name,
      kind: "ADD",
      fieldType: field.type,
      targetModel: field.targetModel,
      isRequired: field.isRequired,
      isList: field.isList,
    });
  }
  return changes;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const KIND_STYLES: Record<string, string> = {
  scalar: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/10",
  object: "bg-purple-600/10 text-purple-600 hover:bg-purple-600/10",
  enum: "bg-amber-600/10 text-amber-600 hover:bg-amber-600/10",
};

export function SchemaModelDetailPage() {
  const { model: modelName } = useParams({
    from: "/_developer/developer/schema/$model",
  });

  const modelQuery = useQuery({
    queryKey: ["schema", modelName],
    queryFn: () => fetchSchemaModel(modelName),
    retry: false,
  });

  // Full schema is already cached by the list page; reused to resolve enum values.
  const allSchemaQuery = useQuery({
    queryKey: ["schema"],
    queryFn: fetchSchema,
  });

  // Module registry — powers the APIs tab (each module's endpoints and purpose).
  const modulesQuery = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
  });

  const model = modelQuery.data?.data;

  const relations = useMemo(
    () => model?.fields.filter((f) => f.kind === "object") ?? [],
    [model],
  );

  const referencedEnums = useMemo(() => {
    const enums = allSchemaQuery.data?.data.enums ?? [];
    if (!model || enums.length === 0) return [];
    const enumFieldTypes = new Set(
      model.fields.filter((f) => f.kind === "enum").map((f) => f.type),
    );
    return enums.filter((e) => enumFieldTypes.has(e.name));
  }, [model, allSchemaQuery.data]);

  // ─── Field change plan (remarks / edits / removals / proposed fields) ────
  // Everything is persisted in the database_schema module — the Prisma DMMF
  // is read-only, so these annotations form a saved change plan per model.

  const [fieldMeta, setFieldMeta] = useState<Record<string, FieldAnnotation>>({});
  const [proposedFields, setProposedFields] = useState<ProposedField[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastSavedRef = useRef<string>("");
  const [remarkFor, setRemarkFor] = useState<string | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [addingField, setAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("String");
  const [newFieldKind, setNewFieldKind] = useState<"scalar" | "relation">("scalar");
  const [newFieldTarget, setNewFieldTarget] = useState<string>("");

  const changesQuery = useQuery({
    queryKey: ["schema-changes", modelName],
    queryFn: () => fetchSchemaChanges(modelName),
  });

  // Hydrate the saved plan from the API once it loads for this model.
  useEffect(() => {
    const rows = changesQuery.data?.data;
    if (!rows) return;
    const meta: Record<string, FieldAnnotation> = {};
    const proposed: ProposedField[] = [];
    for (const row of rows) {
      if (row.kind === "ADD") {
        proposed.push({
          name: row.fieldName,
          type: row.fieldType ?? "String",
          kind: row.targetModel ? "object" : "scalar",
          isRequired: row.isRequired,
          isList: row.isList,
          isId: false,
          isUnique: false,
          hasDefault: false,
          isUpdatedAt: false,
          relationFromFields: [],
          relationToFields: [],
          targetModel: row.targetModel ?? undefined,
        });
        continue;
      }
      const entry: FieldAnnotation = meta[row.fieldName] ?? {};
      if (row.kind === "REMARK" && row.remark) entry.remark = row.remark;
      if (row.kind === "REMOVE") entry.remove = true;
      if (row.kind === "EDIT" && row.editedName) {
        entry.edited = { name: row.editedName, type: row.editedType ?? "" };
      }
      meta[row.fieldName] = entry;
    }
    setFieldMeta(meta);
    setProposedFields(proposed);
    setRemarkFor(null);
    setEditingField(null);
    setAddingField(false);
    lastSavedRef.current = JSON.stringify(serializePlan(meta, proposed));
    setHydrated(true);
  }, [changesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (changes: SchemaChangeInput[]) => saveSchemaChanges(modelName, changes),
    onSuccess: (res) => {
      lastSavedRef.current = JSON.stringify(
        res.data.map(({ fieldName, kind, remark, editedName, editedType, fieldType }) => ({
          fieldName,
          kind,
          remark: remark ?? undefined,
          editedName: editedName ?? undefined,
          editedType: editedType ?? undefined,
          fieldType: fieldType ?? undefined,
        })),
      );
    },
    onError: () => toast.error("Failed to save schema annotations"),
  });

  // Autosave (debounced) whenever the in-memory plan diverges from the DB.
  // Also flushes immediately if the tab is hidden/closed mid-debounce so a
  // change is never lost.
  useEffect(() => {
    if (!hydrated) return;
    const changes = serializePlan(fieldMeta, proposedFields);
    if (JSON.stringify(changes) === lastSavedRef.current) return;
    const timer = setTimeout(() => saveMutation.mutate(changes), 500);
    const flushNow = () => {
      if (JSON.stringify(serializePlan(fieldMeta, proposedFields)) !== lastSavedRef.current) {
        saveMutation.mutate(serializePlan(fieldMeta, proposedFields));
      }
    };
    document.addEventListener("visibilitychange", flushNow);
    window.addEventListener("pagehide", flushNow);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", flushNow);
      window.removeEventListener("pagehide", flushNow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldMeta, proposedFields, hydrated]);

  function toggleRemoveMark(fieldName: string) {
    setFieldMeta((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], remove: !prev[fieldName]?.remove },
    }));
  }

  function openEdit(displayedName: string, displayedType: string) {
    if (editingField === displayedName) {
      setEditingField(null);
      return;
    }
    setEditName(displayedName);
    setEditType(displayedType);
    setEditingField(displayedName);
  }

  function saveEdit(originalName: string, originalType: string, proposed: boolean) {
    const nextName = editName.trim();
    if (!nextName) return;
    const nextType = editType.trim() || originalType;
    if (proposed) {
      setProposedFields((prev) =>
        prev.map((f) => (f.name === originalName ? { ...f, name: nextName, type: nextType } : f)),
      );
    } else {
      setFieldMeta((prev) => ({
        ...prev,
        [originalName]: {
          ...prev[originalName],
          edited: { name: nextName, type: nextType },
        },
      }));
    }
    setEditingField(null);
  }

  function openRemark(fieldName: string) {
    if (remarkFor === fieldName) {
      setRemarkFor(null);
      return;
    }
    setRemarkFor(fieldName);
    setRemarkDraft(fieldMeta[fieldName]?.remark ?? "");
  }

  function saveRemark(fieldName: string) {
    const remark = remarkDraft.trim();
    setFieldMeta((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], remark: remark || undefined },
    }));
    setRemarkFor(null);
  }

  function addField() {
    const name = newFieldName.trim();
    if (!name) return;
    const isRelation = newFieldKind === "relation";
    if (isRelation && !newFieldTarget) return;
    setProposedFields((prev) => [
      ...prev,
      {
        name,
        type: isRelation ? newFieldTarget : newFieldType.trim() || "String",
        kind: isRelation ? "object" : "scalar",
        isRequired: true,
        isList: false,
        isId: false,
        isUnique: false,
        hasDefault: false,
        isUpdatedAt: false,
        relationFromFields: [],
        relationToFields: [],
        targetModel: isRelation ? newFieldTarget : undefined,
      },
    ]);
    setNewFieldName("");
    setNewFieldType("String");
    setNewFieldKind("scalar");
    setNewFieldTarget("");
    setAddingField(false);
  }

  function deleteProposedField(fieldName: string) {
    setProposedFields((prev) => prev.filter((f) => f.name !== fieldName));
    setFieldMeta((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }

  // Visible progress of the change plan: how many edits/removals/comments exist.
  const markCounts = useMemo(() => {
    let edited = 0;
    let remove = 0;
    let remarks = 0;
    for (const meta of Object.values(fieldMeta)) {
      if (meta?.edited) edited += 1;
      if (meta?.remove) remove += 1;
      if (meta?.remark) remarks += 1;
    }
    return { edited, remove, remarks };
  }, [fieldMeta]);

  // Only the API module that owns this schema/model — not the whole registry.
  const relevantModules = useMemo(() => {
    const mods = modulesQuery.data?.data ?? [];
    if (!model) return [];
    const n = model.name.toLowerCase();
    return mods.filter((m) => {
      const id = m.id.toLowerCase().replace(/-/g, "");
      return id === n || id.startsWith(n) || n.startsWith(id);
    });
  }, [modulesQuery.data, model]);

  const displayRows = useMemo<Array<ProposedField & { proposed: boolean }>>(
    () => [
      ...(model?.fields ?? []).map((field) => ({ ...field, proposed: false })),
      ...proposedFields.map((field) => ({ ...field, proposed: true })),
    ],
    [model, proposedFields],
  );

  if (modelQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (modelQuery.isError || !model) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="font-mono text-lg font-medium">{modelName}</p>
        <p className="text-sm text-muted-foreground">
          Model not found in the Prisma schema.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/developer/schema">
            <ArrowLeft className="size-4" />
            Back to schema
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/developer/schema" aria-label="Back to schema">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="flex size-10 items-center justify-center rounded-none bg-primary/10">
          <Table2 className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-mono text-2xl font-semibold tracking-tight">
            {model.name}
          </h1>
          <p className="text-sm text-muted-foreground">Full Prisma model definition</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadJson(`${model.name.toLowerCase()}.schema.json`, {
              model: model.name,
              exportedAt: new Date().toISOString(),
              fields: model.fields,
              relations,
              uniqueFields: model.uniqueFields,
              proposedFields,
              annotations: fieldMeta,
            })
          }
        >
          <Download className="size-4" />
          Download JSON
        </Button>
      </div>

      {/* Two view options */}
      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">
            <Eye className="size-4" />
            View
          </TabsTrigger>
          <TabsTrigger value="relations">
            <GitBranch className="size-4" />
            Relations
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Terminal className="size-4" />
            APIs
          </TabsTrigger>
        </TabsList>

        {/* Option 1 — plain full view */}
        <TabsContent value="view" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="size-4 text-muted-foreground" />
                    Fields ({displayRows.length})
                  </CardTitle>
                  {markCounts.edited > 0 && (
                    <Badge variant="outline" className="bg-blue-600/10 text-[10px] text-blue-600">
                      {markCounts.edited} edited
                    </Badge>
                  )}
                  {markCounts.remove > 0 && (
                    <Badge variant="outline" className="bg-red-600/10 text-[10px] text-red-600">
                      {markCounts.remove} marked for removal
                    </Badge>
                  )}
                  {markCounts.remarks > 0 && (
                    <Badge variant="outline" className="bg-amber-600/10 text-[10px] text-amber-600">
                      {markCounts.remarks} remark{markCounts.remarks !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setAddingField((v) => !v)}>
                  <Plus className="size-4" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {addingField && (
                <div className="flex flex-wrap items-center gap-2 border-y bg-muted/30 px-6 py-3">
                  <Input
                    autoFocus
                    placeholder={newFieldKind === "relation" ? "fk name — e.g. doctorId" : "field name — e.g. discountPercent"}
                    className="h-8 w-52 font-mono"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <Select
                    value={newFieldKind}
                    onValueChange={(value) => {
                      setNewFieldKind(value as "scalar" | "relation");
                      setNewFieldTarget("");
                    }}
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scalar">Scalar field</SelectItem>
                      <SelectItem value="relation">Foreign key →</SelectItem>
                    </SelectContent>
                  </Select>
                  {newFieldKind === "relation" ? (
                    <Select value={newFieldTarget} onValueChange={setNewFieldTarget}>
                      <SelectTrigger className="h-8 w-44 font-mono">
                        <SelectValue placeholder="target model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {(allSchemaQuery.data?.data?.models ?? []).map((m) => (
                          <SelectItem key={m.name} value={m.name} className="font-mono text-xs">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="type — e.g. Int, String, DateTime"
                      className="h-8 w-48 font-mono"
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                    />
                  )}
                  <Button
                    size="sm"
                    disabled={!newFieldName.trim() || (newFieldKind === "relation" && !newFieldTarget)}
                    onClick={addField}
                  >
                    <Check className="size-4" />
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingField(false)}>
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
              )}
              <div className="divide-y">
                {displayRows.map((row) => {
                  const meta = fieldMeta[row.name];
                  const isRemoved = !!meta?.remove;
                  const isEdited = !row.proposed && !!meta?.edited;
                  const displayName = !row.proposed ? (meta?.edited?.name ?? row.name) : row.name;
                  const displayType = !row.proposed ? (meta?.edited?.type ?? row.type) : row.type;
                  const isEditingThis = editingField === row.name;
                  return (
                    <Fragment key={`${row.proposed ? "proposed" : "schema"}-${row.name}`}>
                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6 py-3",
                          isRemoved && "opacity-50",
                        )}
                      >
                        <span className="flex w-5 shrink-0 items-center justify-center">
                          {row.isId ? (
                            <KeyRound className="size-3.5 text-amber-500" />
                          ) : row.kind === "object" ? (
                            <Link2 className="size-3.5 text-purple-500" />
                          ) : null}
                        </span>
                        {isEditingThis ? (
                          <>
                            <Input
                              autoFocus
                              aria-label="Field name"
                              className="h-8 min-w-40 flex-1 font-mono"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(row.name, row.type, row.proposed);
                                if (e.key === "Escape") setEditingField(null);
                              }}
                            />
                            <Input
                              aria-label="Field type"
                              className="h-8 w-44 shrink-0 font-mono"
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                            />
                            <Button
                              size="sm"
                              disabled={!editName.trim()}
                              onClick={() => saveEdit(row.name, row.type, row.proposed)}
                            >
                              <Check className="size-4" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                              <X className="size-4" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate font-mono text-sm font-medium",
                                isRemoved && "line-through decoration-red-500",
                              )}
                            >
                              {displayName}
                            </span>
                            {row.proposed && (
                              <Badge className="bg-green-600/10 text-green-600 hover:bg-green-600/10">
                                new
                              </Badge>
                            )}
                            {row.proposed && row.targetModel && (
                              <Badge
                                variant="outline"
                                className="border-purple-400 font-mono text-[10px] text-purple-600"
                              >
                                FK → {row.targetModel}
                              </Badge>
                            )}
                            {isEdited && !isRemoved && (
                              <Badge className="bg-blue-600/10 text-blue-600 hover:bg-blue-600/10">
                                edited
                              </Badge>
                            )}
                            {isRemoved && (
                              <Badge className="bg-red-600/10 text-red-600 hover:bg-red-600/10">
                                remove
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`shrink-0 font-mono text-[11px] ${KIND_STYLES[row.kind] ?? ""}`}
                            >
                              {displayType}
                              {row.isList ? "[]" : ""}
                              {!row.isRequired ? "?" : ""}
                            </Badge>
                            <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                              {row.kind}
                            </Badge>
                          </>
                        )}
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          {!isEditingThis && !row.proposed ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${displayName}`}
                                title="Edit field"
                                className={cn("size-7", isEdited && "text-blue-600")}
                                onClick={() => openEdit(displayName, displayType)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${meta?.remark ? "Edit" : "Add"} remark on ${displayName}`}
                                title={meta?.remark ? "Edit remark" : "Add remark"}
                                className={cn("size-7", meta?.remark && "text-amber-600")}
                                onClick={() => openRemark(row.name)}
                              >
                                <StickyNote className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Mark ${displayName} for removal`}
                                title="Mark for removal"
                                className={cn("size-7", isRemoved && "text-red-600")}
                                onClick={() => toggleRemoveMark(row.name)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          ) : null}
                          {!isEditingThis && row.proposed ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove proposed field ${displayName}`}
                              title="Delete proposed field"
                              className="size-7 text-red-600"
                              onClick={() => deleteProposedField(row.name)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {meta?.remark && remarkFor !== row.name && (
                        <div className="flex items-center gap-2 border-t border-amber-500/20 bg-amber-500/5 px-6 py-1.5 pl-14 text-xs text-amber-700 dark:text-amber-400">
                          <StickyNote className="size-3 shrink-0" />
                          <span className="min-w-0 flex-1">{meta.remark}</span>
                        </div>
                      )}
                      {remarkFor === row.name && (
                        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-6 py-2">
                          <Input
                            autoFocus
                            placeholder="Write a remark for this field…"
                            className="h-8 min-w-56 flex-1"
                            value={remarkDraft}
                            onChange={(e) => setRemarkDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRemark(row.name);
                              if (e.key === "Escape") setRemarkFor(null);
                            }}
                          />
                          <Button size="sm" onClick={() => saveRemark(row.name)}>
                            <Check className="size-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRemarkFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {model.uniqueFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4 text-muted-foreground" />
                  Unique Constraints ({model.uniqueFields.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {model.uniqueFields.map((fields, index) => (
                  <Badge key={index} variant="outline" className="font-mono text-[11px]">
                    ({fields.join(", ")})
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {referencedEnums.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Braces className="size-4 text-muted-foreground" />
                  Referenced Enums ({referencedEnums.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {referencedEnums.map((enumeration) => (
                  <div key={enumeration.name} className="border p-3">
                    <p className="font-mono text-sm font-medium">{enumeration.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {enumeration.values.map((value) => (
                        <Badge key={value} variant="secondary" className="font-mono text-[10px]">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Option 2 — animated relation graph */}
        <TabsContent value="relations" className="mt-4">
          <RelationGraph modelName={model.name} relations={relations} />
        </TabsContent>

        {/* Option 3 — this model's owning module: its API endpoints and purpose */}
        <TabsContent value="apis" className="mt-4 space-y-4">
          {modulesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading API registry...
            </div>
          ) : relevantModules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Terminal className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No matching API module</p>
                <p className="text-xs text-muted-foreground">
                  No registered module corresponds to the &quot;{model.name}&quot; schema.
                </p>
              </CardContent>
            </Card>
          ) : (
            relevantModules.map((mod) => {
              const actions = mod.features.flatMap((feature) =>
                feature.capabilities.flatMap((capability) =>
                  capability.actions.map((action) => ({
                    ...action,
                    feature: feature.name,
                  })),
                ),
              );
              return (
                <Card key={mod.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                      {mod.name}
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {mod.id}
                      </Badge>
                      <span className="text-xs font-normal text-muted-foreground">
                        {actions.length} endpoint{actions.length !== 1 ? "s" : ""} —{" "}
                        {mod.description}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-3">
                    <div className="divide-y">
                      {actions.map((action) => (
                        <div key={action.id} className="px-6 py-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Badge
                              variant="outline"
                              className={`w-[4.5rem] shrink-0 justify-center font-mono text-[10px] ${METHOD_STYLES[action.method ?? ""] ?? ""}`}
                            >
                              {action.method ?? "—"}
                            </Badge>
                            <span className="shrink-0 font-mono text-xs font-medium">
                              {action.path ?? "internal"}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                              {action.name} — {action.description}
                            </span>
                          </div>
                          {(action.request || action.response) && (
                            <div className="mt-1.5 grid gap-x-3 gap-y-0.5 pl-1 text-[11px] leading-relaxed md:grid-cols-[4.5rem_1fr]">
                              <span className="font-medium uppercase tracking-wide text-muted-foreground/70">
                                Request
                              </span>
                              <span className="break-words font-mono text-muted-foreground">
                                {action.request ?? "—"}
                              </span>
                              <span className="font-medium uppercase tracking-wide text-muted-foreground/70">
                                Response
                              </span>
                              <span className="break-words font-mono text-muted-foreground">
                                {action.response ?? "—"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type RelationField = SchemaField;

/** Plain-language explanation of who physically holds the foreign key. */
function explainEdge(modelName: string, fields: RelationField[]): string {
  const head = fields[0];
  if (!head) return "";
  const owner = fields.find((f) => f.relationFromFields.length > 0);
  if (owner) {
    return `FK lives here: ${modelName}.${owner.relationFromFields.join(", ")} references ${head.type}.${head.relationToFields.join(", ") || "id"}.`;
  }
  return `Back-relation — the FK column sits on ${head.type}; ${modelName}.${fields.map((f) => f.name).join("/")} is the readable reverse list.`;
}

function RelationGraph({
  modelName,
  relations,
}: {
  modelName: string;
  relations: RelationField[];
}) {
  // Group edges by unique target model so repeated fields share one node.
  const edges = useMemo(() => {
    const byTarget = new Map<string, RelationField[]>();
    for (const field of relations) {
      if (field.type === modelName) continue; // self-relations shown in legend only
      const group = byTarget.get(field.type) ?? [];
      group.push(field);
      byTarget.set(field.type, group);
    }
    return Array.from(byTarget.entries());
  }, [relations, modelName]);

  const selfRelations = useMemo(
    () => relations.filter((r) => r.type === modelName),
    [relations, modelName],
  );

  if (relations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <GitBranch className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No relations</p>
          <p className="text-xs text-muted-foreground">
            This model does not reference any other model.
          </p>
        </CardContent>
      </Card>
    );
  }

  const CX = 400;
  const CY = 250;
  const R = 175;
  const NODE_W = 150;
  const NODE_H = 46;

  const targets = edges.map(([target, fields], index) => {
    const angle = (2 * Math.PI * index) / edges.length - Math.PI / 2;
    return {
      name: target,
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
      fields,
    };
  });

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes schema-dash-march { to { stroke-dashoffset: -24; } }
        @keyframes schema-node-pop {
          0% { opacity: 0; transform: scale(0.6); transform-origin: center; transform-box: fill-box; }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); transform-origin: center; transform-box: fill-box; }
        }
        @keyframes schema-edge-draw { from { stroke-dashoffset: 480; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
      `}</style>

      <p className="text-xs text-muted-foreground">
        How to read it: the center box is this model · each outer box is a model it links to ·
        every line is a foreign-key relationship · <span className="font-mono">1..*</span> means
        one-to-many, <span className="font-mono">1..1</span> one-to-one. Exact FK columns are
        listed under each edge below the graph.
      </p>

      <Card className="overflow-hidden bg-gradient-to-b from-muted/40 to-background">
        <CardContent className="p-2 sm:p-4">
          <svg
            viewBox="0 0 800 500"
            className="mx-auto h-auto w-full max-w-3xl"
            role="img"
            aria-label={`Relation graph of ${modelName}`}
          >
            {/* Edges */}
            {targets.map(({ x, y, name, fields }, index) => {
              // Trim line so it starts/ends at node borders instead of centers.
              const dx = x - CX;
              const dy = y - CY;
              const len = Math.sqrt(dx * dx + dy * dy);
              const startX = CX + (dx / len) * (NODE_W / 2 + 8);
              const startY = CY + (dy / len) * (NODE_H / 2 + 8);
              const endX = x - (dx / len) * (NODE_W / 2 + 8);
              const endY = y - (dy / len) * (NODE_H / 2 + 8);
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const isList = fields.some((f) => f.isList);

              return (
                <g key={name}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeDasharray="6 6"
                    className="schema-edge text-purple-400/60 dark:text-purple-500/50"
                    style={{
                      animation: `schema-edge-draw 0.7s ease ${index * 0.12}s both, schema-dash-march 1.2s linear infinite`,
                      animationDelay: `${index * 0.12}s, ${0.7 + index * 0.12}s`,
                      animationFillMode: "both, none",
                    }}
                  />
                  {/* Traveling data packet */}
                  <circle r={4} fill="currentColor" className="text-primary">
                    <animateMotion
                      dur={`${2 + index * 0.35}s`}
                      repeatCount="indefinite"
                      begin={`${0.7 + index * 0.12}s`}
                      path={`M${startX},${startY} L${endX},${endY}`}
                    />
                  </circle>
                  {/* Cardinality label */}
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono"
                    fontSize={11}
                  >
                    {isList ? "1..*" : "1..1"}
                  </text>
                </g>
              );
            })}

            {/* Center node */}
            <g style={{ animation: "schema-node-pop 0.5s ease both" }}>
              <rect
                x={CX - NODE_W / 2}
                y={CY - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={6}
                className="fill-primary stroke-primary"
                strokeWidth={1.5}
              />
              <text
                x={CX}
                y={CY - 4}
                textAnchor="middle"
                fontSize={15}
                fontWeight={700}
                className="fill-primary-foreground font-mono"
              >
                {modelName}
              </text>
              <text
                x={CX}
                y={CY + 13}
                textAnchor="middle"
                fontSize={9}
                className="fill-primary-foreground/80 uppercase tracking-wider"
              >
                current model
              </text>
            </g>

            {/* Target nodes */}
            {targets.map(({ name, x, y, fields }, index) => (
              <g
                key={name}
                style={{ animation: `schema-node-pop 0.5s ease ${0.25 + index * 0.12}s both` }}
              >
                <rect
                  x={x - NODE_W / 2}
                  y={y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  className="fill-background stroke-purple-400 dark:stroke-purple-500"
                  strokeWidth={1.5}
                />
                <text
                  x={x}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={600}
                  className="fill-foreground font-mono"
                >
                  {name}
                </text>
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  fontSize={9}
                  className="fill-muted-foreground"
                >
                  {fields.map((f) => f.name).join(", ").slice(0, 26)}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>

      {/* Edge legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {edges.map(([target, fields], index) => (
          <Card
            key={target}
            className="transition-transform hover:-translate-y-0.5"
            style={{ animation: `schema-node-pop 0.4s ease ${index * 0.08}s both` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-mono text-sm font-semibold">{target}</p>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {fields.some((f) => f.isList) ? "1..*" : "1..1"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {fields.map((field) => (
                  <Badge key={field.name} variant="secondary" className="font-mono text-[10px]">
                    {field.name}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {explainEdge(modelName, fields)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selfRelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4 text-muted-foreground" />
              Self Relations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {selfRelations.map((field) => (
              <Badge key={field.name} variant="outline" className="font-mono text-[10px]">
                {field.name} → {modelName}
                {field.isList ? "[]" : ""}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
