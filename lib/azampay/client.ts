import type { PaymentMethod } from "@/lib/generated/prisma/client";

const AUTH_URL = process.env.AZAMPAY_AUTH_URL ?? "https://authenticator-sandbox.azampay.co.tz";
const CHECKOUT_URL = process.env.AZAMPAY_CHECKOUT_URL ?? "https://sandbox.azampay.co.tz";
const CLIENT_ID = process.env.AZAMPAY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZAMPAY_CLIENT_SECRET ?? "";

const PROVIDER_MAP: Partial<Record<PaymentMethod, string>> = {
  TIGOPESA: "Tigo",
  AIRTEL_MONEY: "Airtel",
  MPESA: "Mpesa",
};

let tokenCache: { value: string; expiresAt: Date } | null = null;

function maskPhone(phone: string): string {
  return phone.length <= 4 ? "****" : `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > new Date()) return tokenCache.value;

  const res = await fetch(`${AUTH_URL}/AppRegistration/GenerateToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appName: "CourierFlow", clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });

  if (!res.ok) throw new Error(`AzamPay auth failed (HTTP ${res.status})`);

  const data = await res.json() as {
    data: { accessToken: string; expire: string };
    success: boolean;
    message: string;
  };
  if (!data.success || !data.data?.accessToken) throw new Error("AzamPay auth did not return a token");

  tokenCache = { value: data.data.accessToken, expiresAt: new Date(data.data.expire) };
  console.info("[AzamPay] Access token refreshed");
  return tokenCache.value;
}

export type CheckoutResult =
  | { success: true; transactionId: string; message: string }
  | { success: false; message: string };

export async function mnoCheckout({
  phone,
  amount,
  method,
  externalId,
}: {
  phone: string;
  amount: number;
  method: PaymentMethod;
  externalId: string;
}): Promise<CheckoutResult> {
  const provider = PROVIDER_MAP[method];
  if (!provider) return { success: false, message: `Payment method ${method} is not supported` };

  const token = await getToken();
  const normalizedPhone = phone.replace(/^\+/, "").replace(/^0/, "255");
  const body = {
    accountNumber: normalizedPhone,
    amount: String(Math.round(amount)),
    currency: "TZS",
    externalId,
    provider,
    additionalProperties: {},
  };

  console.info(`[AzamPay] Checkout provider=${provider} phone=${maskPhone(normalizedPhone)} amount=${amount}`);

  const res = await fetch(`${CHECKOUT_URL}/azampay/mno/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.info(`[AzamPay] Checkout response status=${res.status} bodyPresent=${Boolean(text.trim())}`);

  if (!text.trim()) {
    return res.ok
      ? { success: true, transactionId: externalId, message: "Payment initiated" }
      : { success: false, message: `AzamPay checkout failed (HTTP ${res.status})` };
  }

  let data: { transactionId?: string | null; message?: string; success?: boolean | string } = {};
  try { data = JSON.parse(text); } catch { /* provider returned a non-JSON error */ }

  const success = data.success === true || data.success === "true" || (res.ok && Boolean(data.transactionId));
  if (success) {
    return { success: true, transactionId: data.transactionId ?? externalId, message: data.message ?? "OK" };
  }
  return { success: false, message: data.message ?? `AzamPay checkout failed (HTTP ${res.status})` };
}
