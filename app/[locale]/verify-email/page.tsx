'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Check, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { supabaseAuth } from '@/lib/supabase-auth'

export default function VerifyEmailPage() {
    const t = useTranslations('VerifyEmail')
    const router = useRouter()
    const searchParams = useSearchParams()

    const [status, setStatus] = useState<'pending' | 'verifying' | 'verified' | 'error'>('pending')
    const [email, setEmail] = useState<string>('')
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        // Get email from URL params
        const emailParam = searchParams.get('email')
        if (emailParam) {
            setEmail(emailParam)
        }

        // Check if there's a token in the URL (from email link)
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (token && type === 'signup') {
            verifyToken(token)
        }

        // Also check for Supabase's hash-based confirmation
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
            handleHashConfirmation()
        }
    }, [searchParams])

    const verifyToken = async (token: string) => {
        setStatus('verifying')
        try {
            const { error } = await supabaseAuth.auth.verifyOtp({
                token_hash: token,
                type: 'signup',
            })

            if (error) {
                console.error('Verification error:', error)
                setStatus('error')
                toast.error('Verification failed. The link may have expired.')
            } else {
                setStatus('verified')
                toast.success('Email verified successfully!')
            }
        } catch (err) {
            console.error('Verification error:', err)
            setStatus('error')
        }
    }

    const handleHashConfirmation = async () => {
        setStatus('verifying')
        try {
            // Supabase handles the token exchange automatically
            const { data, error } = await supabaseAuth.auth.getSession()

            if (error) {
                console.error('Session error:', error)
                setStatus('error')
            } else if (data.session) {
                setStatus('verified')
                toast.success('Email verified successfully!')
            }
        } catch (err) {
            console.error('Confirmation error:', err)
            setStatus('error')
        }
    }

    const handleResendEmail = async () => {
        if (!email) {
            toast.error('No email address found')
            return
        }

        setIsResending(true)
        try {
            const { error } = await supabaseAuth.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verify-email`,
                },
            })

            if (error) {
                throw error
            }

            toast.success('Verification email sent!')
        } catch (err) {
            console.error('Resend error:', err)
            toast.error('Failed to resend email. Please try again.')
        } finally {
            setIsResending(false)
        }
    }

    const handleContinueToDashboard = () => {
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                {/* Pending State - Waiting for user to check email */}
                {status === 'pending' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center"
                        >
                            <Mail className="w-10 h-10 text-blue-600" />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('pending.title')}
                        </h1>
                        <p className="text-gray-600 mb-2">
                            {t('pending.subtitle')}
                        </p>
                        {email && (
                            <p className="text-blue-600 font-medium mb-6">
                                {email}
                            </p>
                        )}

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-600">
                                {t('pending.instruction')}
                            </p>
                        </div>

                        <Button
                            onClick={handleResendEmail}
                            variant="outline"
                            size="lg"
                            disabled={isResending}
                            className="w-full h-12 rounded-xl"
                        >
                            {isResending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    {t('pending.resend')}
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Verifying State */}
                {status === 'verifying' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('verifying.title')}
                        </h1>
                        <p className="text-gray-600">
                            {t('verifying.subtitle')}
                        </p>
                    </div>
                )}

                {/* Verified State */}
                {status === 'verified' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                        >
                            <Check className="w-10 h-10 text-green-600" />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('verified.title')}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {t('verified.subtitle')}
                        </p>

                        <Button
                            onClick={handleContinueToDashboard}
                            size="lg"
                            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
                        >
                            {t('verified.continueButton')}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('error.title')}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {t('error.subtitle')}
                        </p>

                        <Button
                            onClick={handleResendEmail}
                            size="lg"
                            disabled={isResending}
                            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                        >
                            {isResending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    {t('error.resend')}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
