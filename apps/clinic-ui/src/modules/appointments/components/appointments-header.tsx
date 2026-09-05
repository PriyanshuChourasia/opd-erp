import { Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { AppointmentsHeaderProps } from './appointments-page.types';

export function AppointmentsHeader({
  isReceptionist,
}: AppointmentsHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      {/* Left */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Appointments
        </h1>
      </div>
      <div className="flex items-center justify-center gap-2">
        {/* Your legend buttons */}
       
      </div>

      {/* Right */}
      <div className="flex justify-end">
        {!isReceptionist && (
          <Button asChild>
            <Link to="/appointments/new">
              <Plus className="mr-2 size-4" />
              Book Appointment
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}