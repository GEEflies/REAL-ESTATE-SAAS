import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { satisfaction, wantedFeatures, message } = body

        // Get user info if authenticated
        let userEmail = 'Anonymous'
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user?.email) {
                userEmail = user.email
            }
        }

        // Build email content
        const satisfactionEmoji = satisfaction <= 2 ? '😞' : satisfaction === 3 ? '😐' : satisfaction === 4 ? '🙂' : '🤩'
        const featuresText = wantedFeatures.length > 0
            ? wantedFeatures.join(', ')
            : 'None selected'

        const emailBody = `
New Feedback from Aurix Dashboard

From: ${userEmail}
Date: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SATISFACTION RATING
${satisfactionEmoji} ${satisfaction}/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WANTED FEATURES
${featuresText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADDITIONAL MESSAGE
${message || 'No additional message provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim()

        // Send email using Resend or fallback to console log
        // Send email using Resend or fallback to console log
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey) {
            console.log('Attempting to send email via Resend...')
            // Use configured emails or defaults
            // Note: 'from' must be a verified domain or the resend testing domain
            const fromEmail = process.env.FEEDBACK_FROM_EMAIL || 'Aurix Feedback <onboarding@resend.dev>'
            const toEmail = process.env.FEEDBACK_TO_EMAIL || 'karol@billik.sk'

            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: fromEmail,
                        to: [toEmail],
                        subject: `Aurix Feedback: ${satisfactionEmoji} ${satisfaction}/5 from ${userEmail}`,
                        text: emailBody,
                    }),
                })

                if (!resendResponse.ok) {
                    const errorText = await resendResponse.text()
                    console.error('❌ Resend API error:', errorText)
                    console.error('Request details:', { from: fromEmail, to: toEmail })
                } else {
                    const data = await resendResponse.json()
                    console.log('✅ Email sent successfully via Resend:', data.id)
                }
            } catch (networkError) {
                console.error('❌ Network error calling Resend:', networkError)
            }
        } else {
            // Fallback: Log to console (will appear in Vercel logs)
            console.warn('⚠️ RESEND_API_KEY is missing. Email will NOT be sent.')
            console.log('━━━━ FEEDBACK RECEIVED ━━━━')
            console.log(emailBody)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }

        // Also store in database for analytics
        try {
            await supabaseAdmin.from('feedback').insert({
                user_email: userEmail,
                satisfaction,
                wanted_features: wantedFeatures,
                message: message || null,
            })
        } catch (dbError) {
            // Table might not exist yet, that's okay
            console.log('Could not save feedback to DB (table may not exist):', dbError)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Feedback API error:', error)
        return NextResponse.json(
            { message: 'Failed to submit feedback' },
            { status: 500 }
        )
    }
}
