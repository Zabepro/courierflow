import { z } from "zod";
import { tzPhone } from "./phone";

export const createDriverSchema = z.object({
  name:  z.string().trim().min(2, "Driver name is required").max(80),
  phone: tzPhone,
  email: z.string().trim().toLowerCase().email("A valid email is required"),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
