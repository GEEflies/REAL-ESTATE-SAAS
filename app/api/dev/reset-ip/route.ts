import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { message: 'This endpoint is only available in development mode' },
            { status: 403 }
        )
    }

    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        // Delete the lead record associated with this IP
        const { error } = await db
            .from('leads')
            .delete()
            .eq('ip', ip)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: `Reset successful. User with IP ${ip} is now fresh.`
        })
    } catch (error) {
        console.error('Reset IP error:', error)
        return NextResponse.json(
            { message: 'Failed to reset user status' },
            { status: 500 }
        )
    }
}
