-- =====================================================
-- AURIX USER AUTHENTICATION & SUBSCRIPTION SQL
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create users table for additional user data
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro_100', 'pro_200', 'pro_300', 'pro_400', 'pro_500', 'pro_1000')),
    tier_name TEXT DEFAULT 'Free',
    images_quota INTEGER DEFAULT 3,
    images_used INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_session_id TEXT,
    payment_status TEXT DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can insert new users (for signup)
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- 4. Create trigger to sync user data from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, tier, tier_name, images_quota, images_used, payment_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
        COALESCE(NEW.raw_user_meta_data->>'tierName', 'Free'),
        COALESCE((NEW.raw_user_meta_data->>'imagesQuota')::INTEGER, 3),
        0,
        COALESCE(NEW.raw_user_meta_data->>'paymentStatus', 'none')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to update user quota usage
CREATE OR REPLACE FUNCTION public.increment_image_usage(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.users
    SET images_used = images_used + 1,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING images_used INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to check if user has quota remaining
CREATE OR REPLACE FUNCTION public.has_quota_remaining(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    quota INTEGER;
    used INTEGER;
BEGIN
    SELECT images_quota, images_used INTO quota, used
    FROM public.users
    WHERE id = user_id;
    
    RETURN COALESCE(used, 0) < COALESCE(quota, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- =====================================================
-- DONE! Your authentication system is ready.
-- =====================================================
