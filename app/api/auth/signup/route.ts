import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/db'

// Server-side Supabase client with service role key
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

// Decrypt session data (same as in simulate route)
function decryptSessionData(encrypted: string): object | null {
    try {
        const crypto = require('crypto')
        const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'aurix-default-key-change-in-prod'
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(),
            Buffer.alloc(16, 0)
        )
        let decrypted = decipher.update(decodeURIComponent(encrypted), 'base64', 'utf8')
        decrypted += decipher.final('utf8')
        return JSON.parse(decrypted)
    } catch {
        return null
    }
}

// Get tier enum value from tier key
function getTierFromKey(tierKey: string): 'FREE' | 'STARTER' | 'PRO' {
    if (tierKey === 'starter') return 'STARTER'
    if (tierKey.startsWith('pro_') || tierKey === 'pay_per_image') return 'PRO'
    return 'FREE'
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, session } = body

        // Validate inputs
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Verify payment session
        if (!session) {
            return NextResponse.json(
                { message: 'Payment session is required' },
                { status: 400 }
            )
        }

        const sessionData = decryptSessionData(session) as {
            tier: string
            tierName: string
            images: number
            price: number
            sessionId: string
            expiresAt: string
            paymentStatus: string
        } | null

        if (!sessionData) {
            return NextResponse.json(
                { message: 'Invalid payment session' },
                { status: 400 }
            )
        }

        // Check session expiry
        if (new Date(sessionData.expiresAt) < new Date()) {
            return NextResponse.json(
                { message: 'Payment session has expired' },
                { status: 400 }
            )
        }

        // Check payment status
        if (sessionData.paymentStatus !== 'paid') {
            return NextResponse.json(
                { message: 'Payment not completed' },
                { status: 400 }
            )
        }

        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // User needs to verify email
            user_metadata: {
                tier: sessionData.tier,
                tierName: sessionData.tierName,
                imagesQuota: sessionData.images,
            },
        })

        if (authError) {
            console.error('Supabase auth error:', authError)

            // Handle specific errors
            if (authError.message.includes('already registered')) {
                return NextResponse.json(
                    { message: 'An account with this email already exists' },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { message: 'Failed to create account' },
                { status: 500 }
            )
        }

        if (!authData.user) {
            return NextResponse.json(
                { message: 'Failed to create user' },
                { status: 500 }
            )
        }

        // Create user in database
        try {
            await prisma.user.create({
                data: {
                    supabaseId: authData.user.id,
                    email: email,
                    emailVerified: false,
                    tier: getTierFromKey(sessionData.tier),
                    imagesQuota: sessionData.images,
                    imagesUsed: 0,
                    stripeSessionId: sessionData.sessionId,
                    paymentStatus: 'PAID',
                },
            })
        } catch (dbError) {
            console.error('Database error:', dbError)
            // User was created in Supabase but not in DB - we should still continue
            // The user can still use the app, we'll sync the data later
        }

        // Send verification email
        const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
            },
        })

        if (emailError) {
            console.error('Email verification error:', emailError)
            // Don't fail the request, user can request new verification email
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully. Please check your email to verify.',
            userId: authData.user.id,
        })
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { message: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}
