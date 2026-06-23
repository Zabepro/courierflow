import { describe, expect, it } from "vitest";
import { createDeliverySchema, deliveryFiltersSchema } from "./delivery";

const validDelivery = {
  senderName: "Asha Mushi",
  senderPhone: "0712345678",
  recipientName: "Juma Said",
  recipientPhone: "+255712345679",
  pickupAddress: "Kariakoo, Dar es Salaam",
  deliveryAddress: "Mbezi Beach, Dar es Salaam",
};

describe("createDeliverySchema", () => {
  it("normalizes Tanzania local phone numbers to E.164", () => {
    const result = createDeliverySchema.parse(validDelivery);
    expect(result.senderPhone).toBe("+255712345678");
  });

  it("rejects an invalid Tanzania phone number", () => {
    const result = createDeliverySchema.safeParse({ ...validDelivery, recipientPhone: "+255812345678" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scheduled dates", () => {
    const result = createDeliverySchema.safeParse({ ...validDelivery, scheduledAt: "not-a-date" });
    expect(result.success).toBe(false);
  });
});

describe("deliveryFiltersSchema", () => {
  it("limits page size and rejects invalid date filters", () => {
    expect(deliveryFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(deliveryFiltersSchema.safeParse({ from: "not-a-date" }).success).toBe(false);
  });
});
