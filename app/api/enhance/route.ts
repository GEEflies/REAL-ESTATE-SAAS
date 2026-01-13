import { NextRequest, NextResponse } from 'next/server'
import { enhanceImage } from '@/lib/gemini'

// Increase body size limit for large images
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
}

// Next.js 13+ App Router config
export const maxDuration = 60 // seconds

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        const { image, mimeType } = body

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

        // Process image with Gemini
        const enhancedBase64 = await enhanceImage(image, mimeType || 'image/jpeg')

        // TODO: Increment user quota
        // await prisma.user.update({
        //   where: { clerkId: userId },
        //   data: { imagesUsed: { increment: 1 } }
        // })

        return NextResponse.json({
            enhanced: enhancedBase64,
            message: 'Image enhanced successfully',
        })
    } catch (error) {
        console.error('Enhance API error:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Enhancement failed' },
            { status: 500 }
        )
    }
}
