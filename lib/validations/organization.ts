import { z } from "zod";

/**
 * Organization profile update. Phone is validated separately in the route so an
 * empty string can be normalised to `null` (clearing the field) while a present
 * value is checked against the Tanzania E.164 format.
 */
export const updateOrganizationSchema = z.object({
  name:    z.string().trim().min(2, "Organization name is required").max(120),
  phone:   z.string().trim().optional(),
  address: z.string().trim().max(200, "Address is too long").optional(),
  city:    z.string().trim().max(100, "City is too long").optional(),
  country: z.string().trim().min(2, "Country is required").max(100).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
