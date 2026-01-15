import { NextRequest, NextResponse } from 'next/server'
import { enhanceImageWithMode, EnhanceMode } from '@/lib/gemini'
import { upscaleImage } from '@/lib/replicate'
import { db } from '@/lib/supabase' // Public client
import { createClient } from '@supabase/supabase-js'

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
        const { image, mimeType, mode } = body

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
        if (userId) {
            // --- Authenticated User Logic ---
            const { data: userData, error } = await supabaseAdmin
                .from('users')
                .select('images_used, images_quota, tier')
                .eq('id', userId)
                .single()

            if (userData) {
                if (userData.images_used >= userData.images_quota) {
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
        console.log('🎨 [API] Starting Gemini enhancement with mode:', enhanceMode)
        const enhancedBase64 = await enhanceImageWithMode(image, enhanceMode, mimeType || 'image/jpeg')
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
            // Call RPC to increment user usage
            const { error } = await supabaseAdmin.rpc('increment_image_usage', { user_id: userId })
            if (error) {
                console.error('Failed to increment user usage via RPC:', error)
                // Fallback direct update
                await supabaseAdmin.rpc('increment_image_usage', { user_id: userId })
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
        // Ideally we upload the Gemini result to storage if Replicate failed or wasn't used
        // For now, we prefer Replicate URL. If not available, we currently return base64.
        // To save to history, we really should have a URL.
        // We will try to upload the base64 to 'enhancements' bucket if possible, strictly for history.
        let finalHistoryUrl = upscaledUrl

        if (!finalHistoryUrl && enhancedBase64 && userId) {
            try {
                const fileName = `${userId}/${Date.now()}_enhanced.jpg`
                // Convert base64 to Buffer/Blob - Node environment
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
                } else {
                    console.warn('[API] Failed to upload enhanced image to storage used for history:', uploadError)
                }
            } catch (e) {
                console.error('[API] Storage upload exception:', e)
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
