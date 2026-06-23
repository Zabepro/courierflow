"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconArrowRight } from "@tabler/icons-react";

export function TrackWidget({
  placeholder = "Enter tracking code…",
  buttonLabel = "Track",
}: {
  placeholder?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (c) router.push(`/track/${encodeURIComponent(c)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur-md"
    >
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" stroke={2} />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={placeholder}
          aria-label="Tracking code"
          className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm font-medium text-white placeholder:text-white/45 outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-cf-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {buttonLabel}
        <IconArrowRight className="h-4 w-4" stroke={2.2} />
      </button>
    </form>
  );
}
