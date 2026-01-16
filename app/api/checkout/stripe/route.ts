import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

/**
 * REAL STRIPE CHECKOUT ENDPOINT
 * 
 * To switch from simulated to real Stripe:
 * 1. Set STRIPE_SECRET_KEY in your environment
 * 2. Update PaywallGate.tsx to call '/api/checkout/stripe' instead of '/api/checkout/simulate'
 * 3. Create Stripe products and price IDs
 * 4. Update the priceId mapping below
 */

// Map tier keys to actual Stripe Price IDs
// TODO: Replace these with your real Stripe Price IDs
const STRIPE_PRICE_IDS: Record<string, string> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
    pro_100: process.env.STRIPE_PRO_100_PRICE_ID || 'price_pro100_placeholder',
    pro_200: process.env.STRIPE_PRO_200_PRICE_ID || 'price_pro200_placeholder',
    pro_300: process.env.STRIPE_PRO_300_PRICE_ID || 'price_pro300_placeholder',
    pro_400: process.env.STRIPE_PRO_400_PRICE_ID || 'price_pro400_placeholder',
    pro_500: process.env.STRIPE_PRO_500_PRICE_ID || 'price_pro500_placeholder',
    pro_1000: process.env.STRIPE_PRO_1000_PRICE_ID || 'price_pro1000_placeholder',
    pay_per_image: process.env.STRIPE_SINGLE_PRICE_ID || 'price_single_placeholder',
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tier, returnUrl } = body as { tier: string; returnUrl?: string }

        if (!tier || !STRIPE_PRICE_IDS[tier]) {
            return NextResponse.json(
                { message: 'Invalid tier selected' },
                { status: 400 }
            )
        }

        const priceId = STRIPE_PRICE_IDS[tier]

        // Authenticate user
        let userId = 'pending'

        // Check for authenticated user via Supabase
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)

            // Import Supabase client dynamically to avoid circular deps if any, 
            // or just use what we have available. We need admin checking? 
            // Actually usually we just verify the JWT on the server.

            // Let's use the createClient pattern we see in other files
            const { createClient } = await import('@supabase/supabase-js')
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: { user }, error } = await supabase.auth.getUser(token)
            if (!error && user) {
                userId = user.id
                console.log(`✅ [Checkout] Authenticated user: ${userId}`)
            } else {
                console.warn('⚠️ [Checkout] Token provided but auth failed:', error?.message)
            }
        } else {
            // Attempt to get session from cookie if no header (fallback)
            // But usually client should send it.
            console.log('ℹ️ [Checkout] No Bearer token, userId defaulting to pending')
        }


        // Create real Stripe checkout session
        const session = await createCheckoutSession(
            null, // customerId - null for new customers
            priceId,
            userId,
            tier, // Pass tier for metadata
            returnUrl // Pass return URL for cancel redirect
        )

        return NextResponse.json({
            success: true,
            url: session.url, // Stripe-hosted checkout page URL
            sessionId: session.id,
        })
    } catch (error) {
        console.error('Stripe checkout error:', error)
        return NextResponse.json(
            { message: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
