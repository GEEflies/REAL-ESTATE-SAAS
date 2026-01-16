import { NextRequest, NextResponse } from 'next/server'
import { enhanceImageWithMode, EnhanceMode } from '@/lib/gemini'
import { upscaleImage } from '@/lib/replicate'
import { db } from '@/lib/supabase' // Public client
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

// Max duration for serverless function (60 seconds)
export const maxDuration = 60


export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        const { image, mimeType, mode, addons } = body

        if (!image) {
            return NextResponse.json(
                { message: 'No image provided' },
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

        // Process image with Gemini using specified mode (defaults to 'full')
        const enhanceMode: EnhanceMode = mode || 'full'
        const selectedAddons: any[] = addons || []
        console.log(`🎨 [API] Starting Gemini enhancement with mode: ${enhanceMode}, addons: ${selectedAddons.length}`)
        const enhancedBase64 = await enhanceImageWithMode(image, enhanceMode, mimeType || 'image/jpeg', selectedAddons)
        console.log('✅ [API] Gemini enhancement complete, image size:', enhancedBase64.length, 'bytes')

        // Step 2: Upscale with Replicate (Real-ESRGAN) to 4K
        let upscaledUrl: string | null = null
        console.log('🔄 [API] Starting Replicate upscaling step...')
        try {
            upscaledUrl = await upscaleImage(enhancedBase64)
            console.log('✅ [API] Replicate upscaling successful! URL:', upscaledUrl)
        } catch (upscaleError) {
            console.error('❌ [API] Replicate upscaling failed:', upscaleError)
            console.error('❌ [API] Error details:', upscaleError instanceof Error ? upscaleError.message : String(upscaleError))
            // We fall back to the non-upscaled image so the user still gets a result
        }

        console.log('📦 [API] Preparing response - Enhanced:', !!enhancedBase64, 'Upscaled:', !!upscaledUrl)

        // Increment usage count based on user type
        if (userId) {
            // DIRECT DB UPDATE (RPC was missing)
            // Get current usage first
            const { data: currentUser, error: fetchError } = await supabaseAdmin
                .from('users')
                .select('images_used')
                .eq('id', userId)
                .single()

            if (!fetchError && currentUser) {
                const { error } = await supabaseAdmin
                    .from('users')
                    .update({ images_used: currentUser.images_used + 1 })
                    .eq('id', userId)

                if (error) {
                    console.error('Failed to increment user usage:', error)
                } else {
                    console.log(`✅ [API] Incremented usage for user ${userId} to ${currentUser.images_used + 1}`)
                }
            }

            // Report usage to Stripe if pay-per-image is enabled
            if (userPayPerImageItemId) {
                try {
                    await reportImageUsage(userPayPerImageItemId, 1)
                    console.log('📊 [API] Reported usage to Stripe for pay-per-image')
                } catch (stripeError) {
                    console.error('❌ [API] Failed to report usage to Stripe:', stripeError)
                }
            }
        } else {
            // Call RPC to increment lead usage
            const { error } = await db.rpc('increment_lead_usage', { lead_ip: ip })
            if (error) {
                // Fallback to direct update if RPC fails or not exists
                const { data: lead } = await db.from('leads').select('usage_count').eq('ip', ip).single()
                if (lead) {
                    await db.from('leads').update({ usage_count: lead.usage_count + 1 }).eq('ip', ip)
                }
            }
        }

        // ... existing enhancement/upscale logic ...

        // Determine final URL to save
        // We prefer Replicate URL. If not available, we return base64.
        // To save to history, we MUST have a URL.
        // We will try to upload the base64 (either upscaled or enhanced) to 'enhancements' bucket.
        let finalHistoryUrl = null

        // If upscaledUrl is a Data URI (Base64), we MUST upload it to storage to get a real URL
        if (upscaledUrl && upscaledUrl.startsWith('data:')) {
            console.log('📦 [API] Upscaled image is Base64, uploading to storage...')
            try {
                const fileName = `${userId}/${Date.now()}_upscaled.jpg`
                // Extract base64 part
                const base64Data = upscaledUrl.split(',')[1]
                const buffer = Buffer.from(base64Data, 'base64')
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('enhancements')
                    .upload(fileName, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })

                if (!uploadError && uploadData) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('enhancements')
                        .getPublicUrl(fileName)
                    finalHistoryUrl = publicUrl
                    // Update upscaledUrl to be the public URL so the client gets it too
                    upscaledUrl = publicUrl
                    console.log('✅ [API] Uploaded upscaled Base64 to storage:', finalHistoryUrl)
                } else {
                    console.warn('[API] Failed to upload upscaled image to storage:', uploadError)
                }
            } catch (e) {
                console.error('[API] Storage upload exception for upscaled:', e)
            }
        }
        // If upscaledUrl is already a normal URL (e.g. from Replicate directly), use it
        else if (upscaledUrl && upscaledUrl.startsWith('http')) {
            finalHistoryUrl = upscaledUrl
        }

        // Fallback: If no upscaled URL (failed) but we have enhancedBase64, upload that
        if (!finalHistoryUrl && enhancedBase64 && userId) {
            console.log('📦 [API] No upscaled URL, uploading enhanced (Gemini) image to storage...')
            try {
                const fileName = `${userId}/${Date.now()}_enhanced.jpg`
                const buffer = Buffer.from(enhancedBase64, 'base64')
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('enhancements')
                    .upload(fileName, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    })

                if (!uploadError && uploadData) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('enhancements')
                        .getPublicUrl(fileName)
                    finalHistoryUrl = publicUrl
                    console.log('✅ [API] Uploaded enhanced Base64 to storage:', finalHistoryUrl)
                } else {
                    console.warn('[API] Failed to upload enhanced image to storage:', uploadError)
                }
            } catch (e) {
                console.error('[API] Storage upload exception for enhanced:', e)
            }
        }

        // Insert into History (Images table)
        if (userId && (finalHistoryUrl || upscaledUrl)) {
            // We use upsert or insert
            const { error: dbError } = await supabaseAdmin.from('images').insert({
                user_id: userId,
                original_url: 'Batch Upload', // We don't have original URL here yet unless we upload it too
                enhanced_url: finalHistoryUrl || upscaledUrl,
                status: 'COMPLETED'
            })
            if (dbError) {
                console.error('[API] Failed to save history record:', dbError)
            } else {
                console.log('✅ [API] History record saved')
            }
        }

        return NextResponse.json({
            enhanced: enhancedBase64,
            upscaled: upscaledUrl,
            message: 'Image enhanced and upscaled successfully',
        })
    } catch (error) {
        console.error('Enhance API error:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Enhancement failed' },
            { status: 500 }
        )
    }
}
