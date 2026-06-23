# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CourierFlow** — delivery management SaaS built for Tanzania. Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui, backed by PostgreSQL (Prisma) and Redis.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint

# Prisma
npx prisma migrate dev --name <name>   # create + apply migration
npx prisma generate                    # regenerate client after schema changes
npx prisma studio                      # GUI database browser
npx prisma db push                     # push schema without migration (prototyping)

# shadcn/ui components
npx shadcn@latest add <component>      # e.g. button, card, dialog
```

## Architecture

### Routing (`app/`)
- `(auth)/sign-in` + `(auth)/sign-up` — Clerk-hosted sign-in/up pages
- `(dashboard)/*` — protected routes; all require active Clerk session
- `api/webhooks/` — public webhook endpoints (Clerk, Africa's Talking)
- Root `page.tsx` redirects: authenticated → `/dashboard`, unauthenticated → `/sign-in`

### Auth (`middleware.ts`)
Clerk middleware runs on every request. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`. Everything else is protected via `auth().protect()`.

Roles (`types/index.ts`): `ADMIN | DRIVER | VIEWER`. Role is stored in the Prisma `User` model and can be synced to Clerk's `publicMetadata`.

### Database (`prisma/schema.prisma`)
Seven models: `Organization → User → Delivery → ProofOfDelivery | LocationUpdate | SmsLog | Payment`.

- Tracking codes are app-generated (`generateTrackingCode()` in `lib/utils.ts`)
- Monetary values use `Decimal @db.Decimal(10,2)`; currency defaults to `TZS`
- SMS provider defaults to `africas_talking`; payment methods include M-Pesa, Tigo Pesa, Airtel Money

**Prisma 7 setup**: Uses the new adapter pattern. Client generated to `lib/generated/prisma/client.ts` (run `prisma generate` to refresh after schema changes). Connection via `@prisma/adapter-pg` + `pg` pool using `DATABASE_URL`.

Prisma client singleton: `lib/db/prisma.ts`. Import as `import { prisma } from "@/lib/db/prisma"`.

Model types and enums: import from `@/lib/generated/prisma/client` or via `@/types`.

### Redis (`lib/redis/client.ts`)
Singleton `ioredis` client with `lazyConnect: true`. Used for cache and job queues (Phase 3+). Import as `import { redis } from "@/lib/redis/client"`.

### Styling
- **Fonts**: `Space_Grotesk` → `font-heading`, `Inter` → `font-body` (Tailwind classes)
- **Brand tokens**: `--cf-primary`, `--cf-accent`, `--cf-warning`, `--cf-success`, `--cf-background`, `--cf-foreground`, `--cf-destructive` defined as CSS hex variables in `globals.css`. Tailwind classes: `bg-cf-primary`, `text-cf-accent`, etc.
- **shadcn tokens**: standard HSL variables (`--primary`, `--accent`, etc.) are mapped to the CF palette so shadcn components inherit brand colors automatically
- `cn()` utility: `lib/utils.ts`

### Key env vars (`.env`)
```
DATABASE_URL          # PostgreSQL connection string
REDIS_URL             # Redis connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
AT_API_KEY            # Africa's Talking SMS
AT_USERNAME
AT_SENDER_ID
```

## Conventions

- Server Components by default; add `"use client"` only when needed (event handlers, hooks)
- API routes live under `app/api/` and use Next.js Route Handlers
- Validate all external input with `zod` before touching the database
- Always import Prisma types via `@/types` (re-exported from `@prisma/client`)
