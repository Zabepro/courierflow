This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Payment webhooks

**AzamPay does not sign its callbacks** — there is no shared webhook secret, no
HMAC and no `x-azampay-signature` header (their dashboard exposes only a Client
ID and Client Secret, which are used for the API auth token, not callbacks). So
`/api/webhooks/azampay` cannot be secured by signature verification. Instead it
is protected by three independent layers:

1. **URL secret token** — set `AZAMPAY_WEBHOOK_TOKEN` to a long random value and
   register the callback URL with that token attached, e.g.
   `https://your-app/api/webhooks/azampay?token=<AZAMPAY_WEBHOOK_TOKEN>`.
   Requests without the exact token are rejected (401). This token is **required
   in production**; local development may omit it for sandbox testing.
2. **Amount check** — a payment is only marked `PAID` for the exact amount that
   was originally initiated. A callback claiming a different amount is refused.
3. **Idempotency** — a payment already marked `PAID` is never re-processed.

> Note: the URL token is defence-in-depth, not cryptographic proof of origin
> (it is static and travels inside the URL over TLS). The strongest available
> hardening — re-querying transaction status server-to-server with the
> Client ID/Secret before marking `PAID` — is pending confirmation that
> AzamPay's status endpoint covers MNO collections (it is currently documented
> for disbursements only).

## Proof-of-delivery uploads

Configure CORS once in the Cloudflare R2 bucket settings; it is intentionally
not configured during a customer upload request. Allow the deployed app origin,
`PUT`, `GET`, and `HEAD` methods, and the `Content-Type` header.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
