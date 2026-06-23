import type { DeliveryStatus, PaymentMethod, PaymentStatus, Priority } from "@/lib/generated/prisma/client";

export type ApiDelivery = {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  city: string | null;
  status: DeliveryStatus;
  priority: Priority;
  fee: string | null;
  notes: string | null;
  driverId: string | null;
  driver:   { id: string; name: string | null; phone: string | null } | null;
  payment:  {
    status:        PaymentStatus;
    method:        PaymentMethod;
    amount:        string | null;
    phoneNumber:   string | null;
    paidAt:        string | null;
    mpesaCode:     string | null;
    failureReason: string | null;
  } | null;
  createdAt:   string;
  updatedAt:   string;
  pickedUpAt:  string | null;
  deliveredAt: string | null;
};

export type ApiDriver = {
  id: string;
  name: string | null;
  phone: string | null;
  activeDeliveries: number;
};

export type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type DeliveriesResponse = { data: ApiDelivery[]; meta: ApiMeta };

export type FilterState = {
  status: string;
  trackingCode: string;
  from: string;
  to: string;
};
