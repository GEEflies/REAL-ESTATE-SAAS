import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Pricing tiers configuration - matches PaywallGate
const PRICING_TIERS = {
    starter: { name: 'Starter', images: 50, price: 16.99, priceId: 'price_starter' },
    pro_100: { name: 'Pro 100', images: 100, price: 29.99, priceId: 'price_pro_100' },
    pro_200: { name: 'Pro 200', images: 200, price: 54.99, priceId: 'price_pro_200' },
    pro_300: { name: 'Pro 300', images: 300, price: 74.99, priceId: 'price_pro_300' },
    pro_400: { name: 'Pro 400', images: 400, price: 91.99, priceId: 'price_pro_400' },
    pro_500: { name: 'Pro 500', images: 500, price: 104.99, priceId: 'price_pro_500' },
    pro_1000: { name: 'Pro 1000', images: 1000, price: 189.99, priceId: 'price_pro_1000' },
    pay_per_image: { name: 'Pay Per Image', images: 1, price: 0.69, priceId: 'price_single' },
} as const

type TierKey = keyof typeof PRICING_TIERS

// Simple encryption for session data (in production, use proper JWT or Stripe sessions)
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'aurix-default-key-change-in-prod'

function encryptSessionData(data: object): string {
    const jsonStr = JSON.stringify(data)
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(),
        Buffer.alloc(16, 0)
    )
    let encrypted = cipher.update(jsonStr, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encodeURIComponent(encrypted)
}

export function decryptSessionData(encrypted: string): object | null {
    try {
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tier, quantity = 1 } = body as { tier: TierKey; quantity?: number }

        if (!tier || !PRICING_TIERS[tier]) {
            return NextResponse.json(
                { message: 'Invalid tier selected' },
                { status: 400 }
            )
        }

        const tierConfig = PRICING_TIERS[tier]
        const totalImages = tierConfig.images * quantity
        const totalPrice = tierConfig.price * quantity

        // Create simulated session data
        const sessionData = {
            sessionId: `sim_${crypto.randomUUID()}`,
            tier: tier,
            tierName: tierConfig.name,
            images: totalImages,
            price: totalPrice,
            priceId: tierConfig.priceId,
            paymentStatus: 'paid', // Simulated as paid
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
        }

        // Encrypt session data
        const encryptedSession = encryptSessionData(sessionData)

        // Build success URL with encrypted session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const successUrl = `${baseUrl}/success?session=${encryptedSession}`

        return NextResponse.json({
            success: true,
            url: successUrl,
            sessionId: sessionData.sessionId,
        })
    } catch (error) {
        console.error('Simulated checkout error:', error)
        return NextResponse.json(
            { message: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}

// GET endpoint to verify a session
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const session = searchParams.get('session')

        if (!session) {
            return NextResponse.json(
                { valid: false, message: 'No session provided' },
                { status: 400 }
            )
        }

        const sessionData = decryptSessionData(session)

        if (!sessionData) {
            return NextResponse.json(
                { valid: false, message: 'Invalid session' },
                { status: 400 }
            )
        }

        const data = sessionData as {
            expiresAt: string
            paymentStatus: string
            tier: string
            tierName: string
            images: number
            price: number
            sessionId: string
        }

        // Check expiry
        if (new Date(data.expiresAt) < new Date()) {
            return NextResponse.json(
                { valid: false, message: 'Session expired' },
                { status: 400 }
            )
        }

        // Check payment status
        if (data.paymentStatus !== 'paid') {
            return NextResponse.json(
                { valid: false, message: 'Payment not completed' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            valid: true,
            tier: data.tier,
            tierName: data.tierName,
            images: data.images,
            price: data.price,
            sessionId: data.sessionId,
        })
    } catch (error) {
        console.error('Session verification error:', error)
        return NextResponse.json(
            { valid: false, message: 'Verification failed' },
            { status: 500 }
        )
    }
}
