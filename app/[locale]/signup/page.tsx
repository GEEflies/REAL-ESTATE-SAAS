'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import Image from 'next/image'

interface SessionData {
    valid: boolean
    tier: string
    tierName: string
    images: number
    price: number
    sessionId: string
}

export default function SignupPage() {
    const t = useTranslations('Signup')
    const tToast = useTranslations('Toasts')
    const router = useRouter()
    const searchParams = useSearchParams()

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(true)
    const [rememberMe, setRememberMeState] = useState(false)

    // Session state
    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const [sessionError, setSessionError] = useState<string>('')

    // Verify session on mount
    useEffect(() => {
        const verifySession = async () => {
            // Check for simulated session (encrypted token)
            const simulatedSession = searchParams.get('session')
            // Check for real Stripe session ID  
            const stripeSessionId = searchParams.get('session_id')

            // Handle simulated checkout (development/testing)
            if (simulatedSession) {
                try {
                    const response = await fetch(`/api/checkout/simulate?session=${encodeURIComponent(simulatedSession)}`)
                    const data = await response.json()

                    if (data.valid) {
                        setSessionData(data)
                    } else {
                        setSessionError(data.message || 'Invalid or expired session')
                    }
                } catch (err) {
                    console.error('Session verification error:', err)
                    setSessionError(t('errors.sessionVerify'))
                } finally {
                    setIsVerifying(false)
                }
                return
            }

            // Handle real Stripe checkout (production)
            if (stripeSessionId) {
                try {
                    const response = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(stripeSessionId)}`)
                    const data = await response.json()

                    if (data.valid) {
                        setSessionData(data)
                    } else {
                        setSessionError(data.message || 'Invalid Stripe session')
                    }
                } catch (err) {
                    console.error('Stripe session verification error:', err)
                    setSessionError(t('errors.stripeVerify'))
                } finally {
                    setIsVerifying(false)
                }
                return
            }

            // No session parameter found
            setSessionError(t('errors.noSession'))
            setIsVerifying(false)
        }

        verifySession()
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!email || !password) {
            toast.error(t('errors.fillAll'))
            return
        }

        if (password !== confirmPassword) {
            toast.error(tToast('passwordMatch'))
            return
        }

        if (password.length < 8) {
            toast.error(tToast('passwordLength'))
            return
        }

        setIsLoading(true)

        try {
            // Set Remember Me preference before signing up
            const { setRememberMe } = await import('@/lib/supabase-auth')
            setRememberMe(rememberMe)

            // Get session parameters (either simulated or Stripe)
            const simulatedSession = searchParams.get('session')
            const stripeSessionId = searchParams.get('session_id')

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    session: simulatedSession, // Simulated session (encrypted)
                    sessionId: stripeSessionId, // Real Stripe session_id
                    // Also pass the verified session data
                    tierData: sessionData ? {
                        tier: sessionData.tier,
                        tierName: sessionData.tierName,
                        images: sessionData.images,
                    } : null,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || t('errors.generic'))
            }

            // Success - show verification email sent message
            toast.success(t('success.accountCreated'))
            router.push('/verify-email?email=' + encodeURIComponent(email))
        } catch (error) {
            console.error('Signup error:', error)
            toast.error(error instanceof Error ? error.message : t('errors.generic'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        try {
            const session = searchParams.get('session')
            const stripeSessionId = searchParams.get('session_id')

            // Build redirect URL with session params
            let redirectUrl = `${window.location.origin}/dashboard`
            const params = new URLSearchParams()
            if (session) params.append('session', session)
            if (stripeSessionId) params.append('session_id', stripeSessionId)
            if (params.toString()) {
                redirectUrl += `?${params.toString()}`
            }

            // In production, redirect to app subdomain
            if (process.env.NODE_ENV === 'production' && !window.location.hostname.includes('app.')) {
                redirectUrl = redirectUrl.replace('www.aurix.pics', 'app.aurix.pics')
            }

            // Dynamic import to avoid server-side issues content
            const { signInWithGoogle } = await import('@/lib/supabase-auth')
            const { error } = await signInWithGoogle(redirectUrl)

            if (error) throw error
        } catch (error) {
            console.error('Google signup error:', error)
            toast.error(t('errors.googleSignup'))
        }
    }

    // Loading state
    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">{t('verifying')}</p>
                </div>
            </div>
        )
    }

    // Error state - no valid session
    if (sessionError) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
                >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('error.title')}</h1>
                    <p className="text-gray-600 mb-6">{sessionError}</p>
                    <Button
                        onClick={() => router.push('/#pricing')}
                        size="lg"
                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                    >
                        {t('error.goToPricing')}
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Image src="/aurix-logo.png" alt="Aurix" width={40} height={40} className="rounded-lg" />
                        <span className="text-2xl font-bold text-gray-900">Aurix</span>
                    </div>
                </div>

                {/* Signup Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                        {t('title')}
                    </h1>

                    {/* Plan Badge */}
                    {sessionData && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {sessionData.tierName} - {sessionData.images} images
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('emailPlaceholder')}
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('passwordPlaceholder')}
                                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('confirmPassword')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('confirmPasswordPlaceholder')}
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center">
                            <input
                                id="remember-me-signup"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMeState(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            />
                            <label htmlFor="remember-me-signup" className="ml-2 text-sm text-gray-600 cursor-pointer">
                                {t('rememberMe')}
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg mt-6"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {t('createAccount')}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-sm text-gray-400">{t('or')}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google Signup */}
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleGoogleSignup}
                        className="w-full h-12 text-base rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {t('googleSignup')}
                    </Button>

                    {/* Terms */}
                    <p className="text-xs text-gray-400 text-center mt-6">
                        {t('terms')}
                    </p>
                </div>

                {/* Already have account */}
                <p className="text-center text-gray-600 mt-6">
                    {t('haveAccount')}{' '}
                    <button
                        onClick={() => router.push('/login')}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        {t('login')}
                    </button>
                </p>
            </motion.div>
        </div>
    )
}
