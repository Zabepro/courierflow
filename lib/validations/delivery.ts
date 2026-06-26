import { z } from "zod";

const dateString = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Must be a valid date"
);

// Tanzania mobile: +255[67]XXXXXXXX or 0[67]XXXXXXXX (normalised to E.164)
const tzPhone = z
  .string()
  .transform((v) => {
    const digits = v.replace(/\s+/g, "").trim();
    if (digits.startsWith("0") && digits.length === 10) return "+255" + digits.slice(1);
    if (digits.startsWith("255") && !digits.startsWith("+")) return "+" + digits;
    return digits;
  })
  .pipe(z.string().regex(/^\+255[67]\d{8}$/, "Phone must be a valid Tanzania number: +255712345678"));

export const createDeliverySchema = z.object({
  senderName:      z.string().min(2, "Sender name is required"),
  senderPhone:     tzPhone,
  recipientName:   z.string().min(2, "Recipient name is required"),
  recipientPhone:  tzPhone,
  pickupAddress:   z.string().min(5, "Pickup address is required"),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  city:            z.string().optional(),
  notes:           z.string().optional(),
  priority:        z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  fee:             z.coerce.number().positive("Fee must be a positive number").optional(),
  scheduledAt:     dateString.optional(),
  // Coordinates captured from the address picker (best-effort, optional).
  pickupLat:       z.coerce.number().min(-90).max(90).optional(),
  pickupLng:       z.coerce.number().min(-180).max(180).optional(),
  deliveryLat:     z.coerce.number().min(-90).max(90).optional(),
  deliveryLng:     z.coerce.number().min(-180).max(180).optional(),
});

export const deliveryFiltersSchema = z.object({
  status:       z.enum(["PENDING","ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED","FAILED","CANCELLED"]).optional(),
  driverId:     z.string().optional(),
  trackingCode: z.string().optional(),
  from:         dateString.optional(),
  to:           dateString.optional(),
  page:         z.coerce.number().int().positive().default(1),
  limit:        z.coerce.number().int().positive().max(100).default(20),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type DeliveryFilters    = z.infer<typeof deliveryFiltersSchema>;
