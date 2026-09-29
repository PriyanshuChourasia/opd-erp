import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCities, findOrCreateCity } from "@/lib/api";
import { Input } from "@/components/ui/input";

/**
 * City input wired to the auto-growing backend city catalog.
 *
 * - Suggestions come from GET /cities?state=<state> (cities previously typed
 *   against this state), offered via a native datalist so free typing always
 *   stays possible.
 * - When the user types a city that isn't in the catalog yet and leaves the
 *   field (blur) or saves (form submit), it is registered against the chosen
 *   state via find-or-create — so next time the state's city list includes it.
 * - Behaves exactly like a plain Input when no state is selected yet.
 */

interface CityInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Selected state name — scopes the suggestions and the find-or-create. */
  state?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  /** Register the (trimmed) value in the catalog; call from the form's save handler. */
  exposeCommit?: (commit: () => Promise<void>) => void;
}

export function CityInput({ id, value, onChange, state, placeholder, className, required, exposeCommit }: CityInputProps) {
  const queryClient = useQueryClient();
  const [touched, setTouched] = useState(false);

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", state],
    queryFn: () => fetchCities({ state }),
    enabled: !!state,
    staleTime: 60_000,
  });

  const registerMutation = useMutation({
    mutationFn: ({ name, st }: { name: string; st: string }) => findOrCreateCity(name, st),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    },
    // Silent: catalog registration is a side effect, never an error dialog.
  });

  const commit = async () => {
    const name = value.trim();
    if (!name || !state?.trim()) return;
    const known = cities.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!known) registerMutation.mutate({ name, st: state.trim() });
  };

  useEffect(() => {
    exposeCommit?.(commit);
    // Rebind whenever the inputs that shape `commit` change.
  }, [value, state, cities, exposeCommit]);

  const cityId = id ? `${id}-city-options` : undefined;

  return (
    <>
      <Input
        id={id}
        list={cityId}
        placeholder={placeholder ?? "City"}
        value={value}
        required={required}
        className={className}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (!touched) {
            setTouched(true);
            return;
          }
          void commit();
        }}
      />
      <datalist id={cityId}>
        {cities.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
    </>
  );
}
