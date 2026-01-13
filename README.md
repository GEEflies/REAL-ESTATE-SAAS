# Aurix 🚀

AI-powered real estate photo editor with enhance and object removal features.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- 🌟 **Photo Enhancement** - HDR merge, window replacement, lighting correction
- 🧹 **Object Removal** - Seamless AI inpainting for unwanted objects
- 🔐 **Authentication** - Clerk passwordless & social login
- 💳 **Payments** - Stripe subscriptions with tiered pricing
- 📊 **Quota Management** - Monthly image limits per tier

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI**: Custom components (shadcn-style)
- **AI**: Google Gemini 2.0 Flash
- **Auth**: Clerk
- **Database**: Vercel Postgres + Prisma
- **Payments**: Stripe
- **Storage**: Vercel Blob

## Getting Started

### 1. Clone & Install

```bash
cd nana-banana-pro
npm install
```

### 2. Environment Setup

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI API key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `DATABASE_URL` | Vercel Postgres connection string |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables, add:

   **Required for Basic Functionality:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

   **Optional (Authentication & Payments):**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   DATABASE_URL=postgres://...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

   > **Note**: The app will work without Clerk/Stripe, but authentication and payments will be disabled.

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app

### Stripe Webhook

Create a webhook in Stripe Dashboard pointing to:
```
https://your-domain.com/api/webhooks/stripe
```

Listen for these events:
- `checkout.session.completed`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Pricing Tiers

| Tier | Price | Images/Month |
|------|-------|--------------|
| Free | €0 | 3 |
| Starter | €25/mo | 50 |
| Pro | €69/mo | 200 |

Overage: €0.50 per additional image

## Project Structure

```
nana-banana-pro/
├── app/
│   ├── page.tsx          # Landing page
│   ├── enhance/page.tsx  # Photo enhancement
│   ├── remove/page.tsx   # Object removal
│   └── api/              # API routes
├── components/
│   ├── ui/               # Base UI components
│   ├── Navbar.tsx
│   ├── ImageDropzone.tsx
│   ├── BeforeAfter.tsx
│   ├── QuotaBar.tsx
│   └── PricingCards.tsx
├── lib/
│   ├── gemini.ts         # AI wrapper
│   ├── stripe.ts         # Payment client
│   ├── db.ts             # Database client
│   └── utils.ts          # Utilities
└── prisma/
    └── schema.prisma     # Database schema
```

## License

MIT
