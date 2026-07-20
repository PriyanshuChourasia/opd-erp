import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchQueueDisplay } from "@/lib/api";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function QueueDisplayPage() {
  const now = useClock();

  const { data: entries = [] } = useQuery({
    queryKey: ["queue-display"],
    queryFn: fetchQueueDisplay,
    refetchInterval: 5_000,
  });

  const byDoctor = useMemo(() => {
    const groups = new Map<string, { nowServing: string[]; waiting: string[] }>();
    for (const e of entries) {
      const group = groups.get(e.doctorName) ?? { nowServing: [], waiting: [] };
      if (e.status === "IN_PROGRESS") group.nowServing.push(e.tokenNumber);
      else if (e.status === "WAITING") group.waiting.push(e.tokenNumber);
      groups.set(e.doctorName, group);
    }
    return Array.from(groups.entries());
  }, [entries]);

  return (
    <div className="min-h-screen bg-black px-8 py-6 text-white">
      <div className="mb-8 flex items-center justify-between border-b border-white/20 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Live Queue Display</h1>
        <div className="text-right">
          <p className="text-3xl font-mono font-semibold">{now.toLocaleTimeString()}</p>
          <p className="text-sm text-white/60">{now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {byDoctor.length === 0 ? (
        <p className="py-24 text-center text-2xl text-white/50">No patients in queue today</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {byDoctor.map(([doctorName, group]) => (
            <div key={doctorName} className="rounded-lg border border-white/20 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white/80">{doctorName}</h2>

              <div className="mb-6">
                <p className="mb-2 text-xs font-medium tracking-wider text-white/50 uppercase">Now Serving</p>
                {group.nowServing.length === 0 ? (
                  <p className="text-lg text-white/40">—</p>
                ) : (
                  <div className="space-y-2">
                    {group.nowServing.map((t) => (
                      <p key={t} className="rounded-md bg-green-500/20 px-4 py-3 font-mono text-3xl font-bold text-green-400">{t}</p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wider text-white/50 uppercase">
                  Waiting ({group.waiting.length})
                </p>
                {group.waiting.length === 0 ? (
                  <p className="text-sm text-white/40">—</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.waiting.map((t) => (
                      <span key={t} className="rounded-md bg-white/10 px-3 py-1.5 font-mono text-sm text-white/80">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
