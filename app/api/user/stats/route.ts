import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
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

export async function GET(request: NextRequest) {
    try {
        // Get authorization from header or cookie
        const authHeader = request.headers.get('authorization')
        let userId: string | null = null

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            if (!error && user) {
                userId = user.id
            }
        }

        // Check for session cookie
        const cookies = request.headers.get('cookie')
        if (!userId && cookies) {
            const sessionMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
            if (sessionMatch) {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]))
                    if (sessionData?.[0]?.access_token) {
                        const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionData[0].access_token)
                        if (!error && user) {
                            userId = user.id
                        }
                    }
                } catch {
                    // Invalid session format
                }
            }
        }

        if (!userId) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user metadata from Supabase Auth
        // This works even before database migration is run
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)

        const imagesQuota = user?.user_metadata?.imagesQuota || 50
        const imagesUsed = user?.user_metadata?.imagesUsed || 0

        // Estimate enhanced/removed based on total used
        const estimatedEnhanced = Math.floor(imagesUsed * 0.7)
        const estimatedRemoved = imagesUsed - estimatedEnhanced

        return NextResponse.json({
            imagesEnhanced: estimatedEnhanced,
            imagesRemoved: estimatedRemoved,
            imagesUsed: imagesUsed,
            imagesQuota: imagesQuota,
        })
    } catch (error) {
        console.error('Stats fetch error:', error)
        // Return default stats on error
        return NextResponse.json({
            imagesEnhanced: 0,
            imagesRemoved: 0,
            imagesUsed: 0,
            imagesQuota: 50,
        })
    }
}
