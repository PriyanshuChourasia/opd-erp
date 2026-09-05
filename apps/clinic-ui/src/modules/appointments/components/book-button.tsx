import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BookButtonProps {
  isReceptionist: boolean;
}

export function BookButton({ isReceptionist }: BookButtonProps) {
  if (isReceptionist) return null;

  return (
    <Button asChild>
      <Link to="/appointments/new">
        <Plus className="mr-2 size-4" />
        Book Appointment
      </Link>
    </Button>
  );
}
