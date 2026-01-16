import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Initialize Supabase Admin
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

export async function POST(request: NextRequest) {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json(
            { message: 'Missing signature or webhook config' },
            { status: 400 }
        )
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json(
            { message: 'Webhook signature verification failed' },
            { status: 400 }
        )
    }

    try {
        // Common helper to find user ID from subscription or customer
        const getUserId = async (customerId: string, subscriptionId?: string) => {
            // First try to find by stripe_customer_id in our DB
            const { data: userByCustomer } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single()

            if (userByCustomer) return userByCustomer.id

            // If not found (rare), try to get from Stripe metadata
            if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId)
                if (sub.metadata?.userId) return sub.metadata.userId
            }

            const customer = await stripe.customers.retrieve(customerId)
            if (!customer.deleted && customer.metadata?.userId) {
                return customer.metadata.userId
            }

            return null
        }

        switch (event.type) {
            // Handle successful subscription renewal (Monthly reset)
            case 'invoice.payment_succeeded': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any

                // Only process subscription invoices
                if (!invoice.subscription) break

                const userId = await getUserId(
                    invoice.customer as string,
                    invoice.subscription as string
                )

                if (userId) {
                    console.log(`Resetting usage for user ${userId} (Invoice Paid)`)
                    // Reset usage in users table and set status to active
                    const { error } = await supabaseAdmin
                        .from('users')
                        .update({
                            images_used: 0,
                            subscription_status: 'active',
                            payment_status: 'paid',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)

                    if (error) console.error('Failed to reset user usage:', error)
                }
                break
            }

            // Handle payment failure
            case 'invoice.payment_failed': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any
                if (!invoice.subscription) break

                const userId = await getUserId(
                    invoice.customer as string,
                    invoice.subscription as string
                )

                if (userId) {
                    console.log(`Payment failed for user ${userId}`)
                    await supabaseAdmin
                        .from('users')
                        .update({
                            payment_status: 'failed',
                            subscription_status: 'past_due',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)
                }
                break
            }

            // Handle subscription updates (plan change, cancellation scheduled, etc.)
            case 'customer.subscription.updated': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subscription = event.data.object as any
                const userId = await getUserId(subscription.customer as string, subscription.id)

                if (userId) {
                    const status = subscription.status

                    await supabaseAdmin
                        .from('users')
                        .update({
                            subscription_status: status,
                            stripe_subscription_id: subscription.id,
                            subscription_end_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)

                    console.log(`Updated subscription status for user ${userId} to ${status}`)
                }
                break
            }

            // Handle immediate cancellation (rare via portal, usually at period end, but possible via API)
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const userId = await getUserId(subscription.customer as string, subscription.id)

                if (!userId) break

                // Check if this was a pay-per-image subscription
                if (subscription.metadata?.type === 'pay_per_image') {
                    console.log(`[Webhook] Pay-per-image subscription canceled for user ${userId}`)

                    await supabaseAdmin
                        .from('users')
                        .update({
                            pay_per_image_enabled: false,
                            pay_per_image_subscription_id: null,
                            pay_per_image_item_id: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)
                    break
                }

                // Regular subscription cancellation - downgrade to free
                console.log(`Downgrading user ${userId} to Free (Subscription Deleted)`)

                const { error } = await supabaseAdmin
                    .from('users')
                    .update({
                        tier: 'free',
                        tier_name: 'Free',
                        images_quota: 3, // Free tier quota
                        subscription_status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                // Also update auth metadata
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        tier: 'free',
                        tierName: 'Free',
                        imagesQuota: 3,
                        subscriptionStatus: 'canceled'
                    }
                })

                if (error) console.error('Failed to downgrade user:', error)
                break
            }

            // Handle paused subscription
            case 'customer.subscription.paused': {
                const subscription = event.data.object as Stripe.Subscription
                const userId = await getUserId(subscription.customer as string, subscription.id)

                if (userId) {
                    await supabaseAdmin
                        .from('users')
                        .update({
                            subscription_status: 'paused',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)
                }
                break
            }

            // Handle resumed subscription
            case 'customer.subscription.resumed': {
                const subscription = event.data.object as Stripe.Subscription
                const userId = await getUserId(subscription.customer as string, subscription.id)

                if (userId) {
                    await supabaseAdmin
                        .from('users')
                        .update({
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)
                }
                break
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId

                if (!userId) break

                // Check if this is a pay-per-image checkout
                if (session.metadata?.type === 'pay_per_image') {
                    console.log(`[Webhook] Pay-per-image checkout completed for user ${userId}`)

                    // Get the subscription and subscription item ID
                    const subscriptionId = session.subscription as string
                    if (subscriptionId) {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
                        const subscriptionItemId = subscription.items.data[0]?.id

                        await supabaseAdmin
                            .from('users')
                            .update({
                                stripe_customer_id: session.customer as string,
                                pay_per_image_enabled: true,
                                pay_per_image_subscription_id: subscriptionId,
                                pay_per_image_item_id: subscriptionItemId,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', userId)

                        console.log(`[Webhook] Pay-per-image enabled for user ${userId}`)
                    }
                } else {
                    // Regular subscription checkout
                    await supabaseAdmin
                        .from('users')
                        .update({
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: session.subscription as string,
                            subscription_status: 'active',
                            payment_status: 'paid'
                        })
                        .eq('id', userId)
                }
                break
            }

            // Handle pay-per-image subscription created (for existing customers)
            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription

                // Only handle pay-per-image subscriptions
                if (subscription.metadata?.type !== 'pay_per_image') break

                const userId = subscription.metadata?.userId
                if (!userId) break

                const subscriptionItemId = subscription.items.data[0]?.id

                await supabaseAdmin
                    .from('users')
                    .update({
                        pay_per_image_enabled: true,
                        pay_per_image_subscription_id: subscription.id,
                        pay_per_image_item_id: subscriptionItemId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                console.log(`[Webhook] Pay-per-image subscription created for user ${userId}`)
                break
            }
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook handler error:', error)
        return NextResponse.json(
            { message: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}
