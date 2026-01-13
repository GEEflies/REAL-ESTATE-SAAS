
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 })
        }

        // Upsert lead: if IP exists, update email; if not, insert new
        // Note: The unique constraint is on IP. 
        // If a user with same IP tries new email, we update the email associated with that IP.
        const { error } = await db
            .from('leads')
            .upsert({
                ip,
                email,
                // Don't reset usage_count on re-registration of same IP
            }, { onConflict: 'ip' })
            .select()

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Lead registration error:', error)
        return NextResponse.json({ message: 'Failed to register' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown'

        const { data, error } = await db
            .from('leads')
            .select('email, usage_count, is_pro')
            .eq('ip', ip)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error
        }

        // If no record, they haven't registered email yet -> usage 0, not pro
        if (!data) {
            return NextResponse.json({
                hasEmail: false,
                usageCount: 0,
                isPro: false
            })
        }

        return NextResponse.json({
            hasEmail: !!data.email,
            usageCount: data.usage_count,
            isPro: data.is_pro
        })
    } catch (error) {
        console.error('Usage check error:', error)
        return NextResponse.json({ message: 'Failed to check usage' }, { status: 500 })
    }
}
