import { NextRequest, NextResponse } from 'next/server'
import { enhanceImageWithMode, EnhanceMode } from '@/lib/gemini'
import { upscaleImage } from '@/lib/replicate'

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

        // TODO: Check user quota from database
        // const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        // if (user.imagesUsed >= TIER_LIMITS[user.tier]) {
        //   return NextResponse.json({ message: 'Quota exceeded' }, { status: 403 })
        // }

        // Process image with Gemini using specified mode (defaults to 'full')
        const enhanceMode: EnhanceMode = mode || 'full'
        const enhancedBase64 = await enhanceImageWithMode(image, enhanceMode, mimeType || 'image/jpeg')

        // Step 2: Upscale with Replicate (Real-ESRGAN) to 4K
        // enhancedBase64 comes as "data:image/jpeg;base64,..."
        let upscaledUrl: string | null = null
        try {
            console.log('Starting upscaling step...')
            upscaledUrl = await upscaleImage(enhancedBase64)
            console.log('Upscaling successful')
        } catch (upscaleError) {
            console.error('Upscaling failed, falling back to Gemini output:', upscaleError)
            // We fall back to the non-upscaled image so the user still gets a result
        }

        // TODO: Increment user quota
        // await prisma.user.update({
        //   where: { clerkId: userId },
        //   data: { imagesUsed: { increment: 1 } }
        // })

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
