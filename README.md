# CourierFlow — Delivery Management Platform for Tanzania

A full-stack SaaS delivery management platform built for the Tanzanian market. CourierFlow enables businesses to manage courier operations end-to-end — from order creation and driver assignment to real-time tracking, proof-of-delivery uploads, and payment processing via AzamPay and mobile money.

🌐 **Live Demo:** [courierflow-drab.vercel.app](https://courierflow-drab.vercel.app)

---

## ✨ Features

- **Order Management** — Create, assign, and track delivery orders in real-time
- **Driver Dashboard** — Mobile-optimized interface for drivers to manage pickups and deliveries
- **Proof of Delivery** — Photo upload system using Cloudflare R2 for delivery confirmation
- **Payment Integration** — AzamPay MNO (M-Pesa, Airtel, Tigo) payment collection with webhook handling
- **Audit Logs** — Full activity trail for every order and driver action
- **Health Checks** — System monitoring and service status endpoints
- **Installable PWA** — Works offline and can be installed on Android/iOS like a native app
- **Role-Based Access** — Separate views for admins, dispatchers, and drivers
- **Real-Time Updates** — Live order status updates without page refresh

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Payments | AzamPay (MNO collections) |
| File Storage | Cloudflare R2 |
| Deployment | Vercel |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Zabepro/courierflow.git
cd courierflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, AZAMPAY_CLIENT_ID, AZAMPAY_CLIENT_SECRET, AZAMPAY_WEBHOOK_TOKEN, R2 credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
courierflow/
├── app/              # Next.js App Router pages and API routes
├── components/       # Reusable UI components
├── lib/              # Utilities, database client, helpers
├── prisma/           # Database schema and migrations
├── public/           # Static assets and PWA manifest
└── types/            # TypeScript type definitions
```

---

## 💳 Payment Webhooks

CourierFlow integrates with **AzamPay** for Tanzanian mobile money payments (M-Pesa, Airtel Money, Tigo Pesa). The webhook system is secured via:

- **URL token** — requests without a valid token are rejected
- **Amount validation** — payments are only confirmed for the exact expected amount
- **Idempotency** — duplicate callbacks are safely ignored

---

## 👤 Author

**Issa Ahmadi Mchowera**
Full Stack Developer — Dar es Salaam, Tanzania
GitHub: [@Zabepro](https://github.com/Zabepro)
