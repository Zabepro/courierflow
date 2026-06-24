export type DriverRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
  activeDeliveries: number;
  completedDeliveries: number;
  totalDeliveries: number;
  pending: boolean;
  inviteLink?: string | null;
  createdAt: string;
};
