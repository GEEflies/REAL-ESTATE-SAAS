# App Configuration
NEXT_PUBLIC_APP_URL=https://www.aurix.pics

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Encryption (Recommended to change in production)
SESSION_ENCRYPTION_KEY=your_secure_random_key_here

# Stripe Configuration (For production payment processing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (Create these in your Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_starter_id
STRIPE_PRO_100_PRICE_ID=price_pro100_id
STRIPE_PRO_200_PRICE_ID=price_pro200_id
STRIPE_PRO_300_PRICE_ID=price_pro300_id
STRIPE_PRO_400_PRICE_ID=price_pro400_id
STRIPE_PRO_500_PRICE_ID=price_pro500_id
STRIPE_PRO_1000_PRICE_ID=price_pro1000_id
STRIPE_SINGLE_PRICE_ID=price_single_id
STRIPE_PAY_PER_IMAGE_PRICE_ID=price_metered_id  # Metered pricing for pay-per-image

# Database (Optional - for Prisma ORM if using database)
# DATABASE_URL=postgresql://user:password@localhost:5432/aurix
