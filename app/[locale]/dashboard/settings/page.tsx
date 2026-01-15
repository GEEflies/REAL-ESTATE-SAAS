'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, CreditCard, Shield, LogOut, Loader2, Mail, Key, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { signOut, getSession } from '@/lib/supabase-auth'

interface UserProfile {
    id: string
    email: string
    tier: string
    tierName: string
    imagesUsed: number
    imagesQuota: number
    emailVerified: boolean
    createdAt: string
}

interface SubscriptionInfo {
    plan: string
    status: string
    imagesUsed: number
    imagesQuota: number
    renewsAt: string | null
}

export default function DashboardSettingsPage() {
    const t = useTranslations('Settings')
    const tToasts = useTranslations('Toasts')
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const [activeTab, setActiveTab] = useState<'account' | 'subscription' | 'security'>('account')
    const [user, setUser] = useState<UserProfile | null>(null)
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Account form state
    const [email, setEmail] = useState('')

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            const session = await getSession()
            if (!session) {
                router.push('/login')
                return
            }

            // Fetch user profile
            const userResponse = await fetch('/api/user/me')
            if (userResponse.ok) {
                const userData = await userResponse.json()
                setUser(userData)
                setEmail(userData.email)
                setSubscription({
                    plan: userData.tierName,
                    status: 'active',
                    imagesUsed: userData.imagesUsed,
                    imagesQuota: userData.imagesQuota,
                    renewsAt: null,
                })
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateEmail = async () => {
        setIsSaving(true)
        try {
            // TODO: Implement email update via Supabase
            toast.success(tToasts('emailFeature'))
        } catch (error) {
            toast.error(tToasts('emailError'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error(tToasts('passwordMatch'))
            return
        }

        if (newPassword.length < 8) {
            toast.error(tToasts('passwordLength'))
            return
        }

        setIsSaving(true)
        try {
            // TODO: Implement password update via Supabase
            toast.success(tToasts('passwordFeature'))
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            toast.error(tToasts('passwordError'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        const { error } = await signOut()
        if (error) {
            toast.error(tToasts('logoutError'))
        } else {
            toast.success(tToasts('logoutSuccess'))
            router.push('/')
        }
    }

    const handleManageSubscription = async () => {
        // Check if user has a Stripe subscription first
        if (!user || user.tier === 'starter' || user.tier === 'free') {
            toast.info(t('subscription.portal.noSubscription'))
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    locale: locale === 'sk' ? 'sk' : 'en'
                }),
            })

            if (response.status === 404) {
                // No Stripe customer found - show friendly message
                toast.info(t('subscription.portal.noSubscription'))
                setIsLoading(false)
                return
            }

            if (!response.ok) throw new Error(tToasts('portalError'))

            const { url } = await response.json()

            // Show toast
            toast.success(t('subscription.portal.loading'))

            // Redirect
            window.location.href = url
        } catch (error) {
            console.error('Error opening portal:', error)
            toast.error(t('subscription.portal.error'))
            setIsLoading(false)
        }
    }

    const tabs = [
        { id: 'account', icon: User, label: t('tabs.account') },
        { id: 'subscription', icon: CreditCard, label: t('tabs.subscription') },
        { id: 'security', icon: Shield, label: t('tabs.security') },
    ]

    if (isLoading) {
        return (
            <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-8 max-w-[100vw] overflow-x-hidden">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-4">
                    <Settings className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                    {t('subtitle')}
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
                {/* Tabs */}
                {/* Wrapper to allow scrolling without clipping shadows/borders if added later */}
                <div className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max pb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'account' | 'subscription' | 'security')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer border ${activeTab === tab.id
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('account.profile.title')}</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('language')}
                                    </label>
                                    <p className="text-sm text-gray-500 mb-3">{t('languageDesc')}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => {
                                                if (locale !== 'en') {
                                                    const newPath = pathname.replace(/^\/sk/, '') || '/'
                                                    router.push(newPath)
                                                }
                                            }}
                                            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${locale === 'en'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="text-lg">🇬🇧</span> English
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (locale !== 'sk') {
                                                    const newPath = `/sk${pathname}`
                                                    router.push(newPath)
                                                }
                                            }}
                                            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${locale === 'sk'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="text-lg">🇸🇰</span> Slovensky
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('account.profile.email')}
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full h-11 lg:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleUpdateEmail}
                                            disabled={isSaving || email === user?.email}
                                            className="w-full sm:w-auto h-11 lg:h-12"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('account.profile.update')}
                                        </Button>
                                    </div>

                                    {user?.emailVerified && (
                                        <div className="flex items-center gap-1.5 mt-3 text-sm text-green-600 bg-green-50 w-fit px-3 py-1 rounded-lg">
                                            <Check className="w-3.5 h-3.5" />
                                            {t('account.profile.verified')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50 rounded-2xl border border-red-200 p-4 lg:p-6">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">{t('account.danger.title')}</h3>
                            <p className="text-sm text-red-700/80 mb-4 leading-relaxed">{t('account.danger.description')}</p>
                            <Button variant="outline" className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 bg-white">
                                {t('account.danger.delete')}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Current Plan */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 lg:p-6 text-white shadow-lg overflow-hidden relative">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />

                            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        {t('subscription.current.label')}
                                    </p>
                                    <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">{subscription?.plan || 'Starter'}</h3>
                                    <div className="mt-2 inline-flex px-2.5 py-1 rounded-md bg-white/20 text-xs font-medium border border-white/20">
                                        Active
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button onClick={handleManageSubscription} variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 shadow-sm border-0 w-full sm:w-auto">
                                        {t('subscription.current.manage')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.usage.title')}</h3>

                            <div className="mb-6">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">{t('subscription.usage.images')}</span>
                                    <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                        {subscription?.imagesUsed || 0} / {subscription?.imagesQuota || 50}
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${Math.min(100, ((subscription?.imagesUsed || 0) / (subscription?.imagesQuota || 50)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    {t('subscription.usage.remaining', { count: (subscription?.imagesQuota || 50) - (subscription?.imagesUsed || 0) })}
                                </p>
                            </div>
                        </div>

                        {/* Billing History Placeholder */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.billing.title')}</h3>
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm">{t('subscription.billing.empty')}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Change Password */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('security.password.title')}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('security.password.current')}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full h-11 lg:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('security.password.new')}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full h-11 lg:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('security.password.confirm')}
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-11 lg:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        onClick={handleUpdatePassword}
                                        disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                                        className="w-full sm:w-auto h-11 lg:h-12"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('security.password.update')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('security.sessions.title')}</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{t('security.sessions.description')}</p>
                            <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto gap-2 border-gray-200 hover:bg-gray-50 h-11 lg:h-12">
                                <LogOut className="w-4 h-4" />
                                {t('security.sessions.logout')}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
