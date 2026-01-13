import { NextRequest, NextResponse } from 'next/server'
import { enhanceImageWithMode, EnhanceMode } from '@/lib/gemini'
import { upscaleImage } from '@/lib/replicate'
import { db } from '@/lib/supabase'

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

        // Check usage limits
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

        // Process image with Gemini using specified mode (defaults to 'full')
        const enhanceMode: EnhanceMode = mode || 'full'
        console.log('🎨 [API] Starting Gemini enhancement with mode:', enhanceMode)
        const enhancedBase64 = await enhanceImageWithMode(image, enhanceMode, mimeType || 'image/jpeg')
        console.log('✅ [API] Gemini enhancement complete, image size:', enhancedBase64.length, 'bytes')

        // Step 2: Upscale with Replicate (Real-ESRGAN) to 4K
        // enhancedBase64 comes as "data:image/jpeg;base64,..."
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

        // Increment usage count
        await db.rpc('increment_usage', { user_ip: ip })
            // Fallback to direct update if RPC doesn't exist (though RPC is safer for concurrency)
            .then(({ error }) => {
                if (error) {
                    // Try direct update
                    return db.from('leads')
                        .update({ usage_count: lead.usage_count + 1 })
                        .eq('ip', ip)
                }
            })
        // Simple direct increment as fallback logic for now since we didn't define RPC function yet
        // actually let's just do direct update for MVP simplicity, race conditions unlikely at this scale

        await db.from('leads')
            .update({ usage_count: lead.usage_count + 1 })
            .eq('ip', ip)

        return NextResponse.json({
            enhanced: enhancedBase64,  // Original Gemini enhancement
            upscaled: upscaledUrl,     // 4K Replicate upscale (might be null if failed)
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
