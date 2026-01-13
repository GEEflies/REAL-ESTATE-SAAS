import { NextRequest, NextResponse } from 'next/server'
import { removeObject } from '@/lib/gemini'
import { db } from '@/lib/supabase'

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

        // Process image with Gemini
        const processedBase64 = await removeObject(
            image,
            objectToRemove,
            mimeType || 'image/jpeg'
        )

        // Increment usage count
        await db.from('leads')
            .update({ usage_count: lead.usage_count + 1 })
            .eq('ip', ip)

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
