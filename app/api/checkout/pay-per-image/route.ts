import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    createPayPerImageSubscription,
    createPayPerImageCheckout,
} from '@/lib/stripe'

// Server-side Supabase client (Admin)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)

/**
 * PAY-PER-IMAGE CHECKOUT ENDPOINT
 * 
 * Handles two scenarios:
 * 1. Existing customer with stripe_customer_id → Creates metered subscription directly
 * 2. New user → Redirects to Stripe Checkout to collect card, then creates metered subscription
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { returnUrl } = body as { returnUrl?: string }

        // Check for authenticated user
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json(
                { message: 'Invalid authentication' },
                { status: 401 }
            )
        }

        // Get user's Stripe customer ID
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id, pay_per_image_enabled, pay_per_image_subscription_id')
            .eq('id', user.id)
            .single()

        if (userError) {
            console.error('Error fetching user data:', userError)
            return NextResponse.json(
                { message: 'Failed to fetch user data' },
                { status: 500 }
            )
        }

        // Check if user already has pay-per-image enabled
        if (userData?.pay_per_image_enabled && userData?.pay_per_image_subscription_id) {
            return NextResponse.json({
                success: true,
                message: 'Pay-per-image is already enabled',
                alreadyEnabled: true,
            })
        }

        // Scenario 1: User already has a Stripe customer ID (existing subscriber)
        if (userData?.stripe_customer_id) {
            try {
                const { subscriptionId, subscriptionItemId } = await createPayPerImageSubscription(
                    userData.stripe_customer_id,
                    user.id
                )

                // Update user record
                await supabaseAdmin
                    .from('users')
                    .update({
                        pay_per_image_enabled: true,
                        pay_per_image_subscription_id: subscriptionId,
                        pay_per_image_item_id: subscriptionItemId,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id)

                return NextResponse.json({
                    success: true,
                    message: 'Pay-per-image enabled successfully',
                    subscriptionId,
                })
            } catch (error) {
                console.error('Error creating pay-per-image subscription:', error)
                return NextResponse.json(
                    { message: 'Failed to enable pay-per-image' },
                    { status: 500 }
                )
            }
        }

        // Scenario 2: New user without Stripe customer - redirect to checkout
        try {
            const session = await createPayPerImageCheckout(user.id, returnUrl)

            return NextResponse.json({
                success: true,
                url: session.url,
                sessionId: session.id,
                requiresCheckout: true,
            })
        } catch (error) {
            console.error('Error creating pay-per-image checkout:', error)
            return NextResponse.json(
                { message: 'Failed to create checkout session' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Pay-per-image API error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
