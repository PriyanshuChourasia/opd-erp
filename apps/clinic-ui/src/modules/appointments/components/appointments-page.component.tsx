import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from '@tanstack/react-router';
import type { PaginationState } from '@tanstack/react-table';
import { Banknote, CalendarClock, Download, Eye, FileDown, FileText, HeartPulse, Plus, Printer, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  fetchAppointments,
  updateAppointmentStatus,
  fetchDoctors,
  fetchUsers,
  fetchOrganisation,
  fetchBill,
  updatePatient,
  checkoutAppointment,
  addBillPayment,
  fetchPrescriptions,
  getPatientName,
  type Appointment,
  type AppointmentStatus,
} from '@/lib/api';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/axios-client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/data-table/data-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useAppSelector } from '@/store/hooks';
import { hasPermission } from '@/lib/roles';
import { InvoiceViewSheet } from '@/components/invoice-view-sheet';
import { PaymentSheet, type PaymentPayload } from '@/components/payment-sheet';
import { RxDocPreview, printRxDocument } from '@/components/prescription-document/RxDoc';
import { rxDocFromSavedPrescription } from '@/components/prescription-document/rx-doc-data';
import { generateRxPdf } from '@/components/prescription-document/rx-pdf';
import { useAppointmentsColumns, paymentStatus } from './appointments-columns';
import { AppointmentVitalsSheet } from './appointment-vitals-sheet';
import { AppointmentPrescriptionSheet } from './appointment-prescription-sheet';
import { AppointmentSlipPreviewDialog } from './appointment-slip-preview-dialog';
import { AppointmentsHeader } from './appointments-header';

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canReadOrganisation = hasPermission(permissions, 'read', 'company');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const [apptDateRange, setApptDateRange] = useState<{ from?: string; to?: string }>({});

  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsAppointment, setVitalsAppointment] = useState<Appointment | null>(null);

  const [rxSheetOpen, setRxSheetOpen] = useState(false);
  const [rxAppointment, setRxAppointment] = useState<Appointment | null>(null);

  const [printAppt, setPrintAppt] = useState<Appointment | null>(null);

  const [payAppointment, setPayAppointment] = useState<Appointment | null>(null);

  const [printRxAppt, setPrintRxAppt] = useState<Appointment | null>(null);
  const { data: printRxResponse } = useQuery({
    queryKey: ['appointment-rx-print', printRxAppt?.patientId, printRxAppt?.doctorId],
    queryFn: () => fetchPrescriptions({ patientId: printRxAppt!.patientId, doctorId: printRxAppt!.doctorId, page: 1, limit: 1 }),
    enabled: !!printRxAppt?.patientId && !!printRxAppt?.doctorId,
  });
  const printRx = useMemo(() => printRxResponse?.data?.[0] ?? null, [printRxResponse]);
  const [rxPdfGenerating, setRxPdfGenerating] = useState(false);
  const [rxDocReady, setRxDocReady] = useState(false);

  async function downloadPrintRxPdf() {
    if (!printRxDocData) return;
    setRxPdfGenerating(true);
    try {
      const { pageCount } = await generateRxPdf(printRxDocData);
      toast.success(pageCount > 1 ? `PDF downloaded (${pageCount} pages)` : 'PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation failed', err);
      toast.error('Failed to generate PDF');
    } finally {
      setRxPdfGenerating(false);
    }
  }

  function appointmentRow(appt: Appointment) {
    return {
      'Token': appt.tokenNumber ?? '',
      'Patient': `${appt.patient.firstName} ${appt.patient.lastName}`,
      'Phone': appt.patient.contactNo ?? '',
      'Doctor': appt.doctor.name ?? appt.doctor.medicalRegistrationNo ?? '',
      'Specialization': appt.doctor.specialization ?? '',
      'Date': appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      'Time': appt.date ? new Date(appt.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
      'Type': appt.type.replace('_', ' '),
      'Status': appt.status,
      'Payment Status': paymentStatus(appt).label,
      'Amount': appt.amount ?? 0,
      'Registration Amount': appt.registrationFee ?? 0,
    };
  }

  function exportToExcel() {
    const rows = (appointmentsResponse?.data ?? []).map(appointmentRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    XLSX.writeFile(wb, `appointments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function printReport() {
    const rows = appointmentsResponse?.data ?? [];
    if (rows.length === 0) return;
    const cols = ['Token', 'Patient', 'Phone', 'Doctor', 'Specialization', 'Date', 'Time', 'Type', 'Status', 'Payment Status', 'Amount', 'Registration Amount'];
    const htmlContent = `
      <html><head><style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        h2 { text-align: center; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 5px 6px; text-align: left; }
        th { background: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
      </style></head><body>
      <h2>Appointments Report — ${apptDateRange.from && apptDateRange.to ? (apptDateRange.from + ' to ' + apptDateRange.to) : 'All Dates'}</h2>
      <table>
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(appt => {
            const row = appointmentRow(appt);
            return `<tr>${cols.map(c => `<td>${(row as Record<string, unknown>)[c] ?? ''}</td>`).join('')}</tr>`;
          }).join('')}
        </tbody>
      </table>
      </body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }

  const { data: doctorsResponse } = useQuery({
    queryKey: ['doctors', 'appointments-filter'],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'appointments-filter'],
    queryFn: () => fetchUsers({ limit: 100 }),
  });
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse]);

  const { data: organisation } = useQuery({ queryKey: ['organisation'], queryFn: fetchOrganisation, enabled: canReadOrganisation });
  const printRxDocData = useMemo(
    () => (printRx ? rxDocFromSavedPrescription(printRx, organisation ?? undefined) : null),
    [printRx, organisation],
  );

  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const { data: viewInvoiceBill } = useQuery({
    queryKey: ['bill', viewInvoiceId],
    queryFn: () => fetchBill(viewInvoiceId!),
    enabled: !!viewInvoiceId,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['appointments', filterStatus, filterCreator, search, pagination.pageIndex, pagination.pageSize, apptDateRange.from, apptDateRange.to],
    queryFn: () => fetchAppointments({
      status: filterStatus || undefined,
      createdById: filterCreator || undefined,
      search: search || undefined,
      from: apptDateRange.from ?? undefined,
      to: apptDateRange.to ?? undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });
  const appointments = useMemo(() => appointmentsResponse?.data ?? [], [appointmentsResponse]);
  const pageCount = appointmentsResponse?.meta?.totalPages ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment status updated');
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, isFollowUp }: { id: string; isFollowUp: boolean }) => updatePatient(id, { isFollowUp }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointment-patients'] }); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const payMutation = useMutation({
    mutationFn: async ({ appt, payload }: { appt: Appointment; payload: PaymentPayload }) => {
      const subtotal = appt.bill ? appt.bill.total : appt.amount + appt.registrationFee;
      const alreadyPaid = appt.bill ? appt.bill.paidAmount : appt.amountPaid;
      const dueAmount = Math.max(0, subtotal - alreadyPaid);

      if (appt.bill) {
        if (dueAmount > 0) {
          await addBillPayment(appt.bill.id, {
            amount: Math.min(payload.paidAmount ?? dueAmount, dueAmount),
            method: payload.paymentMethod,
            ...(payload.referenceNumber ? { referenceNumber: payload.referenceNumber } : {}),
            notes: payload.notes || undefined,
          });
        }
      } else {
        const bill = await checkoutAppointment(appt.id, {
          paymentMethod: payload.paymentMethod,
          ...(payload.referenceNumber ? { referenceNumber: payload.referenceNumber } : {}),
          discountRuleId: payload.discountRuleId,
          tax: payload.tax > 0 ? payload.tax : undefined,
          notes: payload.notes || undefined,
        });
        if (payload.paidAmount && payload.paidAmount > 0) {
          await addBillPayment(bill.id, {
            amount: payload.paidAmount,
            method: payload.paymentMethod,
            ...(payload.referenceNumber ? { referenceNumber: payload.referenceNumber } : {}),
            notes: payload.notes || undefined,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      if (payAppointment?.bill) {
        queryClient.invalidateQueries({ queryKey: ['bill-payments', payAppointment.bill.id] });
      }
      toast.success('Payment recorded successfully');
      setPayAppointment(null);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.error(extractApiError(err));
    },
  });

  function openVitals(appt: Appointment) {
    setVitalsAppointment(appt);
    setVitalsOpen(true);
  }


  function setFilterStatusAndResetPage(status: string) {
    setFilterStatus(status);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterCreatorAndResetPage(creatorId: string) {
    setFilterCreator(creatorId);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const columns = useAppointmentsColumns({
    onOpenVitals: openVitals,
    onPrintAppt: setPrintAppt,
    onOpenInvoice: setViewInvoiceId,
    onCollectPayment: setPayAppointment,
    onPrintPrescription: setPrintRxAppt,
    onStatusChange: (appt, status) => statusMutation.mutate({ id: appt.id, status }),
  });

  return (
    <div className="space-y-6">
      <AppointmentsHeader isReceptionist={isReceptionist} permissions={permissions} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search patient, doctor, phone, or token #" className="w-72 pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <select
            className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatusAndResetPage(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
            value={filterCreator}
            onChange={(e) => setFilterCreatorAndResetPage(e.target.value)}
          >
            <option value="">All employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <DateRangePicker
            value={apptDateRange.from || apptDateRange.to ? { from: apptDateRange.from, to: apptDateRange.to } : undefined}
            onChange={(range) => {
              setApptDateRange({ from: range.from, to: range.to });
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!appointments.length}>
              <Download className="mr-1.5 size-3.5" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={printReport} disabled={!appointments.length}>
              <Printer className="mr-1.5 size-3.5" />
              Print
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Appointments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={appointments}
              pageCount={pageCount}
              pagination={pagination}
              onPaginationChange={setPagination}
              isLoading={isLoading}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CalendarClock className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No appointments for this day</p>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>

      <AppointmentPrescriptionSheet
        appointment={rxAppointment}
        open={rxSheetOpen}
        onOpenChange={(open) => { if (!open) { setRxSheetOpen(false); setRxAppointment(null); } }}
      />

      <AppointmentVitalsSheet
        appointment={vitalsAppointment}
        open={vitalsOpen}
        onOpenChange={(open) => { if (!open) { setVitalsOpen(false); setVitalsAppointment(null); } }}
      />

      <AppointmentSlipPreviewDialog
        appointment={printAppt}
        onOpenChange={(open) => { if (!open) setPrintAppt(null); }}
        organisation={organisation ?? undefined}
      />

      <PaymentSheet
        open={!!payAppointment}
        onOpenChange={(open) => { if (!open) setPayAppointment(null); }}
        subtotal={payAppointment ? (payAppointment.bill ? payAppointment.bill.total : payAppointment.amount + payAppointment.registrationFee) : 0}
        alreadyPaid={payAppointment ? (payAppointment.bill ? payAppointment.bill.paidAmount : payAppointment.amountPaid) : 0}
        isPending={payMutation.isPending}
        onSubmit={(payload) => { if (payAppointment) payMutation.mutate({ appt: payAppointment, payload }); }}
        submitLabel={payAppointment?.bill ? 'Record Payment' : 'Confirm & Pay'}
        appointmentId={payAppointment?.id}
        billId={payAppointment?.bill?.id}
        hasExistingBill={!!payAppointment?.bill}
      />

      <Dialog open={!!printRxAppt} onOpenChange={(open) => { if (!open) { setPrintRxAppt(null); setRxDocReady(false); } }}>
        <DialogContent className="flex h-[85vh] max-h-[95vh] flex-col overflow-hidden sm:max-w-[850px]" showCloseButton>
          <DialogHeader className="shrink-0">
            <DialogTitle>Prescription{printRxAppt?.patient ? ` — ${getPatientName(printRxAppt.patient)}` : ''}</DialogTitle>
          </DialogHeader>
          {printRxDocData ? (
            <RxDocPreview data={printRxDocData} onReady={setRxDocReady} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">No prescription recorded for this patient yet.</p>
              <Button variant="outline" onClick={() => { if (printRxAppt) navigate({ to: '/appointments/$appointmentId/prescription', params: { appointmentId: printRxAppt.id } }); }}>
                Create Prescription
              </Button>
            </div>
          )}
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setPrintRxAppt(null)}>Close</Button>
            {printRxDocData && (
              <>
                <Button variant="default" onClick={downloadPrintRxPdf} disabled={!rxDocReady || rxPdfGenerating} className="gap-1.5">
                  <FileDown className="size-3.5" />
                  {rxPdfGenerating ? 'Generating…' : 'Download PDF'}
                </Button>
                <Button variant="default" onClick={printRxDocument} disabled={!rxDocReady} className="gap-1.5">
                  <Printer className="size-3.5" />Print
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceViewSheet bill={viewInvoiceBill ?? null} onOpenChange={(open) => !open && setViewInvoiceId(null)} organisation={organisation ?? undefined} />
    </div>
  );
}
