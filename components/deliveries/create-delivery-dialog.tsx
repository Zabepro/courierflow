"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IconPackage, IconMapPin, IconUser, IconPhone,
  IconNotes, IconArrowRight, IconX, IconCurrentLocation,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "./address-autocomplete";
import { useLanguage } from "@/lib/i18n/context";
import type { ApiDelivery } from "./types";

/* ── Types ───────────────────────────────────────────────────────────────── */

type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type FormData = {
  senderName: string;    senderPhone: string;
  recipientName: string; recipientPhone: string;
  pickupAddress: string; deliveryAddress: string;
  city: string;          priority: Priority;
  fee: string;           notes: string;
};

type FieldErrors = Partial<Record<keyof FormData, string[]>>;

const DEFAULT: FormData = {
  senderName: "",     senderPhone: "+255",
  recipientName: "",  recipientPhone: "+255",
  pickupAddress: "",  deliveryAddress: "",
  city: "Dar es Salaam", priority: "NORMAL",
  fee: "",            notes: "",
};


/* ── Shared input class ──────────────────────────────────────────────────── */

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cf-primary/30 " +
  "focus:border-cf-primary transition-colors";

const inputNormal = "border-slate-200 hover:border-slate-300";
const inputErr    = "border-red-300 focus:ring-red-200 focus:border-red-400";

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (d: ApiDelivery) => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function CreateDeliveryDialog({ open, onOpenChange, onCreated }: Props) {
  const { t } = useLanguage();
  const d = t.deliveries.createDialog;

  const [form, setForm]         = useState<FormData>(DEFAULT);
  const [errors, setErrors]     = useState<FieldErrors | null>(null);
  const [submitting, setSubmit] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg]     = useState<string | null>(null);

  const PRIORITIES: { value: Priority; label: string; dot: string; active: string }[] = [
    { value: "LOW",    label: d.priority.low,    dot: "bg-slate-400",  active: "border-slate-400  bg-slate-50  text-slate-700" },
    { value: "NORMAL", label: d.priority.normal, dot: "bg-blue-400",   active: "border-blue-400   bg-blue-50   text-blue-700"  },
    { value: "HIGH",   label: d.priority.high,   dot: "bg-orange-500", active: "border-orange-400 bg-orange-50 text-orange-700"},
    { value: "URGENT", label: d.priority.urgent, dot: "bg-red-500",    active: "border-red-400    bg-red-50    text-red-700"   },
  ];

  function set(k: keyof FormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors?.[k]) setErrors((e) => e ? { ...e, [k]: undefined } : null);
  }

  /* Fill the pickup address from the device's GPS, reverse-geocoded to a
     readable address via OpenStreetMap (free, no key). Falls back to manual
     entry if the user denies permission or it's unavailable. */
  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMsg("Location isn't supported here — please type the address.");
      return;
    }
    setLocating(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = (data?.display_name as string | undefined)?.trim();
          if (addr) {
            setForm((f) => {
              const a    = data.address ?? {};
              const city = a.city ?? a.town ?? a.village ?? a.county ?? f.city;
              return { ...f, pickupAddress: addr, city: city || f.city };
            });
            setErrors((e) => e ? { ...e, pickupAddress: undefined } : null);
          } else {
            set("pickupAddress", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          set("pickupAddress", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied — please type the address."
            : "Couldn't get your location — please type the address.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  function hasErr(k: keyof FormData) { return !!errors?.[k]?.[0]; }

  function errMsg(k: keyof FormData) {
    return errors?.[k]?.[0]
      ? <p className="mt-1 text-[11px] font-medium text-red-500">{errors[k]![0]}</p>
      : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors(null);
    setSubmit(true);
    try {
      const res = await fetch("/api/deliveries", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          fee:   form.fee   ? Number(form.fee) : undefined,
          city:  form.city  || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.details) { setErrors(data.details); return; }
        toast.error(data.error ?? "Failed to create delivery");
        return;
      }
      onCreated(data as ApiDelivery);
      setForm(DEFAULT);
      setErrors(null);
      setGeoMsg(null);
      toast.success("Delivery created successfully");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSubmit(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-5 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cf-primary shadow-sm">
              <IconPackage className="h-5 w-5 text-white" stroke={2} />
            </div>
            <div>
              <DialogTitle className="font-heading text-xl font-bold text-slate-800 leading-tight">
                {d.title}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 mt-0.5">
                {d.subtitle.split("*").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-red-500 font-medium">*</span>}
                  </span>
                ))}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Sender ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{d.sender}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      placeholder={d.fullName}
                      value={form.senderName}
                      onChange={(e) => set("senderName", e.target.value)}
                      className={cn(inputBase, "pl-8", hasErr("senderName") ? inputErr : inputNormal)}
                    />
                  </div>
                  {errMsg("senderName")}
                </div>
                <div>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      placeholder="+255 7XX XXX XXX *"
                      value={form.senderPhone}
                      onChange={(e) => set("senderPhone", e.target.value)}
                      className={cn(inputBase, "pl-8", hasErr("senderPhone") ? inputErr : inputNormal)}
                    />
                  </div>
                  {errMsg("senderPhone")}
                </div>
              </div>
            </div>

            {/* ── Recipient ───────────────────────────────────────── */}
            <div className="rounded-xl border border-cf-primary/25 bg-cf-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-cf-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-cf-primary">{d.recipient}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cf-primary/50 pointer-events-none" />
                    <input
                      placeholder={d.fullName}
                      value={form.recipientName}
                      onChange={(e) => set("recipientName", e.target.value)}
                      className={cn(
                        inputBase, "pl-8 border-cf-primary/20 hover:border-cf-primary/40 focus:border-cf-primary",
                        hasErr("recipientName") ? inputErr : ""
                      )}
                    />
                  </div>
                  {errMsg("recipientName")}
                </div>
                <div>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cf-primary/50 pointer-events-none" />
                    <input
                      placeholder="+255 7XX XXX XXX *"
                      value={form.recipientPhone}
                      onChange={(e) => set("recipientPhone", e.target.value)}
                      className={cn(
                        inputBase, "pl-8 border-cf-primary/20 hover:border-cf-primary/40 focus:border-cf-primary",
                        hasErr("recipientPhone") ? inputErr : ""
                      )}
                    />
                  </div>
                  {errMsg("recipientPhone")}
                </div>
              </div>
            </div>

            {/* ── Route ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.route}</p>
              <div className="relative">
                {/* Connector line between dot and pin */}
                <div className="absolute left-[13px] top-[38px] h-[calc(100%-58px)] w-px bg-slate-300 z-0" />
                <div className="space-y-2.5">
                  {/* Pickup */}
                  <div className="flex items-start gap-3">
                    <div className="relative z-10 mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-cf-primary bg-white">
                      <div className="h-2.5 w-2.5 rounded-full bg-cf-primary" />
                    </div>
                    <div className="flex-1">
                      <input
                        placeholder={d.pickupAddress}
                        value={form.pickupAddress}
                        onChange={(e) => set("pickupAddress", e.target.value)}
                        className={cn(inputBase, hasErr("pickupAddress") ? inputErr : inputNormal)}
                      />
                      {errMsg("pickupAddress")}
                      <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locating}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-cf-primary transition-opacity hover:opacity-75 disabled:opacity-50"
                      >
                        {locating ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-cf-primary/30 border-t-cf-primary" />
                            Locating…
                          </>
                        ) : (
                          <>
                            <IconCurrentLocation className="h-3.5 w-3.5" stroke={2} />
                            {d.useCurrentLocation}
                          </>
                        )}
                      </button>
                      {geoMsg && <p className="mt-1 text-[11px] font-medium text-amber-600">{geoMsg}</p>}
                    </div>
                  </div>
                  {/* Delivery */}
                  <div className="flex items-start gap-3">
                    <div className="relative z-10 mt-2 flex h-7 w-7 shrink-0 items-center justify-center text-cf-primary">
                      <IconMapPin className="h-6 w-6" stroke={2} />
                    </div>
                    <div className="flex-1">
                      <AddressAutocomplete
                        value={form.deliveryAddress}
                        onChange={(v) => set("deliveryAddress", v)}
                        onSelect={(addr, city) => {
                          setForm((f) => ({ ...f, deliveryAddress: addr, city: city || f.city }));
                          setErrors((e) => e ? { ...e, deliveryAddress: undefined } : null);
                        }}
                        placeholder={d.deliveryAddress}
                        className={cn(inputBase, hasErr("deliveryAddress") ? inputErr : inputNormal)}
                      />
                      {errMsg("deliveryAddress")}
                      <p className="mt-1 text-[11px] text-slate-400">{d.addressPlaceholder}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── City ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.city}</p>
              <input
                placeholder="Dar es Salaam"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={cn(inputBase, inputNormal)}
              />
            </div>

            {/* ── Priority ───────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.priority.label}</p>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("priority", p.value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-all",
                      form.priority === p.value
                        ? p.active + " shadow-sm"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full shrink-0", p.dot)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Fee ────────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {d.fee}{" "}
                <span className="normal-case tracking-normal font-normal">{d.optional}</span>
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                  TSh
                </span>
                <input
                  type="number"
                  placeholder="5,000"
                  min={0}
                  value={form.fee}
                  onChange={(e) => set("fee", e.target.value)}
                  className={cn(inputBase, "pl-10", hasErr("fee") ? inputErr : inputNormal)}
                />
              </div>
              {errMsg("fee")}
            </div>

            {/* ── Notes ──────────────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <IconNotes className="h-3.5 w-3.5 text-slate-400" stroke={1.8} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {d.notes} <span className="normal-case tracking-normal font-normal">{d.optional}</span>
                </p>
              </div>
              <textarea
                placeholder={d.notesPlaceholder}
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={cn(inputBase, inputNormal, "resize-none leading-relaxed")}
              />
            </div>

          </div>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <IconX className="h-4 w-4" />
              {d.cancel}
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cf-primary hover:bg-cf-primary/90 text-white h-10 px-6 font-semibold shadow-sm"
            >
              {submitting ? d.creating : (
                <>
                  {d.createBtn}
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
