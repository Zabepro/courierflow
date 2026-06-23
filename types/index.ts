import type {
  User,
  Organization,
  Delivery,
  ProofOfDelivery,
  LocationUpdate,
  SmsLog,
  Payment,
  Role,
  DeliveryStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
  SmsStatus,
} from "@/lib/generated/prisma/client";

export type {
  User,
  Organization,
  Delivery,
  ProofOfDelivery,
  LocationUpdate,
  SmsLog,
  Payment,
  Role,
  DeliveryStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
  SmsStatus,
};

// Delivery with relations
export type DeliveryWithRelations = Delivery & {
  driver?: User | null;
  organization: Organization;
  proofOfDelivery?: ProofOfDelivery | null;
  payment?: Payment | null;
};

// Auth session metadata
export type SessionClaims = {
  role: Role;
  organizationId: string;
};
