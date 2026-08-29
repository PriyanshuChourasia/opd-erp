import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewAppointmentPage } from "@/modules/appointments";
import { AppointmentsPage } from "@/modules/appointments";
import { QueuePage } from "@/modules/queue";
import { ReceptionistDashboardPage } from "@/modules/receptionist";
import { CalendarClock, LayoutDashboard, ListOrdered, Zap } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "quick-appointment", label: "Quick Appointment", icon: Zap },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "queues", label: "Queues", icon: ListOrdered },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReceptionistTabsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="flex h-full flex-col">
      {/* Tabs header */}
      <div className="flex items-center justify-between border-b">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto py-6">
        {activeTab === "overview" && <ReceptionistDashboardPage />}
        {activeTab === "quick-appointment" && <NewAppointmentPage hideTitle />}
        {activeTab === "appointments" && <AppointmentsPage />}
        {activeTab === "queues" && <QueuePage />}
      </div>
    </div>
  );
}
