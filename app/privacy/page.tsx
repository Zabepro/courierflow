import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CourierFlow collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="22 June 2026">
      <p>
        CourierFlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides delivery management software for
        couriers operating in Tanzania. This policy explains what personal data we collect, why we
        collect it, and the choices you have. By using CourierFlow you agree to the practices
        described here.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data</strong> — name, email, phone number and organisation details you provide when signing up.</li>
        <li><strong>Delivery data</strong> — sender and recipient names, phone numbers, pickup and delivery addresses, parcel details and tracking codes.</li>
        <li><strong>Location data</strong> — GPS coordinates from drivers&apos; devices while a delivery is active, used to power live tracking and proof of delivery.</li>
        <li><strong>Payment data</strong> — mobile-money phone numbers and transaction references processed through our payment partner (AzamPay). We do not store full payment credentials or PINs.</li>
        <li><strong>Proof of delivery</strong> — photos, signatures and timestamps captured at handover.</li>
        <li><strong>Usage data</strong> — device, browser and interaction data collected to keep the service secure and reliable.</li>
      </ul>

      <h2>2. How we use your data</h2>
      <ul>
        <li>To operate the service: dispatching, tracking, payments and proof of delivery.</li>
        <li>To send transactional messages (e.g. SMS tracking links and status updates).</li>
        <li>To secure the platform, prevent fraud and abuse, and troubleshoot issues.</li>
        <li>To improve features and performance.</li>
      </ul>

      <h2>3. Sharing your data</h2>
      <p>
        We share data only as needed to run the service: with payment providers (AzamPay) to process
        mobile-money transactions, with SMS providers (Africa&apos;s Talking) to deliver
        notifications, and with infrastructure providers that host the platform. We do not sell your
        personal data.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We retain delivery, payment and proof-of-delivery records for as long as your organisation
        keeps an active account, and as required to meet legal, tax and dispute-resolution
        obligations. You may request deletion subject to those obligations.
      </p>

      <h2>5. Security</h2>
      <p>
        We protect data in transit with encryption (TLS), restrict access to authorised staff, and
        apply rate limiting and validation to our payment and location endpoints. No system is
        perfectly secure, but we work to safeguard your information.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data. Drivers can stop
        sharing location at any time by ending an active trip in the driver portal.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy questions, contact us on WhatsApp at <a href="https://wa.me/255624964064">+255 624 964 064</a>.
      </p>
    </LegalShell>
  );
}
