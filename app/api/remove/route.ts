import { NextRequest, NextResponse } from 'next/server'
import { removeObject } from '@/lib/gemini'
import { db } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { reportImageUsage } from '@/lib/stripe'

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

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        const { image, mimeType, objectToRemove } = body

        if (!image) {
            return NextResponse.json(
                { message: 'No image provided' },
                { status: 400 }
            )
        }

        if (!objectToRemove) {
            return NextResponse.json(
                { message: 'Please specify what to remove' },
                { status: 400 }
            )
        }

        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        let userId: string | null = null

        // Check for authenticated user first
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            if (!error && user) {
                userId = user.id
            }
        }

        // Logic branching
        let userPayPerImageItemId: string | null = null

        if (userId) {
            // --- Authenticated User Logic ---
            const { data: userData, error } = await supabaseAdmin
                .from('users')
                .select('images_used, images_quota, tier, pay_per_image_enabled, pay_per_image_item_id')
                .eq('id', userId)
                .single()

            if (userData) {
                // Store pay-per-image item ID for usage reporting later
                if (userData.pay_per_image_enabled && userData.pay_per_image_item_id) {
                    userPayPerImageItemId = userData.pay_per_image_item_id
                }

                // Check quota - but allow if pay-per-image is enabled
                if (userData.images_used >= userData.images_quota && !userData.pay_per_image_enabled) {
                    return NextResponse.json(
                        { message: 'Quota exceeded. Please upgrade your plan.', error: 'QUOTA_EXCEEDED' },
                        { status: 403 }
                    )
                }
            } else {
                return NextResponse.json(
                    { message: 'User record not found.', error: 'USER_NOT_FOUND' },
                    { status: 404 }
                )
            }
        } else {
            // --- Anonymous / IP-based Logic (Leads) ---
            const { data: lead, error: leadError } = await db
                .from('leads')
                .select('email, usage_count, is_pro')
                .eq('ip', ip)
                .single()

            // 1. Check if email is registered (Gate)
            if (!lead || !lead.email) {
                return NextResponse.json(
                    { message: 'Email registration required', error: 'EMAIL_REQUIRED' },
                    { status: 401 }
                )
            }

            // 2. Check usage limit (Paywall)
            if (lead.usage_count >= 3 && !lead.is_pro) {
                return NextResponse.json(
                    { message: 'Usage limit reached', error: 'LIMIT_REACHED' },
                    { status: 403 }
                )
            }
        }

        // Process image with Gemini
        const processedBase64 = await removeObject(
            image,
            objectToRemove,
            mimeType || 'image/jpeg'
        )

        // Increment usage count based on user type
        if (userId) {
            // Call RPC to increment user usage
            const { error } = await supabaseAdmin.rpc('increment_image_usage', { user_id: userId })
            if (error) {
                console.error('Failed to increment user usage via RPC:', error)
            }

            // Report usage to Stripe if pay-per-image is enabled
            if (userPayPerImageItemId) {
                try {
                    await reportImageUsage(userPayPerImageItemId, 1)
                    console.log('📊 [API] Reported usage to Stripe for pay-per-image (remove)')
                } catch (stripeError) {
                    console.error('❌ [API] Failed to report usage to Stripe:', stripeError)
                }
            }
        } else {
            // Call RPC to increment lead usage
            const { error } = await db.rpc('increment_lead_usage', { lead_ip: ip })
            if (error) {
                // Fallback to direct update if RPC fails
                const { data: lead } = await db.from('leads').select('usage_count').eq('ip', ip).single()
                if (lead) {
                    await db.from('leads').update({ usage_count: lead.usage_count + 1 }).eq('ip', ip)
                }
            }
        }

        return NextResponse.json({
            processed: processedBase64,
            message: 'Object removed successfully',
        })
    } catch (error) {
        console.error('Remove API error:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Object removal failed' },
            { status: 500 }
        )
    }
}
