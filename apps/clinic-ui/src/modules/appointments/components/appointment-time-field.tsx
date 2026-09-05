import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkAppointmentSlot } from "@/lib/api";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AppointmentTimeStatus {
  /** A check is running for the time currently displayed. */
  checking: boolean;
  /** The result corresponds to the time currently displayed (not a stale commit). */
  fresh: boolean;
  /** True when another non-cancelled appointment occupies this doctor/date/minute. */
  alreadyBooked: boolean;
  /** Force the check now (wire to the input's onBlur). */
  commit: () => void;
}

/**
 * Live availability check for a manually-entered appointment time.
 *
 * The check runs automatically ~450 ms after the time (or doctor/date) stops
 * changing and immediately on `commit()` (blur). The result only counts as
 * current when `fresh` is true — while the displayed time differs from the
 * last checked one, no stale warning/error is shown. Booking is never wrongly
 * blocked; only a fresh `alreadyBooked: true` result disables submission.
 */
export function useAppointmentTimeCheck(opts: {
  doctorId: string;
  date: string;
  time: string;
  excludeAppointmentId?: string;
}): AppointmentTimeStatus {
  const { doctorId, date, time, excludeAppointmentId } = opts;
  const canCheck = !!doctorId && DATE_RE.test(date) && TIME_RE.test(time);
  const [committedTime, setCommittedTime] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!canCheck) {
      setCommittedTime(null);
      return;
    }
    timerRef.current = setTimeout(() => setCommittedTime(time), 450);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [canCheck, time, doctorId, date]);

  function commit() {
    if (!canCheck) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setCommittedTime(time);
  }

  const query = useQuery({
    queryKey: ["appointment-time-check", doctorId, date, committedTime, excludeAppointmentId ?? null],
    queryFn: () => checkAppointmentSlot({ doctorId, date, time: committedTime!, excludeAppointmentId }),
    enabled: canCheck && !!committedTime,
    staleTime: 30_000,
    retry: 0,
  });

  const fresh = canCheck && !!committedTime && committedTime === time;

  return {
    checking: query.isFetching && fresh,
    fresh,
    alreadyBooked: !!(query.isSuccess && fresh && query.data.alreadyBooked),
    commit,
  };
}

/**
 * Inline status text under the time input. Order matters: an already-booked
 * time is the strongest signal, then an in-flight check. Any time is allowed;
 * only duplicate bookings are flagged.
 */
export function AppointmentTimeHint({ status }: { status: AppointmentTimeStatus }) {
  if (status.alreadyBooked) {
    return (
      <p className="text-xs font-medium text-destructive">
        This time is already booked for this doctor — choose another time to continue.
      </p>
    );
  }
  if (status.checking) {
    return <p className="text-xs text-muted-foreground">Checking availability…</p>;
  }
  return null;
}
