# Prints3D

A Next.js storefront for custom 3D printed parts and ready-made catalogue products.

## Stack

- Next.js App Router
- Tailwind CSS with shadcn-style local UI components
- Three.js and React Three Fiber for model previews
- Supabase for auth, orders, and STL storage
- Razorpay checkout
- Recharts admin analytics

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add Supabase project values.
3. Add Razorpay test keys server-side:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Run the SQL in `supabase/schema.sql` inside Supabase SQL editor.
5. Add `ADMIN_ACCESS_TOKEN` to `.env.local`. Visit `/admin` manually for the dashboard or `/backend` manually for backend management, then enter that token for that page view only.
6. Add `RESEND_API_KEY`, `ORDER_FROM_EMAIL`, and optionally `CONTACT_TO_EMAIL` if you want automatic order confirmation and contact emails. Replace `re_xxxxxxxxx` with your real Resend API key.
7. Add comma-separated `REMOTE_PINCODES` or `REMOTE_PINCODE_PREFIXES` to block remote delivery areas.
8. Start the app:

```bash
npm run dev
```

The Razorpay key secret must stay server-side only. The public key can be exposed through
`NEXT_PUBLIC_RAZORPAY_KEY_ID`.
