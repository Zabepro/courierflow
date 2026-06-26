"use client";

import { useEffect, useRef, useState } from "react";
import { IconMapPin } from "@tabler/icons-react";

type Suggestion = { display_name: string; lat?: string; lon?: string; address?: Record<string, string> };

/**
 * Type-to-search address input. As the user types, it queries OpenStreetMap
 * (Nominatim, biased to Tanzania) and shows pickable suggestions — useful for
 * a recipient's address the dispatcher doesn't know exactly. Free text always
 * works as a fallback; picking a suggestion also fills the detected city.
 */
export function AddressAutocomplete({
  value, onChange, onSelect, placeholder, className,
}: {
  value:       string;
  onChange:    (v: string) => void;
  onSelect:    (address: string, city: string | null, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?:  string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const skipRef = useRef(false); // don't re-search the value we just picked

  useEffect(() => {
    const q = value.trim();
    if (skipRef.current) { skipRef.current = false; return; }
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
          `&format=json&addressdetails=1&limit=5&countrycodes=tz`,
          { headers: { "Accept-Language": "en" }, signal: ctrl.signal },
        );
        const data = (await res.json()) as Suggestion[];
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        /* aborted or network error — silently ignore */
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value]);

  function pick(s: Suggestion) {
    skipRef.current = true;
    const a    = s.address ?? {};
    const city = a.city ?? a.town ?? a.village ?? a.county ?? null;
    const lat  = s.lat ? parseFloat(s.lat) : undefined;
    const lng  = s.lon ? parseFloat(s.lon) : undefined;
    onSelect(
      s.display_name,
      city,
      Number.isFinite(lat) ? lat : undefined,
      Number.isFinite(lng) ? lng : undefined,
    );
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-cf-primary/30 border-t-cf-primary" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {suggestions.map((s, i) => (
            <li key={`${s.display_name}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-cf-primary" stroke={1.8} />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
