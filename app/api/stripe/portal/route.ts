import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getAbsoluteUrl } from '@/lib/utils'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { locale = 'en' } = body

        // Get user profile to find stripe_customer_id
        const { data: profile } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let stripeCustomerId = profile?.stripe_customer_id

        if (!stripeCustomerId) {
            // Fallback: Check if user exists in Stripe by email
            // This handles cases where webhook might have failed or not updated DB yet
            console.log(`[STRIPE_PORTAL] No customer ID for user ${user.id}, searching by email ${user.email}...`)

            if (user.email) {
                const customers = await stripe.customers.list({
                    email: user.email,
                    limit: 1
                })

                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id
                    console.log(`[STRIPE_PORTAL] Found customer ${stripeCustomerId} by email`)

                    // Update DB so we don't need to search next time
                    await supabase
                        .from('users')
                        .update({ stripe_customer_id: stripeCustomerId })
                        .eq('id', user.id)
                }
            }

            if (!stripeCustomerId) {
                return new NextResponse("No subscription found", { status: 404 })
            }
        }

        // Create Stripe Portal Session
        // Stripe supports specific locales. 'sk' is Slovak.
        // If the locale is not supported, Stripe defaults to English or the account default.
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.aurix.pics'}${locale === 'sk' ? '/sk' : ''}/dashboard/settings`,
            locale: locale === 'sk' ? 'sk' : 'en',
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (error) {
        console.error('[STRIPE_PORTAL]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
