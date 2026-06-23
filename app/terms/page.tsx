import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of CourierFlow.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="22 June 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of CourierFlow.
        By creating an account or using the service, you agree to these Terms. If you are using
        CourierFlow on behalf of an organisation, you confirm you are authorised to bind that
        organisation.
      </p>

      <h2>1. The service</h2>
      <p>
        CourierFlow provides software to create and manage deliveries, dispatch drivers, track
        parcels, collect mobile-money payments and capture proof of delivery. We may update, improve
        or change features over time.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You are responsible for the accuracy of the information in your account.</li>
        <li>You are responsible for keeping your login credentials secure and for all activity under your account.</li>
        <li>You must ensure your drivers and staff use the service in line with these Terms.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for any unlawful, fraudulent or harmful purpose.</li>
        <li>Falsify location data, payment records or proof of delivery.</li>
        <li>Attempt to disrupt, reverse-engineer, or gain unauthorised access to the platform.</li>
        <li>Upload content that infringes the rights of others.</li>
      </ul>

      <h2>4. Payments</h2>
      <p>
        Mobile-money payments are processed by our payment partner (AzamPay). You are responsible for
        the accuracy of fees and amounts you set. Subscription fees for paid plans are billed in
        advance and are non-refundable except where required by law.
      </p>

      <h2>5. Customer &amp; recipient data</h2>
      <p>
        You are responsible for ensuring you have the right to upload the personal data of senders,
        recipients and drivers, and for using it lawfully. Our handling of data is described in our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>6. Service availability</h2>
      <p>
        We aim for high availability but do not guarantee the service will be uninterrupted or
        error-free. We may suspend access for maintenance or to protect the platform.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, CourierFlow is provided &ldquo;as is&rdquo;. We are
        not liable for indirect or consequential losses, lost profits, or for delivery outcomes,
        payment disputes or data entered by users.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the service at any time. We may suspend or terminate accounts that breach
        these Terms. On termination, your right to use the service ends, subject to data-retention
        obligations.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use after changes take effect
        constitutes acceptance of the updated Terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms? Reach us on WhatsApp at <a href="https://wa.me/255624964064">+255 624 964 064</a>.
      </p>
    </LegalShell>
  );
}
