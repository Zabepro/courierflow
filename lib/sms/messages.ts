const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const trackingUrl = (code: string) => `${APP_URL}/track/${code}`;

export const smsMessages = {
  deliveryCreated(p: { trackingCode: string; recipientName: string }) {
    return (
      `CourierFlow: Delivery ${p.trackingCode} imeundwa kwa ${p.recipientName}. ` +
      `Fuatilia hapa: ${trackingUrl(p.trackingCode)}`
    );
  },

  driverAssigned(p: { trackingCode: string; pickupAddress: string; recipientName: string; deliveryAddress: string }) {
    return (
      `CourierFlow: Umepewa delivery ${p.trackingCode}. ` +
      `Chukua kutoka: ${p.pickupAddress}. ` +
      `Peleka kwa: ${p.recipientName} — ${p.deliveryAddress}.`
    );
  },

  pickedUp(p: { recipientName: string; trackingCode: string }) {
    return (
      `Habari ${p.recipientName}, mzigo wako ${p.trackingCode} umechukuliwa na dereva. ` +
      `Fuatilia hapa: ${trackingUrl(p.trackingCode)}`
    );
  },

  inTransit(p: { recipientName: string; trackingCode: string }) {
    return (
      `Habari ${p.recipientName}, mzigo wako ${p.trackingCode} uko njiani kwako sasa hivi. ` +
      `Fuatilia hapa: ${trackingUrl(p.trackingCode)}`
    );
  },

  delivered(p: { trackingCode: string; recipientName: string }) {
    return (
      `CourierFlow: Mzigo ${p.trackingCode} umemfikia ${p.recipientName} salama. ` +
      `Asante kwa kutumia CourierFlow!`
    );
  },
};
