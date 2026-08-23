import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Check, Star, Eye, ArrowLeft, Pencil, Stethoscope, TestTube } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchPrescriptionTemplates,
  deletePrescriptionTemplate,
  setDefaultPrescriptionTemplate,
  type PrescriptionTemplate,
  type TemplateType,
} from "@/lib/api";
import { PrescriptionTemplateEditor } from "./prescription-template-editor";
import { PrescriptionTemplatePreview } from "./prescription-template-preview";

const TYPE_CONFIG: Record<TemplateType, { label: string; icon: typeof FileText; color: string }> = {
  prescription: { label: "Prescription", icon: FileText, color: "bg-blue-100 text-blue-700" },
  diagnosis: { label: "Diagnosis", icon: Stethoscope, color: "bg-green-100 text-green-700" },
  test: { label: "Lab Test", icon: TestTube, color: "bg-red-100 text-red-700" },
};

export function PrescriptionTemplateList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PrescriptionTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["prescription-templates"],
    queryFn: fetchPrescriptionTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePrescriptionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescription-templates"] });
      toast.success("Template deleted");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultPrescriptionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescription-templates"] });
      toast.success("Default template updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function openCreate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  function openEdit(tpl: PrescriptionTemplate) {
    setEditingTemplate(tpl);
    setEditorOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate({ to: "/organisation" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Document Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Design and manage prescription, diagnosis, and lab test layouts
            </p>
          </div>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="size-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No prescription templates yet.</p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const layout = tpl.layout as Record<string, any>;
            return (
              <Card
                key={tpl.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  tpl.isDefault && "ring-2 ring-primary/30"
                )}
              >
                {tpl.isDefault && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold rounded-bl">
                    DEFAULT
                  </div>
                )}
                {/* Template preview thumbnail */}
                <div className="h-40 bg-muted/30 border-b flex items-center justify-center">
                  <div className="w-[70%] h-[85%] bg-white border rounded-sm shadow-sm p-3 space-y-1.5">
                    {/* Mini header */}
                    <div className="flex items-center gap-2 border-b pb-1.5">
                      {tpl.logoUrl && (
                        <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-primary">L</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[7px] font-bold">{tpl.clinicName || "Clinic Name"}</p>
                        <p className="text-[5px] text-muted-foreground">{tpl.doctorName || "Doctor"}</p>
                      </div>
                      {layout.showRxSymbol !== false && (
                        <span className="text-lg font-bold italic text-primary/60">Rx</span>
                      )}
                    </div>
                    {/* Mini patient fields */}
                    {layout.showPatientFields !== false && (
                      <div className="grid grid-cols-2 gap-0.5 text-[5px] text-muted-foreground">
                        <span>Name: ________</span>
                        <span>Age: ____</span>
                        <span>Sex: ____</span>
                        <span>Date: ____</span>
                      </div>
                    )}
                    {/* Mini medicine lines */}
                    {layout.showMedicineTable !== false && (
                      <div className="space-y-0.5 pt-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-1 bg-muted rounded" />
                        ))}
                      </div>
                    )}
                    {/* Mini footer */}
                    {layout.showFooter !== false && (
                      <div className="border-t pt-1 mt-auto">
                        <p className="text-[5px] text-muted-foreground text-center">{tpl.clinicAddress || "Address"}</p>
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{tpl.name}</p>
                        {(() => {
                          const tc = TYPE_CONFIG[tpl.type ?? "prescription"];
                          const Icon = tc.icon;
                          return (
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium", tc.color)}>
                              <Icon className="size-2.5" />
                              {tc.label}
                            </span>
                          );
                        })()}
                      </div>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                      )}
                    </div>
                    {tpl.isDefault && <Star className="size-4 shrink-0 text-primary fill-primary" />}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-[11px]"
                      onClick={() => setPreviewTemplate(tpl)}
                    >
                      <Eye className="size-3" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-[11px]"
                      onClick={() => openEdit(tpl)}
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                    {!tpl.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 h-7 text-[11px]"
                        onClick={() => setDefaultMutation.mutate(tpl.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Check className="size-3" />
                        Set Default
                      </Button>
                    )}
                    {!tpl.isDefault && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete template "${tpl.name}"?`)) {
                            deleteMutation.mutate(tpl.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PrescriptionTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
      />

      <PrescriptionTemplatePreview
        template={previewTemplate}
        onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}
      />
    </div>
  );
}
