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
        // Get the authorization header
        const authHeader = request.headers.get('authorization')
        let userId: string | null = null

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            if (!error && user) {
                userId = user.id
            }
        }

        // Also check for session cookie
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

        // Get user from Supabase Auth (works without database migration)
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (error || !supabaseUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Extract user data from Supabase user metadata
        const tier = supabaseUser.user_metadata?.tier || 'starter'
        const tierName = supabaseUser.user_metadata?.tierName || 'Starter'
        const imagesQuota = supabaseUser.user_metadata?.imagesQuota || 50
        const imagesUsed = supabaseUser.user_metadata?.imagesUsed || 0

        return NextResponse.json({
            id: supabaseUser.id,
            email: supabaseUser.email,
            emailVerified: !!supabaseUser.email_confirmed_at,
            tier: tier,
            tierName: tierName,
            imagesUsed: imagesUsed,
            imagesQuota: imagesQuota,
            createdAt: supabaseUser.created_at,
        })
    } catch (error) {
        console.error('User fetch error:', error)
        return NextResponse.json(
            { message: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}
