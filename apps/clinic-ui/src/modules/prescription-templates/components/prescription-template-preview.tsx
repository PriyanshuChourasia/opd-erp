import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PrescriptionTemplate, TemplateType } from "@/lib/api";
import { FONT_FAMILIES } from "./prescription-template-editor";

/** Real prescription data to fill the template with, instead of blank
 *  design-time placeholders. Omit this prop entirely for the editor's
 *  design preview, which must keep rendering blanks unchanged. */
export interface PrescriptionPrintData {
  patient: { firstName: string; lastName: string; dateOfBirth?: string | null; gender?: string | null };
  items: Array<{ medicineName: string; dosage: string; duration?: string | null; instructions?: string | null }>;
  diagnosis?: string | null;
  notes?: string | null;
  date: string;
}

interface Props {
  template: PrescriptionTemplate | null;
  onOpenChange: (open: boolean) => void;
  /** When true, renders preview content inline (no Sheet wrapper) */
  inline?: boolean;
  /** When present, renders real prescription data instead of blank placeholders */
  data?: PrescriptionPrintData;
}

function calculateAge(dateOfBirth?: string | null): string {
  if (!dateOfBirth) return "";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "";
  const diffMs = Date.now() - dob.getTime();
  return String(Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
}

export function PrescriptionTemplatePreview({ template, onOpenChange, inline = false, data }: Props) {
  if (!template) return null;

  /** Wraps content in Sheet (default) or renders inline (editor preview) */
  const PreviewWrapper = ({ children }: { children: React.ReactNode }) => {
    if (inline) return <div className="mx-auto">{children}</div>;
    return (
      <Sheet open={!!template} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[90vw] max-w-[700px] overflow-y-auto bg-muted/30">
          <SheetHeader><SheetTitle>Preview: {template.name}</SheetTitle></SheetHeader>
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  };


  const templateType: TemplateType = template.type ?? "prescription";
  const layout = (template.layout as Record<string, any>) ?? {};
  const primaryColor = layout.primaryColor ?? "#0ea5e9";
  const secondaryColor = layout.secondaryColor ?? "#e0f2fe";
  const headerBgColor = layout.headerBgColor ?? primaryColor;
  const layoutStyle = layout.layoutStyle ?? "classic";
  const headerStyle = layout.headerStyle ?? "centered";
  const fontFamily = layout.fontFamily ?? "sans";
  const fontSize = layout.fontSize ?? "medium";
  const showRxSymbol = layout.showRxSymbol !== false;
  const showPatientFields = layout.showPatientFields !== false;
  const showMedicineTable = layout.showMedicineTable !== false;
  const showRecommendations = layout.showRecommendations === true;
  const showFooter = layout.showFooter !== false;
  const showQRCode = layout.showQRCode === true;
  const showBorder = layout.showBorder !== false;
  const showClinicAddress = layout.showClinicAddress !== false;
  const showRegistrationNo = layout.showRegistrationNo !== false;
  const showWatermark = layout.showWatermark === true;
  const showDiagnosis = layout.showDiagnosis !== false;
  const showNotes = layout.showNotes !== false;
  const freeFormMode = layout.freeFormMode === true;
  const showWritingLines = layout.showWritingLines !== false;
  const writingLineCount = layout.writingLineCount ?? 20;
  const showSignatureLine = layout.showSignatureLine !== false;
  const signatureText: string = layout.signatureText ?? "Signature:";
  const showHeaderLine = layout.showHeaderLine !== false;
  const headerLineColor: string = layout.headerLineColor ?? primaryColor;
  const recommendations: string[] = layout.recommendations ?? [];
  const footerText: string = layout.footerText ?? "";

  const fontCss = FONT_FAMILIES.find((f) => f.value === fontFamily)?.css ?? "'Inter', sans-serif";
  const fontSizeMap = { small: "10px", medium: "12px", large: "14px" };
  const baseFontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap] ?? "12px";

  // ─── Helper: Header Line ───
  const HeaderLine = ({ color }: { color?: string }) => (
    showHeaderLine ? (
      <div className="px-4"><div className="h-[2px]" style={{ background: color ?? headerLineColor }} /></div>
    ) : null
  );

  // ─── Helper: Patient Fields ───
  const patientName = data ? `${data.patient.firstName} ${data.patient.lastName}` : "";
  const patientAge = data ? calculateAge(data.patient.dateOfBirth) : "";
  const patientGender = data?.patient.gender ?? "";
  const patientDate = data?.date ?? "";

  const PatientFields = ({ inline = false }: { inline?: boolean }) => (
    inline ? (
      // Single-line patient fields (for letterhead/compact)
      <div className="flex items-center gap-4 px-4 py-2.5 text-xs" style={{ borderBottom: `1px solid ${primaryColor}15`, fontSize: baseFontSize }}>
        <span className="text-muted-foreground">Name: <span className="text-foreground">{data ? patientName : "___________"}</span></span>
        <span className="text-muted-foreground">Age: <span className="text-foreground">{data ? patientAge : "___"}</span></span>
        <span className="text-muted-foreground">Gender: <span className="text-foreground">{data ? patientGender : "___"}</span></span>
        <span className="text-muted-foreground">Date: <span className="text-foreground">{data ? patientDate : "___________"}</span></span>
      </div>
    ) : (
      // Standard 2-column patient fields
      <div className="grid gap-x-4 gap-y-2 px-4 py-3 text-sm" style={{ borderBottom: `1px solid ${primaryColor}15`, fontSize: baseFontSize }}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Name:</span>
            {data ? <span className="flex-1">{patientName}</span> : <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Date:</span>
            {data ? <span className="flex-1">{patientDate}</span> : <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Age:</span>
            {data ? <span className="flex-1">{patientAge}</span> : <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Sex:</span>
            {data ? <span className="flex-1">{patientGender}</span> : <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>}
          </div>
        </div>
        {!data && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Adv:</span>
            <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>
          </div>
        )}
      </div>
    )
  );

  // ─── Helper: Medicine Table ───
  const MedicineTable = () => (
    !freeFormMode && showMedicineTable ? (
      <div className="px-4 py-3" style={{ fontSize: baseFontSize }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `2px solid ${primaryColor}40` }}>
              {["#", "Medicine", "Dosage", "Duration", "Instructions"].map((col) => (
                <th key={col} className="py-1.5 px-2 text-left font-semibold" style={{ color: primaryColor }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data ? (
              data.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${primaryColor}10` }}>
                  <td className="py-2 px-2 text-muted-foreground">{i + 1}.</td>
                  <td className="py-2 px-2">{item.medicineName}</td>
                  <td className="py-2 px-2">{item.dosage}</td>
                  <td className="py-2 px-2">{item.duration || "—"}</td>
                  <td className="py-2 px-2">{item.instructions || "—"}</td>
                </tr>
              ))
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${primaryColor}10` }}>
                  <td className="py-2 px-2 text-muted-foreground">{i}.</td>
                  <td className="py-2 px-2">&nbsp;</td>
                  <td className="py-2 px-2">&nbsp;</td>
                  <td className="py-2 px-2">&nbsp;</td>
                  <td className="py-2 px-2">&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    ) : null
  );

  // ─── Helper: Writing Lines (for free-form mode) ───
  const WritingLines = () => (
    freeFormMode && showWritingLines ? (
      <div className="px-4 py-3" style={{ fontSize: baseFontSize }}>
        {data ? (
          <div className="space-y-2 whitespace-pre-wrap">
            {data.notes || data.diagnosis || ""}
          </div>
        ) : (
          Array.from({ length: writingLineCount }).map((_, i) => (
            <div key={i} className="border-b border-muted-foreground/20" style={{ height: "24px" }} />
          ))
        )}
      </div>
    ) : null
  );

  // ─── Helper: Signature Line ───
  const SignatureLine = () => (
    showSignatureLine ? (
      <div className="px-4 py-3 flex justify-end">
        <div className="text-right">
          <div className="border-b border-muted-foreground/40 w-32 mb-1" />
          <p className="text-xs text-muted-foreground">{signatureText}</p>
        </div>
      </div>
    ) : null
  );

  // ─── Helper: Recommendations ───
  const Recommendations = () => (
    showRecommendations && recommendations.length > 0 ? (
      <div className="px-4 py-3" style={{ borderBottom: showFooter ? `1px solid ${primaryColor}15` : "none" }}>
        <p className="text-xs font-semibold mb-1.5" style={{ color: primaryColor }}>Recommendations</p>
        <div className="space-y-1">
          {recommendations.map((r, i) => (
            <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-3 border rounded-sm shrink-0" />
              {r}
            </label>
          ))}
        </div>
      </div>
    ) : null
  );

  // ─── Helper: Diagnosis + Notes ───
  const DiagnosisNotes = () => (
    <div className="px-4 py-3 space-y-2" style={{ borderBottom: `1px solid ${primaryColor}15`, fontSize: baseFontSize }}>
      {showDiagnosis && (
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Diagnosis</p>
          {data ? (
            <p className="min-h-5 whitespace-pre-wrap">{data.diagnosis || "—"}</p>
          ) : (
            <div className="border-b border-dashed border-muted-foreground/30 h-5">&nbsp;</div>
          )}
        </div>
      )}
      {showNotes && (
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Notes</p>
          {data ? (
            <p className="min-h-12 whitespace-pre-wrap">{data.notes || "—"}</p>
          ) : (
            <div className="border border-dashed border-muted-foreground/20 rounded h-12">&nbsp;</div>
          )}
        </div>
      )}
    </div>
  );

  // ─── Helper: Footer ───
  const Footer = () => (
    showFooter ? (
      <div
        className="px-4 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground"
        style={{ borderTop: `2px solid ${primaryColor}20`, background: `${primaryColor}08` }}
      >
        <div>
          {showClinicAddress && template.clinicAddress && <p>{template.clinicAddress}</p>}
          {showRegistrationNo && template.doctorRegNo && <p>Reg. No: {template.doctorRegNo}</p>}
          {(template.clinicPhone || template.clinicEmail) && (
            <p>{[template.clinicPhone, template.clinicEmail].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        {footerText && <p className="text-right">{footerText}</p>}
        {showQRCode && (
          <div className="size-10 bg-muted rounded flex items-center justify-center text-[8px] text-muted-foreground">
            QR
          </div>
        )}
      </div>
    ) : null
  );

  // ─── Helper: Diagnosis Template Content ───
  const DiagnosisTemplateContent = () => (
    <div className="px-4 py-3 space-y-3" style={{ fontSize: baseFontSize }}>
      {/* Clinical Findings */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Clinical Findings</p>
        <div className="space-y-1.5">
          {["General Appearance", "Vital Signs", "Systemic Examination"].map((field) => (
            <div key={field} className="flex items-baseline gap-2">
              <span className="text-[10px] text-muted-foreground shrink-0 w-28">{field}:</span>
              <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>
            </div>
          ))}
        </div>
      </div>
      {/* Diagnosis */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Diagnosis</p>
        <div className="border border-dashed border-muted-foreground/20 rounded h-10">&nbsp;</div>
      </div>
      {/* Investigations Advised */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Investigations Advised</p>
        <div className="border border-dashed border-muted-foreground/20 rounded h-10">&nbsp;</div>
      </div>
      {/* Treatment Plan */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Treatment Plan</p>
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-muted-foreground/15" style={{ height: "22px" }} />
          ))}
        </div>
      </div>
      {/* Advice */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Advice</p>
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-muted-foreground/15" style={{ height: "22px" }} />
          ))}
        </div>
      </div>
      {/* Follow-up */}
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold shrink-0" style={{ color: primaryColor }}>Follow-up:</span>
        <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>
      </div>
    </div>
  );

  // ─── Helper: Lab Test Template Content ───
  const TestTemplateContent = () => (
    <div className="px-4 py-3 space-y-3" style={{ fontSize: baseFontSize }}>
      {/* Clinical History */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Clinical History / Reason for Testing</p>
        <div className="border border-dashed border-muted-foreground/20 rounded h-8">&nbsp;</div>
      </div>
      {/* Test Categories */}
      {[
        { category: "Haematology", tests: ["Complete Blood Count (CBC)", "ESR", "Blood Sugar Fasting", "HbA1c", "Lipid Profile"] },
        { category: "Biochemistry", tests: ["Liver Function Test (LFT)", "Renal Function Test (RFT)", "Thyroid Profile", "Serum Electrolytes"] },
        { category: "Urinalysis", tests: ["Routine Urine Examination", "Urine Culture & Sensitivity"] },
        { category: "Microbiology", tests: ["Blood Culture", "Throat Swab Culture"] },
        { category: "Imaging", tests: ["X-Ray", "Ultrasound", "CT Scan", "MRI"] },
        { category: "Other", tests: ["ECG", "Echocardiography", "Pulmonary Function Test"] },
      ].map((cat) => (
        <div key={cat.category}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: primaryColor }}>{cat.category}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {cat.tests.map((test) => (
              <label key={test} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="size-3 border rounded-sm shrink-0" />
                {test}
              </label>
            ))}
          </div>
        </div>
      ))}
      {/* Special Instructions */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Special Instructions</p>
        <div className="space-y-1">
          {["Fasting required (8-12 hours)", "Morning sample preferred", "No medication before test"].map((instr) => (
            <label key={instr} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-3 border rounded-sm shrink-0" />
              {instr}
            </label>
          ))}
        </div>
      </div>
      {/* Additional Notes */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>Additional Notes</p>
        <div className="border border-dashed border-muted-foreground/20 rounded h-8">&nbsp;</div>
      </div>
    </div>
  );

  // ─── Helper: Full Body Content ───
  const BodyContent = ({ patientInline = false }: { patientInline?: boolean }) => (
    <>
      {showPatientFields && <PatientFields inline={patientInline} />}
      {templateType === "diagnosis" ? (
        <DiagnosisTemplateContent />
      ) : templateType === "test" ? (
        <TestTemplateContent />
      ) : (
        <>
          {freeFormMode ? <WritingLines /> : <MedicineTable />}
          <DiagnosisNotes />
        </>
      )}
      <Recommendations />
      <SignatureLine />
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: CLASSIC
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "classic") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-lg" style={{ border: showBorder ? `1px solid #e5e7eb` : "none", borderTop: showBorder ? `4px solid ${primaryColor}` : "none" }}>
              {/* Header */}
              <div className={`flex items-center gap-3 p-4 pb-3 ${headerStyle === "centered" ? "justify-center text-center" : headerStyle === "right" ? "justify-end text-right" : ""}`} style={{ borderBottom: `2px solid ${primaryColor}20` }}>
                {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded" />}
                <div className="flex-1">
                  <p className="text-base font-bold" style={{ color: primaryColor }}>{template.clinicName || "Clinic Name"}</p>
                  {(template.doctorName || template.doctorSpecialization) && (
                    <p className="text-xs text-muted-foreground">
                      {template.doctorName}{template.doctorSpecialization && ` · ${template.doctorSpecialization}`}{template.doctorQualification && ` · ${template.doctorQualification}`}
                    </p>
                  )}
                </div>
                {showRxSymbol && <span className="text-4xl font-bold italic" style={{ color: primaryColor, opacity: 0.4 }}>℞</span>}
              </div>
              {showPatientFields && <PatientFields />}
              {showMedicineTable && <MedicineTable />}
              <DiagnosisNotes />
              <Recommendations />
              <Footer />
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: MODERN
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "modern") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-lg rounded-xl overflow-hidden" style={{ border: showBorder ? `1px solid ${primaryColor}20` : "none" }}>
              {/* Colored Header Banner */}
              <div className="p-5 text-white relative" style={{ background: `linear-gradient(135deg, ${headerBgColor}, ${headerBgColor}dd)` }}>
                {showWatermark && <div className="absolute inset-0 flex items-center justify-center text-[80px] font-bold opacity-5" style={{ color: "white" }}>℞</div>}
                <div className="relative flex items-center gap-4">
                  {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-white/20 p-1" />}
                  <div className="flex-1">
                    <p className="text-lg font-bold">{template.clinicName || "Clinic Name"}</p>
                    {(template.doctorName || template.doctorSpecialization) && (
                      <p className="text-xs opacity-90">
                        {template.doctorName}{template.doctorSpecialization && ` · ${template.doctorSpecialization}`}
                      </p>
                    )}
                  </div>
                  {showRxSymbol && <span className="text-5xl font-bold italic opacity-30">℞</span>}
                </div>
              </div>
              {/* Body */}
              {showPatientFields && <PatientFields />}
              {showMedicineTable && <MedicineTable />}
              <DiagnosisNotes />
              <Recommendations />
              <Footer />
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: MINIMAL
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "minimal") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-sm" style={{ border: showBorder ? "1px solid #e5e7eb" : "none" }}>
              {/* Minimal Header — just name + Rx */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${primaryColor}30` }}>
                <div>
                  {template.clinicName && <p className="text-sm font-semibold" style={{ color: primaryColor }}>{template.clinicName}</p>}
                  {template.doctorName && <p className="text-[10px] text-muted-foreground">{template.doctorName}</p>}
                </div>
                {showRxSymbol && <span className="text-2xl font-bold italic" style={{ color: primaryColor }}>℞</span>}
              </div>
              {showPatientFields && <PatientFields />}
              {showMedicineTable && <MedicineTable />}
              <DiagnosisNotes />
              <Recommendations />
              {showFooter && (
                <div className="px-4 py-2 text-[9px] text-muted-foreground text-center" style={{ borderTop: `1px solid ${primaryColor}15` }}>
                  {template.doctorRegNo && <span>Reg: {template.doctorRegNo}</span>}
                  {footerText && <span> · {footerText}</span>}
                </div>
              )}
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: TWO-COLUMN
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "two-column") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-lg" style={{ border: showBorder ? `1px solid #e5e7eb` : "none", borderTop: showBorder ? `4px solid ${primaryColor}` : "none" }}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 pb-3" style={{ borderBottom: `2px solid ${primaryColor}20` }}>
                {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />}
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: primaryColor }}>{template.clinicName || "Clinic Name"}</p>
                  {template.doctorName && <p className="text-[10px] text-muted-foreground">{template.doctorName}</p>}
                </div>
                {showRxSymbol && <span className="text-3xl font-bold italic" style={{ color: primaryColor, opacity: 0.4 }}>℞</span>}
              </div>
              {/* Two-Column Body */}
              <div className="flex" style={{ minHeight: "300px" }}>
                {/* Left Column — Patient Info */}
                <div className="w-1/2 p-4 text-xs" style={{ borderRight: `1px solid ${primaryColor}15` }}>
                  <p className="font-semibold text-xs mb-2" style={{ color: primaryColor }}>Patient Details</p>
                  <div className="space-y-2">
                    {(["Name", "Age", "Sex", "Date", "Address", "Phone"] as const).map((field) => {
                      const value = data
                        ? field === "Name" ? patientName
                          : field === "Age" ? patientAge
                          : field === "Sex" ? patientGender
                          : field === "Date" ? patientDate
                          : ""
                        : "";
                      return (
                        <div key={field} className="flex items-baseline gap-1">
                          <span className="text-muted-foreground shrink-0">{field}:</span>
                          {data ? <span className="flex-1">{value || "—"}</span> : <span className="border-b border-dashed border-muted-foreground/30 flex-1">&nbsp;</span>}
                        </div>
                      );
                    })}
                  </div>
                  {showDiagnosis && (
                    <div className="mt-4">
                      <p className="font-semibold text-xs mb-1" style={{ color: primaryColor }}>Diagnosis</p>
                      {data ? (
                        <p className="min-h-4 whitespace-pre-wrap">{data.diagnosis || "—"}</p>
                      ) : (
                        <div className="border-b border-dashed border-muted-foreground/30 h-4">&nbsp;</div>
                      )}
                    </div>
                  )}
                  {showRecommendations && recommendations.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold text-xs mb-1" style={{ color: primaryColor }}>Recommendations</p>
                      <div className="space-y-1">
                        {recommendations.map((r, i) => (
                          <label key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="size-2.5 border rounded-sm shrink-0" />{r}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Right Column — Medicines */}
                <div className="w-1/2 p-4">
                  <p className="font-semibold text-xs mb-2" style={{ color: primaryColor }}>Medicines</p>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${primaryColor}30` }}>
                        {["#", "Medicine", "Dosage", "Duration"].map((col) => (
                          <th key={col} className="py-1 px-1 text-left font-semibold" style={{ color: primaryColor }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data ? (
                        data.items.map((item, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${primaryColor}08` }}>
                            <td className="py-1.5 px-1 text-muted-foreground">{i + 1}.</td>
                            <td className="py-1.5 px-1">{item.medicineName}</td>
                            <td className="py-1.5 px-1">{item.dosage}</td>
                            <td className="py-1.5 px-1">{item.duration || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        [1, 2, 3, 4, 5, 6].map((i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${primaryColor}08` }}>
                            <td className="py-1.5 px-1 text-muted-foreground">{i}.</td>
                            <td className="py-1.5 px-1">&nbsp;</td>
                            <td className="py-1.5 px-1">&nbsp;</td>
                            <td className="py-1.5 px-1">&nbsp;</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {showNotes && (
                    <div className="mt-3">
                      <p className="font-semibold text-xs mb-1" style={{ color: primaryColor }}>Notes</p>
                      {data ? (
                        <p className="min-h-10 text-[10px] whitespace-pre-wrap">{data.notes || "—"}</p>
                      ) : (
                        <div className="border border-dashed border-muted-foreground/20 rounded h-10 text-[10px]">&nbsp;</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: COMPACT
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "compact") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-md text-xs" style={{ border: showBorder ? "1px solid #e5e7eb" : "none" }}>
              {/* Compact Header — single line */}
              <div className="flex items-center justify-between px-3 py-2" style={{ background: secondaryColor, borderBottom: `2px solid ${primaryColor}` }}>
                <div className="flex items-center gap-2">
                  {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-6 w-6 object-contain rounded" />}
                  <div>
                    <span className="font-bold text-xs" style={{ color: primaryColor }}>{template.clinicName || "Clinic"}</span>
                    {template.doctorName && <span className="text-muted-foreground ml-1">· {template.doctorName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showRxSymbol && <span className="text-lg font-bold italic" style={{ color: primaryColor }}>℞</span>}
                </div>
              </div>
              {/* Compact Patient Row */}
              {showPatientFields && (
                <div className="flex items-center gap-4 px-3 py-1.5" style={{ borderBottom: `1px solid ${primaryColor}15` }}>
                  <span className="text-muted-foreground">Name: <span className="text-foreground">___________</span></span>
                  <span className="text-muted-foreground">Age: <span className="text-foreground">___</span></span>
                  <span className="text-muted-foreground">Sex: <span className="text-foreground">___</span></span>
                  <span className="text-muted-foreground">Date: <span className="text-foreground">___________</span></span>
                </div>
              )}
              {/* Compact Medicine List */}
              {showMedicineTable && (
                <div className="px-3 py-2">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${primaryColor}30` }}>
                        {["#", "Medicine", "Dosage", "Duration"].map((col) => (
                          <th key={col} className="py-0.5 px-1 text-left font-semibold" style={{ color: primaryColor }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${primaryColor}08` }}>
                          <td className="py-1 px-1 text-muted-foreground">{i}.</td>
                          <td className="py-1 px-1">&nbsp;</td>
                          <td className="py-1 px-1">&nbsp;</td>
                          <td className="py-1 px-1">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <DiagnosisNotes />
              <Recommendations />
              {/* Compact Footer */}
              {showFooter && (
                <div className="px-3 py-1.5 flex items-center justify-between text-[9px] text-muted-foreground" style={{ borderTop: `1px solid ${primaryColor}20`, background: `${primaryColor}03` }}>
                  <span>{showClinicAddress && template.clinicAddress}{showRegistrationNo && template.doctorRegNo && ` · Reg: ${template.doctorRegNo}`}</span>
                  {footerText && <span>{footerText}</span>}
                </div>
              )}
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: BANNER
  // ═══════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════
  // LAYOUT: LETTERHEAD
  // Hospital letterhead style — split header (doctor left, hospital right), line separator
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "letterhead") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-lg" style={{ border: showBorder ? `1px solid #e5e7eb` : "none" }}>
              {/* Split Header */}
              <div className="flex items-start justify-between px-5 py-4" style={{ fontSize: baseFontSize }}>
                {/* Left: Doctor info + logo */}
                <div className="flex items-start gap-3">
                  {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded" />}
                  <div>
                    {template.doctorName && <p className="text-sm font-bold" style={{ color: primaryColor }}>{template.doctorName}</p>}
                    {template.doctorSpecialization && <p className="text-xs text-muted-foreground">Specialist in {template.doctorSpecialization}</p>}
                    {template.doctorQualification && <p className="text-[10px] text-muted-foreground">{template.doctorQualification}</p>}
                  </div>
                </div>
                {/* Right: Hospital info */}
                <div className="text-right">
                  {template.clinicName && <p className="text-sm font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{template.clinicName}</p>}
                  {showClinicAddress && template.clinicAddress && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {template.clinicAddress.split(',').map((line: string, i: number) => (
                        <p key={i}>{line.trim()}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <HeaderLine />
              {/* Patient Fields — single line */}
              {showPatientFields && <PatientFields inline />}
              {/* Body */}
              <BodyContent />
              {showFooter && (
                <div className="px-4 py-2 text-[9px] text-muted-foreground" style={{ borderTop: `1px solid ${primaryColor}15` }}>
                  {showRegistrationNo && template.doctorRegNo && <span>Reg: {template.doctorRegNo}</span>}
                  {footerText && <span className="ml-2">{footerText}</span>}
                </div>
              )}
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: DOCTOR'S SCRIPT
  // Free-form writing pad with lined paper feel, handwriting font
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "doctor-script") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-md" style={{ border: showBorder ? `1px solid #e5e7eb` : "none" }}>
              {/* Minimal Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />}
                  <div>
                    {template.clinicName && <p className="text-xs font-bold" style={{ color: primaryColor }}>{template.clinicName}</p>}
                    {template.doctorName && <p className="text-[10px] text-muted-foreground">{template.doctorName}</p>}
                  </div>
                </div>
                {showRxSymbol && <span className="text-3xl font-bold italic" style={{ color: primaryColor, opacity: 0.5 }}>℞</span>}
              </div>
              <HeaderLine />
              {/* Patient row */}
              {showPatientFields && <PatientFields inline />}
              {/* Writing lines — the main body */}
              <WritingLines />
              {/* Diagnosis + Notes */}
              <DiagnosisNotes />
              <Recommendations />
              <SignatureLine />
              {/* Minimal footer */}
              {showFooter && (
                <div className="px-4 py-1.5 text-[9px] text-muted-foreground text-center" style={{ borderTop: `1px solid ${primaryColor}10` }}>
                  {showRegistrationNo && template.doctorRegNo && <span>Reg: {template.doctorRegNo}</span>}
                  {footerText && <span className="ml-2">{footerText}</span>}
                </div>
              )}
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: PRESCRIPTION PAD
  // Classic pad — header, patient fields, writing space, signature
  // No medicine table, no heavy footer — just the essentials
  // ═══════════════════════════════════════════════════════════
  if (layoutStyle === "prescription-pad") {
    return (
      <PreviewWrapper>
                <div style={{ fontFamily: fontCss }}>
            <div className="bg-white shadow-lg" style={{ border: showBorder ? `1px solid #e5e7eb` : "none" }}>
              {/* Header — left doctor, right hospital with line below */}
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded" />}
                  <div>
                    {template.doctorName && <p className="text-sm font-bold italic" style={{ color: primaryColor }}>{template.doctorName}</p>}
                    {template.doctorSpecialization && <p className="text-[10px] text-muted-foreground">Specialist in {template.doctorSpecialization}</p>}
                  </div>
                </div>
                <div className="text-right">
                  {template.clinicName && <p className="text-sm font-bold uppercase" style={{ color: primaryColor }}>{template.clinicName}</p>}
                  {showClinicAddress && template.clinicAddress && <p className="text-[10px] text-muted-foreground">{template.clinicAddress}</p>}
                </div>
              </div>
              <HeaderLine />
              {/* Patient fields — single line */}
              {showPatientFields && <PatientFields inline />}
              {/* Free-form writing lines */}
              <WritingLines />
              {/* Signature at bottom right */}
              <SignatureLine />
            </div>
          </div>
        </PreviewWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LAYOUT: BANNER (default fallback)
  // ═══════════════════════════════════════════════════════════
  return (
    <PreviewWrapper>
              <div style={{ fontFamily: fontCss }}>
          <div className="bg-white shadow-xl overflow-hidden" style={{ border: showBorder ? `1px solid ${primaryColor}30` : "none" }}>
            {/* Full Banner Header */}
            <div className="relative p-6 pb-8 text-center text-white" style={{ background: `linear-gradient(180deg, ${headerBgColor}, ${headerBgColor}cc)` }}>
              {showWatermark && <div className="absolute inset-0 flex items-center justify-center text-[120px] font-bold opacity-5" style={{ color: "white" }}>℞</div>}
              <div className="relative">
                {template.logoUrl && <img src={template.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl bg-white/20 p-1.5 mx-auto mb-2" />}
                <p className="text-xl font-bold tracking-wide">{template.clinicName || "Clinic Name"}</p>
                {(template.doctorName || template.doctorSpecialization) && (
                  <p className="text-xs opacity-90 mt-0.5">{template.doctorName}{template.doctorSpecialization && ` · ${template.doctorSpecialization}`}</p>
                )}
                {showRxSymbol && <span className="absolute top-0 right-4 text-6xl font-bold italic opacity-20">℞</span>}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
            </div>
            <div className="px-4 pt-4">
              <BodyContent />
            </div>
            <Footer />
          </div>
        </div>
      </PreviewWrapper>
  );
}
