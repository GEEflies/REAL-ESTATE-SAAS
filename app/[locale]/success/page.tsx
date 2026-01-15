'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface SessionData {
    valid: boolean
    tier: string
    tierName: string
    images: number
    price: number
    sessionId: string
    message?: string
}

export default function SuccessPage() {
    const t = useTranslations('Success')
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading')
    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const verifySession = async () => {
            const session = searchParams.get('session')

            if (!session) {
                setError('No payment session found. Please complete the payment first.')
                setStatus('error')
                return
            }

            try {
                const response = await fetch(`/api/checkout/simulate?session=${encodeURIComponent(session)}`)
                const data = await response.json()

                if (data.valid) {
                    setSessionData(data)
                    setStatus('verified')
                } else {
                    setError(data.message || 'Invalid or expired session')
                    setStatus('error')
                }
            } catch (err) {
                console.error('Session verification error:', err)
                setError('Failed to verify payment. Please try again.')
                setStatus('error')
            }
        }

        verifySession()
    }, [searchParams])

    const handleContinueToSignup = () => {
        if (sessionData) {
            // Pass session data to signup page via URL params (already encrypted)
            const session = searchParams.get('session')
            router.push(`/signup?session=${encodeURIComponent(session || '')}`)
        }
    }

    const handleRetry = () => {
        router.push('/#pricing')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                {status === 'loading' && (
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

                {status === 'verified' && sessionData && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                        >
                            <Check className="w-10 h-10 text-green-600" />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('success.title')}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {t('success.subtitle')}
                        </p>

                        {/* Plan Summary */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-gray-900">{sessionData.tierName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                        {t('success.images')}
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {sessionData.images}
                                    </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                        {t('success.price')}
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        €{sessionData.price.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleContinueToSignup}
                            size="lg"
                            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg"
                        >
                            {t('success.continueButton')}
                        </Button>

                        <p className="text-xs text-gray-400 mt-4">
                            {t('success.note')}
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('error.title')}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {error || t('error.subtitle')}
                        </p>
                        <Button
                            onClick={handleRetry}
                            size="lg"
                            className="w-full h-12 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                        >
                            {t('error.retryButton')}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
