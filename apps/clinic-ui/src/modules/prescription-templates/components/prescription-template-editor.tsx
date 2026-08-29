import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
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
];

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
  primaryColor: "#0ea5e9",
  secondaryColor: "#e0f2fe",
  headerBgColor: "#0ea5e9",
  fontSize: "medium",

  footerText: "",
  footerColumns: ["address", "phone", "email"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrescriptionTemplate | null;
}

export function PrescriptionTemplateEditor({ open, onOpenChange, template }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!template;

  const [form, setForm] = useState<CreatePrescriptionTemplateInput>({
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
  });

  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout);
  const [newRecommendation, setNewRecommendation] = useState("");
  const [activeTab, setActiveTab] = useState<"branding" | "layout" | "colors" | "sections" | "preview">("branding");

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({
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
        });
        setLayout({ ...defaultLayout, ...(template.layout as Record<string, any> ?? {}) });
      } else {
        setForm({
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
        });
        setLayout(defaultLayout);
      }
      setNewRecommendation("");
      setActiveTab("branding");
    }
  }, [open, template?.id]);

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
      onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Template" : "New Prescription Template"}</SheetTitle>
          <SheetDescription>
            Configure the prescription layout and branding for your clinic.
          </SheetDescription>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-4 pt-4 border-b">
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

        <div className="flex-1 space-y-6 px-4 pb-4 pt-4">
          {/* ── Branding Tab ── */}
          {activeTab === "branding" && (
            <>
              {/* Template Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Template Type</h3>
                <div className="grid grid-cols-3 gap-2">
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

              {/* Clinic Branding */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Clinic Branding</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Clinic Name</FieldLabel>
                    <Input
                      placeholder="My Clinic"
                      value={form.clinicName}
                      onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Logo URL</FieldLabel>
                    <Input
                      placeholder="https://..."
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    />
                  </Field>
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
                  <Field>
                    <FieldLabel>Clinic Email</FieldLabel>
                    <Input
                      placeholder="info@clinic.com"
                      value={form.clinicEmail}
                      onChange={(e) => setForm({ ...form, clinicEmail: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Clinic Website</FieldLabel>
                    <Input
                      placeholder="www.clinic.com"
                      value={form.clinicWebsite}
                      onChange={(e) => setForm({ ...form, clinicWebsite: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Doctor Details (Default)</h3>
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-4 gap-2">
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
                <div className="grid grid-cols-3 gap-3">
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

              {/* Visibility Toggles */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Section Visibility</h3>
                <div className="space-y-2.5 rounded-lg border p-4">
                  {[
                    { key: "showRxSymbol" as const, label: "Rx Symbol (℞)", desc: "Show the prescription symbol" },
                    { key: "showPatientFields" as const, label: "Patient Fields", desc: "Name, Age, Sex, Date, Address" },
                    { key: "showDiagnosis" as const, label: "Diagnosis Section", desc: "Show diagnosis/ICD codes" },
                    { key: "showMedicineTable" as const, label: "Medicine Table", desc: "Tabular medicine list (disabled in free-form mode)" },
                    { key: "showNotes" as const, label: "Doctor Notes", desc: "Free-text notes area" },
                    { key: "showRecommendations" as const, label: "Recommendations", desc: "Checklist of recommendations" },
                    { key: "showFooter" as const, label: "Footer", desc: "Clinic info footer bar" },
                    { key: "showQRCode" as const, label: "QR Code", desc: "QR code in footer" },
                    { key: "showBorder" as const, label: "Page Border", desc: "Outer border around prescription" },
                    { key: "showClinicAddress" as const, label: "Clinic Address", desc: "Show address in header/footer" },
                    { key: "showRegistrationNo" as const, label: "Registration No.", desc: "Show doctor registration number" },
                    { key: "showWatermark" as const, label: "Watermark", desc: "Faint clinic name watermark" },
                  ].map((item) => (
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

              {/* Recommendations */}
              {layout.showRecommendations && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Recommendations</h3>
                  <div className="flex gap-2">
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
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
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

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
