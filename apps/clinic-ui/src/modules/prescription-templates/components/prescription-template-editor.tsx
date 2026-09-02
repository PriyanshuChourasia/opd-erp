import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertTriangle, ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  fetchPrescriptionTemplate,
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  type PrescriptionTemplate,
  type CreatePrescriptionTemplateInput,
  type TemplateType,
} from "@/lib/api";
import { PrescriptionTemplatePreview } from "./prescription-template-preview";

// ─── Layout Types ──────────────────────────────────────────

export type LayoutStyle = "classic" | "modern" | "minimal" | "two-column" | "compact" | "banner" | "letterhead" | "doctor-script" | "prescription-pad";
export type HeaderStyle = "centered" | "left" | "right" | "banner" | "split" | "split-line";
export type FontFamily = "serif" | "sans" | "mono" | "handwriting";
export type PaperSize = "A4" | "A5" | "Letter";

export interface LayoutConfig {
  // Layout style
  layoutStyle: LayoutStyle;
  headerStyle: HeaderStyle;
  fontFamily: FontFamily;
  paperSize: PaperSize;

  // Visibility toggles
  showRxSymbol: boolean;
  showPatientFields: boolean;
  showMedicineTable: boolean;
  showRecommendations: boolean;
  showFooter: boolean;
  showQRCode: boolean;
  showBorder: boolean;
  showClinicAddress: boolean;
  showRegistrationNo: boolean;
  showWatermark: boolean;
  showDiagnosis: boolean;
  showNotes: boolean;

  // Free-form mode (no medicine table, just writing lines)
  freeFormMode: boolean;
  writingLineCount: number;
  showWritingLines: boolean;

  // Signature
  showSignatureLine: boolean;
  signatureText: string;

  // Header line
  showHeaderLine: boolean;
  headerLineColor: string;

  // Recommendations
  recommendations: string[];

  // Extra custom label/value pairs shown in the header (e.g. GST No, extra reg no)
  headerFields: { label: string; value: string; side: "left" | "right" }[];

  // Styling
  primaryColor: string;
  secondaryColor: string;
  headerBgColor: string;
  fontSize: "small" | "medium" | "large";

  // Footer
  footerText: string;
  footerColumns: string[];
}

export const LAYOUT_STYLES: { value: LayoutStyle; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Traditional Rx with clean lines and formal structure" },
  { value: "modern", label: "Modern", description: "Contemporary design with color accents and rounded elements" },
  { value: "minimal", label: "Minimal", description: "Stripped-down, no-frills layout for quick prescriptions" },
  { value: "two-column", label: "Two Column", description: "Split layout: patient info left, medicines right" },
  { value: "compact", label: "Compact", description: "Dense layout fitting more info in less space" },
  { value: "banner", label: "Banner", description: "Full-width header banner with centered content" },
  { value: "letterhead", label: "Letterhead", description: "Hospital letterhead style with split header and signature" },
  { value: "doctor-script", label: "Doctor's Script", description: "Free-form writing pad with lined paper feel" },
  { value: "prescription-pad", label: "Prescription Pad", description: "Classic pad with header, lines, and signature — no table" },
];

export const HEADER_STYLES: { value: HeaderStyle; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "left", label: "Left Aligned" },
  { value: "right", label: "Right Aligned" },
  { value: "banner", label: "Full Banner" },
  { value: "split", label: "Split (Logo + Info)" },
  { value: "split-line", label: "Split + Line" },
];

export const FONT_FAMILIES: { value: FontFamily; label: string; css: string }[] = [
  { value: "serif", label: "Serif (Times)", css: "Georgia, 'Times New Roman', serif" },
  { value: "sans", label: "Sans-serif (Inter)", css: "'Inter', 'Segoe UI', sans-serif" },
  { value: "mono", label: "Monospace", css: "'Courier New', monospace" },
  { value: "handwriting", label: "Handwriting", css: "'Segoe Script', 'Comic Sans MS', cursive" },
];

export const PAPER_SIZES: { value: PaperSize; label: string; width: string }[] = [
  { value: "A4", label: "A4 (210mm)", width: "210mm" },
  { value: "A5", label: "A5 (148mm)", width: "148mm" },
  { value: "Letter", label: "Letter (8.5in)", width: "8.5in" },
];

export const COLOR_PRESETS: { label: string; primary: string; secondary: string; headerBg: string }[] = [
  { label: "Ocean Blue", primary: "#0ea5e9", secondary: "#e0f2fe", headerBg: "#0ea5e9" },
  { label: "Forest Green", primary: "#16a34a", secondary: "#dcfce7", headerBg: "#16a34a" },
  { label: "Royal Purple", primary: "#7c3aed", secondary: "#ede9fe", headerBg: "#7c3aed" },
  { label: "Crimson Red", primary: "#dc2626", secondary: "#fef2f2", headerBg: "#dc2626" },
  { label: "Teal", primary: "#0891b2", secondary: "#ecfeff", headerBg: "#0891b2" },
  { label: "Amber", primary: "#d97706", secondary: "#fef3c7", headerBg: "#d97706" },
  { label: "Slate", primary: "#475569", secondary: "#f1f5f9", headerBg: "#475569" },
  { label: "Rose", primary: "#e11d48", secondary: "#fff1f2", headerBg: "#e11d48" },
  { label: "Emerald", primary: "#059669", secondary: "#d1fae5", headerBg: "#059669" },
  { label: "Indigo", primary: "#4f46e5", secondary: "#e0e7ff", headerBg: "#4f46e5" },
  { label: "Black", primary: "#000000", secondary: "#f5f5f5", headerBg: "#000000" },
  { label: "White", primary: "#374151", secondary: "#ffffff", headerBg: "#ffffff" },
];

export const TEMPLATE_TYPES: { value: TemplateType; label: string; description: string; icon: string }[] = [
  { value: "prescription", label: "Prescription", description: "Medicine prescriptions with dosage and instructions", icon: "℞" },
  { value: "diagnosis", label: "Diagnosis", description: "Diagnosis reports, fitness certificates, sick leave", icon: "🩺" },
  { value: "test", label: "Lab Test", description: "Lab test orders with test categories and instructions", icon: "🧪" },
  { value: "appointment_slip", label: "Appointment Slip", description: "Appointment confirmation with patient, doctor, date and time", icon: "🗓️" },
];

// Body section copy varies by template type — the doctor fields are shared,
// but what they mean on the printed document differs (who prescribed vs.
// who examined vs. who ordered a test vs. who the appointment is with).
const BODY_SECTION_COPY: Record<TemplateType, string> = {
  prescription: 'Prescriber details shown in the document body (e.g. "Prescribed By").',
  diagnosis: 'Examiner details shown in the document body (e.g. "Examined By").',
  test: 'Referring/ordering doctor details shown in the document body (e.g. "Referred By").',
  appointment_slip: 'Consulting doctor details shown in the document body (e.g. "Doctor Details").',
};

const defaultLayout: LayoutConfig = {
  layoutStyle: "classic",
  headerStyle: "centered",
  fontFamily: "sans",
  paperSize: "A4",

  showRxSymbol: true,
  showPatientFields: true,
  showMedicineTable: true,
  showRecommendations: false,
  showFooter: true,
  showQRCode: false,
  showBorder: true,
  showClinicAddress: true,
  showRegistrationNo: true,
  showWatermark: false,
  showDiagnosis: true,
  showNotes: true,

  freeFormMode: false,
  writingLineCount: 20,
  showWritingLines: true,

  showSignatureLine: true,
  signatureText: "Signature:",

  showHeaderLine: true,
  headerLineColor: "#0ea5e9",

  recommendations: [],
  headerFields: [],
  primaryColor: "#0ea5e9",
  secondaryColor: "#e0f2fe",
  headerBgColor: "#0ea5e9",
  fontSize: "medium",

  footerText: "",
  footerColumns: ["address", "phone", "email"],
};

function emptyForm(): CreatePrescriptionTemplateInput {
  return {
    name: "",
    type: "prescription",
    description: "",
    clinicName: "",
    doctorName: "",
    doctorSpecialization: "",
    doctorQualification: "",
    doctorRegNo: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    clinicWebsite: "",
    logoUrl: "",
    isDefault: false,
  };
}

function formFromTemplate(template: PrescriptionTemplate): CreatePrescriptionTemplateInput {
  return {
    name: template.name,
    type: template.type ?? "prescription",
    description: template.description ?? "",
    clinicName: template.clinicName ?? "",
    doctorName: template.doctorName ?? "",
    doctorSpecialization: template.doctorSpecialization ?? "",
    doctorQualification: template.doctorQualification ?? "",
    doctorRegNo: template.doctorRegNo ?? "",
    clinicAddress: template.clinicAddress ?? "",
    clinicPhone: template.clinicPhone ?? "",
    clinicEmail: template.clinicEmail ?? "",
    clinicWebsite: template.clinicWebsite ?? "",
    logoUrl: template.logoUrl ?? "",
    isDefault: template.isDefault,
  };
}

// ─── Shared editor form (used by both the "new" and "edit" pages) ──

interface EditorFormProps {
  template: PrescriptionTemplate | null;
  onSaved: () => void;
  onCancel: () => void;
}

function TemplateEditorForm({ template, onSaved, onCancel }: EditorFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!template;

  const [form, setForm] = useState<CreatePrescriptionTemplateInput>(() => (template ? formFromTemplate(template) : emptyForm()));
  const [layout, setLayout] = useState<LayoutConfig>(() => ({ ...defaultLayout, ...((template?.layout as Record<string, any>) ?? {}) }));
  const [newRecommendation, setNewRecommendation] = useState("");
  const [newHeaderFieldLabel, setNewHeaderFieldLabel] = useState("");
  const [newHeaderFieldValue, setNewHeaderFieldValue] = useState("");
  const [newHeaderFieldSide, setNewHeaderFieldSide] = useState<"left" | "right">("right");
  const [activeTab, setActiveTab] = useState<"branding" | "layout" | "colors" | "sections" | "preview">("branding");
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  function onLogoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
    reader.onerror = () => toast.error("Failed to read image file");
    reader.readAsDataURL(file);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, layout };
      if (isEditing) {
        return updatePrescriptionTemplate(template!.id, payload);
      }
      return createPrescriptionTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescription-templates"] });
      toast.success(isEditing ? "Template updated" : "Template created");
      onSaved();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function addRecommendation() {
    if (!newRecommendation.trim()) return;
    setLayout((prev) => ({
      ...prev,
      recommendations: [...prev.recommendations, newRecommendation.trim()],
    }));
    setNewRecommendation("");
  }

  function addHeaderField() {
    if (!newHeaderFieldLabel.trim() || !newHeaderFieldValue.trim()) return;
    setLayout((prev) => ({
      ...prev,
      headerFields: [...prev.headerFields, { label: newHeaderFieldLabel.trim(), value: newHeaderFieldValue.trim(), side: newHeaderFieldSide }],
    }));
    setNewHeaderFieldLabel("");
    setNewHeaderFieldValue("");
  }

  function removeHeaderField(index: number) {
    setLayout((prev) => ({
      ...prev,
      headerFields: prev.headerFields.filter((_, i) => i !== index),
    }));
  }

  function removeRecommendation(index: number) {
    setLayout((prev) => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index),
    }));
  }

  function applyColorPreset(preset: typeof COLOR_PRESETS[number]) {
    setLayout((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      headerBgColor: preset.headerBg,
    }));
  }

  const tabs = [
    { key: "branding" as const, label: "Branding" },
    { key: "layout" as const, label: "Layout" },
    { key: "colors" as const, label: "Colors" },
    { key: "sections" as const, label: "Sections" },
    { key: "preview" as const, label: "Preview" },
  ];

  return (
    <div className="w-full space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{isEditing ? "Edit Template" : "New Template"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the prescription layout and branding for your clinic.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl space-y-6">
        {/* ── Branding Tab ── */}
        {activeTab === "branding" && (
          <>
            {/* Template Type */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Template Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setForm({ ...form, type: t.value });
                      // Auto-set layout defaults based on type
                      if (t.value === "diagnosis") {
                        setLayout((prev) => ({ ...prev, showMedicineTable: false, showDiagnosis: true, showNotes: true, freeFormMode: true, showWritingLines: true, writingLineCount: 15 }));
                      } else if (t.value === "test") {
                        setLayout((prev) => ({ ...prev, showMedicineTable: false, showDiagnosis: false, showNotes: false, freeFormMode: false, showWritingLines: false }));
                      } else if (t.value === "appointment_slip") {
                        setLayout((prev) => ({ ...prev, showMedicineTable: false, showDiagnosis: false, showNotes: false, freeFormMode: false, showWritingLines: false, showRxSymbol: false }));
                      } else {
                        setLayout((prev) => ({ ...prev, showMedicineTable: true, showDiagnosis: true, showNotes: true, freeFormMode: false }));
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      form.type === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <p className="text-sm font-medium">{t.label}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Template Name *</FieldLabel>
                  <Input
                    placeholder="e.g. Standard Clinic Rx"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    placeholder="Brief description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            {/* Header — clinic identity, printed at the top of the document */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Header</h3>
              <p className="-mt-2 text-[11px] text-muted-foreground">Clinic identity shown in the document's header banner — laid out as left/right halves.</p>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Left</p>
                  <Field>
                    <FieldLabel>Clinic Name</FieldLabel>
                    <Input
                      placeholder="My Clinic"
                      value={form.clinicName}
                      onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Logo</FieldLabel>
                    <div className="flex items-center gap-2">
                      {form.logoUrl ? (
                        <div className="relative shrink-0">
                          <img src={form.logoUrl} alt="Logo preview" className="size-9 rounded border object-contain bg-white" />
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, logoUrl: "" })}
                            className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                            title="Remove logo"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => logoFileInputRef.current?.click()}>
                          <ImageUp className="size-3.5" />
                          Upload
                        </Button>
                      )}
                      <Input
                        placeholder="or paste a logo URL..."
                        value={form.logoUrl}
                        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      />
                    </div>
                    <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoFileSelect} />
                  </Field>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Right</p>
                  <Field>
                    <FieldLabel>Clinic Address</FieldLabel>
                    <Input
                      placeholder="123 Main St, City"
                      value={form.clinicAddress}
                      onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Clinic Phone</FieldLabel>
                    <Input
                      placeholder="+91 98765 43210"
                      value={form.clinicPhone}
                      onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              {/* Custom header fields — user-defined label/value pairs, placed on whichever side is chosen */}
              <div className="space-y-2">
                <FieldLabel>Additional Header Fields</FieldLabel>
                <div className="flex flex-wrap gap-2 max-w-2xl">
                  <Input
                    className="flex-1 min-w-32"
                    placeholder="Label (e.g. GST No.)"
                    value={newHeaderFieldLabel}
                    onChange={(e) => setNewHeaderFieldLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHeaderField(); } }}
                  />
                  <Input
                    className="flex-1 min-w-32"
                    placeholder="Value"
                    value={newHeaderFieldValue}
                    onChange={(e) => setNewHeaderFieldValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHeaderField(); } }}
                  />
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setNewHeaderFieldSide("left")}
                      className={cn(
                        "px-3 text-xs font-medium transition-colors",
                        newHeaderFieldSide === "left" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHeaderFieldSide("right")}
                      className={cn(
                        "px-3 text-xs font-medium transition-colors border-l",
                        newHeaderFieldSide === "right" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Right
                    </button>
                  </div>
                  <Button variant="outline" onClick={addHeaderField} disabled={!newHeaderFieldLabel.trim() || !newHeaderFieldValue.trim()}>
                    Add
                  </Button>
                </div>
                {layout.headerFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {(["left", "right"] as const).map((side) => (
                      <div key={side} className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{side}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {layout.headerFields
                            .map((f, i) => ({ ...f, i }))
                            .filter((f) => f.side === side)
                            .map((f) => (
                              <span
                                key={f.i}
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
                              >
                                <span className="font-medium">{f.label}:</span> {f.value}
                                <button
                                  type="button"
                                  onClick={() => removeHeaderField(f.i)}
                                  className="ml-0.5 text-muted-foreground hover:text-destructive"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Body — prescriber details, printed in the document body */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Body</h3>
              <p className="-mt-2 text-[11px] text-muted-foreground">{BODY_SECTION_COPY[form.type ?? "prescription"]}</p>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Left</p>
                  <Field>
                    <FieldLabel>Doctor Name</FieldLabel>
                    <Input
                      placeholder="Dr. Smith"
                      value={form.doctorName}
                      onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Specialization</FieldLabel>
                    <Input
                      placeholder="General Medicine"
                      value={form.doctorSpecialization}
                      onChange={(e) => setForm({ ...form, doctorSpecialization: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Right</p>
                  <Field>
                    <FieldLabel>Qualification</FieldLabel>
                    <Input
                      placeholder="MBBS, MD"
                      value={form.doctorQualification}
                      onChange={(e) => setForm({ ...form, doctorQualification: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Registration No.</FieldLabel>
                    <Input
                      placeholder="MCI-10001"
                      value={form.doctorRegNo}
                      onChange={(e) => setForm({ ...form, doctorRegNo: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Footer — secondary contact channels, printed in the footer bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30">
                <div>
                  <h3 className="text-sm font-semibold">Footer</h3>
                  <p className="text-[11px] text-muted-foreground">Secondary contact details shown in the document's footer bar.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{layout.showFooter ? "Active" : "Inactive"}</span>
                  <Switch
                    checked={layout.showFooter}
                    onCheckedChange={(v) => setLayout({ ...layout, showFooter: v })}
                  />
                </div>
              </div>
              <div className={cn("grid grid-cols-2 gap-3", !layout.showFooter && "opacity-50 pointer-events-none")}>
                <Field>
                  <FieldLabel>Clinic Email</FieldLabel>
                  <Input
                    placeholder="info@clinic.com"
                    value={form.clinicEmail}
                    onChange={(e) => setForm({ ...form, clinicEmail: e.target.value })}
                    disabled={!layout.showFooter}
                  />
                </Field>
                <Field>
                  <FieldLabel>Clinic Website</FieldLabel>
                  <Input
                    placeholder="www.clinic.com"
                    value={form.clinicWebsite}
                    onChange={(e) => setForm({ ...form, clinicWebsite: e.target.value })}
                    disabled={!layout.showFooter}
                  />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Layout Tab ── */}
        {activeTab === "layout" && (
          <>
            {/* Layout Style */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Layout Style</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setLayout({ ...layout, layoutStyle: style.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      layout.layoutStyle === style.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-sm font-medium">{style.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Style */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Header Style</h3>
              <div className="flex flex-wrap gap-2">
                {HEADER_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setLayout({ ...layout, headerStyle: style.value })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      layout.headerStyle === style.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Font Family</h3>
              <div className="flex gap-2">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setLayout({ ...layout, fontFamily: font.value })}
                    className={`flex-1 p-2.5 rounded-lg border-2 text-center transition-all ${
                      layout.fontFamily === font.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-sm" style={{ fontFamily: font.css }}>Aa Bb Cc</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{font.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Paper Size</h3>
              <div className="flex gap-2">
                {PAPER_SIZES.map((paper) => (
                  <button
                    key={paper.value}
                    onClick={() => setLayout({ ...layout, paperSize: paper.value })}
                    className={`flex-1 p-2 rounded-lg border-2 text-center transition-all ${
                      layout.paperSize === paper.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-xs font-medium">{paper.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Font Size</h3>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setLayout({ ...layout, fontSize: size })}
                    className={`flex-1 p-2 rounded-lg border-2 text-center capitalize transition-all ${
                      layout.fontSize === size
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-xs font-medium">{size}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Colors Tab ── */}
        {activeTab === "colors" && (
          <>
            {/* Color Presets */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Color Presets</h3>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyColorPreset(preset)}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      layout.primaryColor === preset.primary
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex gap-0.5 justify-center mb-1">
                      <div className="size-4 rounded-full" style={{ background: preset.primary }} />
                      <div className="size-4 rounded-full" style={{ background: preset.secondary }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">{preset.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Custom Colors</h3>
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Primary</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layout.primaryColor}
                      onChange={(e) => setLayout({ ...layout, primaryColor: e.target.value })}
                      className="size-8 cursor-pointer rounded border"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{layout.primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Secondary</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layout.secondaryColor}
                      onChange={(e) => setLayout({ ...layout, secondaryColor: e.target.value })}
                      className="size-8 cursor-pointer rounded border"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{layout.secondaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Header BG</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layout.headerBgColor}
                      onChange={(e) => setLayout({ ...layout, headerBgColor: e.target.value })}
                      className="size-8 cursor-pointer rounded border"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{layout.headerBgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Sections Tab ── */}
        {activeTab === "sections" && (
          <>
            {/* Free-Form Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Free-Form Mode</h3>
              <div className="space-y-2.5 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm">Free-Form Writing</label>
                    <p className="text-[10px] text-muted-foreground">Replace medicine table with lined writing space</p>
                  </div>
                  <Switch
                    checked={layout.freeFormMode}
                    onCheckedChange={(v) => setLayout({ ...layout, freeFormMode: v, showMedicineTable: !v })}
                  />
                </div>
                {layout.freeFormMode && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm">Show Writing Lines</label>
                        <p className="text-[10px] text-muted-foreground">Horizontal lines for handwriting</p>
                      </div>
                      <Switch
                        checked={layout.showWritingLines}
                        onCheckedChange={(v) => setLayout({ ...layout, showWritingLines: v })}
                      />
                    </div>
                    <Field>
                      <FieldLabel>Number of Lines</FieldLabel>
                      <Input
                        type="number"
                        min={5}
                        max={40}
                        value={layout.writingLineCount}
                        onChange={(e) => setLayout({ ...layout, writingLineCount: parseInt(e.target.value) || 20 })}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Signature</h3>
              <div className="space-y-2.5 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm">Show Signature Line</label>
                    <p className="text-[10px] text-muted-foreground">Signature area at bottom of prescription</p>
                  </div>
                  <Switch
                    checked={layout.showSignatureLine}
                    onCheckedChange={(v) => setLayout({ ...layout, showSignatureLine: v })}
                  />
                </div>
                {layout.showSignatureLine && (
                  <Field>
                    <FieldLabel>Signature Text</FieldLabel>
                    <Input
                      placeholder="Signature:"
                      value={layout.signatureText}
                      onChange={(e) => setLayout({ ...layout, signatureText: e.target.value })}
                    />
                  </Field>
                )}
              </div>
            </div>

            {/* Header Line */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Header Separator</h3>
              <div className="space-y-2.5 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm">Show Header Line</label>
                    <p className="text-[10px] text-muted-foreground">Colored line below header</p>
                  </div>
                  <Switch
                    checked={layout.showHeaderLine}
                    onCheckedChange={(v) => setLayout({ ...layout, showHeaderLine: v })}
                  />
                </div>
                {layout.showHeaderLine && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Line Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layout.headerLineColor}
                        onChange={(e) => setLayout({ ...layout, headerLineColor: e.target.value })}
                        className="size-8 cursor-pointer rounded border"
                      />
                      <span className="text-[10px] font-mono text-muted-foreground">{layout.headerLineColor}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visibility Toggles — grouped by where they render on the page */}
            {(
              [
                {
                  group: "Header",
                  desc: "Elements shown in the document header, above the patient/appointment details.",
                  items: [
                    { key: "showRxSymbol" as const, label: "Rx Symbol (℞)", desc: "Show the prescription symbol" },
                    { key: "showClinicAddress" as const, label: "Clinic Address", desc: "Show address next to clinic name" },
                    { key: "showRegistrationNo" as const, label: "Registration No.", desc: "Show doctor registration number" },
                    { key: "showWatermark" as const, label: "Watermark", desc: "Faint clinic name watermark" },
                    { key: "showBorder" as const, label: "Page Border", desc: "Outer border around the document" },
                  ],
                },
                {
                  group: "Body",
                  desc: "The main content area between the header and footer.",
                  items: [
                    { key: "showPatientFields" as const, label: "Patient Fields", desc: "Name, Age, Sex, Date, Address" },
                    { key: "showDiagnosis" as const, label: "Diagnosis Section", desc: "Show diagnosis/ICD codes" },
                    { key: "showMedicineTable" as const, label: "Medicine Table", desc: "Tabular medicine list (disabled in free-form mode)" },
                    { key: "showNotes" as const, label: "Doctor Notes", desc: "Free-text notes area" },
                    { key: "showRecommendations" as const, label: "Recommendations", desc: "Checklist of recommendations" },
                  ],
                },
                {
                  group: "Footer",
                  desc: "Elements shown in the footer bar at the bottom of the document.",
                  items: [
                    { key: "showFooter" as const, label: "Footer", desc: "Clinic info footer bar" },
                    { key: "showQRCode" as const, label: "QR Code", desc: "QR code in footer" },
                  ],
                },
              ] as const
            ).map((section) => (
              <div key={section.group} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{section.group}</h3>
                  <p className="text-[10px] text-muted-foreground">{section.desc}</p>
                </div>
                <div className="space-y-2.5 rounded-lg border p-4">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm">{item.label}</label>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={item.key === "showMedicineTable" ? (layout.freeFormMode ? false : layout[item.key]) : layout[item.key]}
                        onCheckedChange={(v) => setLayout({ ...layout, [item.key]: v })}
                        disabled={item.key === "showMedicineTable" && layout.freeFormMode}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Recommendations */}
            {layout.showRecommendations && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Recommendations</h3>
                <div className="flex gap-2 max-w-lg">
                  <Input
                    placeholder="Add recommendation..."
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecommendation(); } }}
                  />
                  <Button variant="outline" onClick={addRecommendation} disabled={!newRecommendation.trim()}>
                    Add
                  </Button>
                </div>
                {layout.recommendations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {layout.recommendations.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
                      >
                        {r}
                        <button
                          type="button"
                          onClick={() => removeRecommendation(i)}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Text */}
            {layout.showFooter && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Footer</h3>
                <Field>
                  <FieldLabel>Footer Text</FieldLabel>
                  <Input
                    placeholder="Optional footer text..."
                    value={layout.footerText}
                    onChange={(e) => setLayout({ ...layout, footerText: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ── Preview Tab ── */}
        {activeTab === "preview" && (
          <div className="rounded-lg border bg-muted/30 p-4 min-h-[600px]">
            <PrescriptionTemplatePreview
              inline
              template={
                {
                  id: template?.id ?? "preview",
                  name: form.name || "Preview",
                  type: form.type,
                  description: form.description,
                  clinicName: form.clinicName,
                  doctorName: form.doctorName,
                  doctorSpecialization: form.doctorSpecialization,
                  doctorQualification: form.doctorQualification,
                  doctorRegNo: form.doctorRegNo,
                  clinicAddress: form.clinicAddress,
                  clinicPhone: form.clinicPhone,
                  clinicEmail: form.clinicEmail,
                  clinicWebsite: form.clinicWebsite,
                  logoUrl: form.logoUrl,
                  isDefault: form.isDefault,
                  layout: layout,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as PrescriptionTemplate
              }
              onOpenChange={() => {}}
            />
          </div>
        )}

        {/* Default toggle (always visible) */}
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30 max-w-lg">
          <Switch
            checked={form.isDefault}
            onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
          />
          <div>
            <p className="text-sm font-medium">Set as Default</p>
            <p className="text-xs text-muted-foreground">
              This template will be used automatically when printing prescriptions.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-40 -mx-6 border-t bg-background px-6 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Route pages ───────────────────────────────────────────

export function NewPrescriptionTemplatePage() {
  const navigate = useNavigate();
  function goBack() { navigate({ to: "/organisation/prescription-templates" }); }
  return <TemplateEditorForm template={null} onSaved={goBack} onCancel={goBack} />;
}

export function EditPrescriptionTemplatePage() {
  const navigate = useNavigate();
  const { templateId } = useParams({ from: "/_dashboard/organisation/prescription-templates/$templateId/edit" });
  function goBack() { navigate({ to: "/organisation/prescription-templates" }); }

  const { data: template, isLoading } = useQuery({
    queryKey: ["prescription-template", templateId],
    queryFn: () => fetchPrescriptionTemplate(templateId),
  });

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading template...</p>;
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Template not found</p>
        <Button variant="outline" onClick={goBack}>Back to Templates</Button>
      </div>
    );
  }

  return <TemplateEditorForm template={template} onSaved={goBack} onCancel={goBack} />;
}
