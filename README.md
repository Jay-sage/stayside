# Stayside — Hotels, On Your Terms.

A Lagos, Nigeria **Day-Stay-First** hotel booking marketplace (10am – 4pm) with optional full-night stays, Paystack checkout, verified guest reviews, multi-branch hotel management, and free hotel one-pager subdomains (`yourhotel.stayside.ng`).

Built by **Xlay Technologies**.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Middleware) + TypeScript
- **Styling:** Tailwind CSS v4 + Midnight-Ink Dark Mode
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Payments:** Paystack (Test Mode & Production, HMAC-SHA512 webhook verification, Refunds API)
- **Hosting:** Vercel (with wildcard subdomain routing `*.stayside.ng`)

---

## Core Features

- **Guest Marketplace (`/`, `/hotels`, `/hotels/[slug]`):**
  - Day-stay-first browsing (`10am – 4pm`) starting from **₦5,000/day**, with full-night stays tucked cleanly below the fold during booking.
  - Chowdeck-inspired hotel storefront with sticky info rail, Tangerine Verified badge, live in-hotel room/perk search, 2-column room cards, branch switcher with independent per-branch pricing, Lagos street map, and Chowdeck-style **Ratings & Reviews** modal (verified bookers only, pending moderation by default).
  - Guest Wishlist, Order History (`/account/bookings`), Saved Cards (`/account/payment-methods`), Notifications (`/notifications`), Contact Us (`/contact`), and Midnight-Ink Dark Mode.
- **Paystack Checkout & 15-Minute Holds:**
  - Server-computed Naira pricing (never trusted from the browser), atomic 15-minute `pending_payment` holds, idempotent webhook confirmation, and automatic refunds when a hotel declines a paid booking.
  - Works seamlessly without Paystack keys during local UI development (gracefully falls back to direct booking requests).
- **Hotel Partner Portal (`/hotel`):**
  - Manage **unlimited hotel branches** from one account, each with its own rooms, custom Naira pricing, amenities, day-stay hours, blackout dates, Supabase Storage photo uploader, booking inbox, and free one-pager tagline/photo picker.
- **Super Admin Console (`/admin`):**
  - Approve/suspend hotels and new branches, assign Free/Paid plans & commission rates, create hotel partner accounts, moderate pending guest reviews (Approve/Reject), export all bookings to Excel-safe UTF-8 CSV, track monthly commissions/payouts & refunds, and publish/unpublish hotel subdomains.
- **Free Hotel One-Pagers (`/sites/[subdomain]`):**
  - Wildcard subdomain routing (`<slug>.stayside.ng` or `<slug>.localhost:3000`) serving clean mobile-first hotel pages with WhatsApp & Stayside booking CTAs.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure `.env.local`
Create `.env.local` in the project root:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-or-anon-key>

# Supabase Service Role (Required for Paystack webhooks & creating partner accounts from /admin)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Paystack (Optional locally — required for live Paystack test checkout & refunds)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# App Domain (used for Paystack callbacks & wildcard hotel subdomains)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

### 3. Apply Database Migrations
Run the SQL migrations in `supabase/migrations/` in chronological order (`0001_initial_schema.sql` through `0012_hotel_branches.sql`) against your Supabase Postgres database, then run `supabase/seed.sql` for sample Lagos hotels.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Seeded Test Accounts (Local / Staging)

| Role | Email | Password | Portal |
|---|---|---|---|
| **Super Admin** | `admin@stayside.ng` | `StaysideAdmin123!` | `/admin` |
| **Hotel Admin (Ikoyi & Ikeja GRA)** | `ikoyi@stayside.ng` | `StaysideHotel123!` | `/hotel` |
| **Hotel Admin (Victoria Island)** | `vi@stayside.ng` | `StaysideHotel123!` | `/hotel` |
| **Hotel Admin (Lekki)** | `lekki@stayside.ng` | `StaysideHotel123!` | `/hotel` |
| **Guest** | `guest@stayside.ng` | `StaysideGuest123!` | `/account` |

### Creating Your First Production Super Admin
1. Sign up normally via `/signup` (or create the user in **Supabase Dashboard → Authentication → Users**).
2. Promote the user in **Supabase SQL Editor**:
   ```sql
   update public.profiles
   set role = 'super_admin'
   where id = '<user-uuid-from-auth-users>';
   ```
3. Sign in at `/login` — you will be routed directly to `/admin`.

---

## Paystack Test Mode Setup

1. Create a free Paystack account and switch to **Test Mode**.
2. Copy your **Test Public Key** (`pk_test_...`) and **Test Secret Key** (`sk_test_...`) into `.env.local` (or Vercel Environment Variables).
3. In Paystack Dashboard → **Settings → API Keys & Webhooks**:
   - **Webhook URL:** `https://stayside.ng/api/paystack/webhook`
   - **Callback URL:** `https://stayside.ng/bookings/callback`
4. The webhook verifies `x-paystack-signature` using HMAC-SHA512 (`timingSafeEqual`) before confirming any payment.

---

## Deploying to Vercel (with Wildcard Subdomains)

1. Push this repo to GitHub and import it into **Vercel**.
2. Add all environment variables from `.env.local`, setting:
   - `NEXT_PUBLIC_SITE_URL=https://stayside.ng`
   - `NEXT_PUBLIC_ROOT_DOMAIN=stayside.ng`
3. In **Vercel Project → Settings → Domains**, add:
   - `stayside.ng`
   - `www.stayside.ng`
   - `*.stayside.ng` (wildcard domain for free hotel one-pagers like `the-palms-ikoyi.stayside.ng`)
4. Configure your DNS provider with Vercel's recommended `A`/`CNAME` records (or Vercel Nameservers for automatic wildcard SSL).

---

## Google & Apple OAuth Setup (Supabase Auth)

Stayside already includes **Continue with Google** and **Continue with Apple** on `/login` and `/signup`, plus the PKCE exchange route at `/auth/callback`. To activate them:

1. Open **Supabase Dashboard → Authentication → URL Configuration** and add:
   - **Site URL:** `https://stayside.ng` (or `http://localhost:3000` locally)
   - **Redirect URLs:** `http://localhost:3000/auth/callback` and `https://stayside.ng/auth/callback`
2. **Google OAuth:**
   - In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth 2.0 Web Client ID with Authorized Redirect URI:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Paste the **Client ID** and **Client Secret** into **Supabase → Authentication → Providers → Google** and toggle it **On**.
3. **Apple OAuth:**
   - In **Apple Developer → Certificates, Identifiers & Profiles**, create a Services ID with Return URL:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Paste the **Services ID**, **Team ID**, **Key ID**, and private key into **Supabase → Authentication → Providers → Apple** and toggle it **On**.

---

## Analytics (No Google Account Required!)

- **Zero-setup option (Recommended):** Enable **Vercel Web Analytics** & **Speed Insights** right inside your Vercel Project Dashboard (1 click, privacy-friendly, no Google account or cookie banner required).
- **Optional Google Analytics 4:** Only needed if you later want Google Ads or Search Console attribution.

---

## Pre-Production Security Checklist

- Enable **Leaked Password Protection** in Supabase Dashboard → Authentication → Password Security.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are set as server-only environment variables in Vercel (never prefixed with `NEXT_PUBLIC_`).
- Once `SUPABASE_SERVICE_ROLE_KEY` is configured in production, revoke `anon` and `authenticated` execute privileges on `public.confirm_paystack_payment` so only the verified webhook/server can confirm payments.
