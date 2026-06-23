import { z } from "zod";

/**
 * Tanzania mobile number, normalised to E.164 (+255XXXXXXXXX).
 * Accepts `0712345678`, `255712345678`, or `+255712345678`.
 * Shared by delivery, driver, and organization schemas.
 */
export const tzPhone = z
  .string()
  .transform((v) => {
    const digits = v.replace(/\s+/g, "").trim();
    if (digits.startsWith("0") && digits.length === 10) return "+255" + digits.slice(1);
    if (digits.startsWith("255") && !digits.startsWith("+")) return "+" + digits;
    return digits;
  })
  .pipe(z.string().regex(/^\+255[67]\d{8}$/, "Phone must be a valid Tanzania number: +255712345678"));
