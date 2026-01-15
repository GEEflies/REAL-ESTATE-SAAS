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
            toast.success('Email update feature coming soon!')
        } catch (error) {
            toast.error('Failed to update email')
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setIsSaving(true)
        try {
            // TODO: Implement password update via Supabase
            toast.success('Password update feature coming soon!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            toast.error('Failed to update password')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        const { error } = await signOut()
        if (error) {
            toast.error('Failed to log out')
        } else {
            toast.success('Logged out successfully')
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

            if (!response.ok) throw new Error('Failed to create portal session')

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
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-4">
                    <Settings className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
                <p className="text-gray-600">
                    {t('subtitle')}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'account' | 'subscription' | 'security')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Profile Card */}
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('account.profile.title')}</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('language')}
                                    </label>
                                    <p className="text-sm text-gray-500 mb-3">{t('languageDesc')}</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (locale !== 'en') {
                                                    const newPath = pathname.replace(/^\/sk/, '') || '/'
                                                    router.push(newPath)
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${locale === 'en'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            🇬🇧 English
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (locale !== 'sk') {
                                                    const newPath = `/sk${pathname}`
                                                    router.push(newPath)
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${locale === 'sk'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            🇸🇰 Slovensky
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {t('account.profile.email')}
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            />
                                        </div>
                                        <Button onClick={handleUpdateEmail} disabled={isSaving || email === user?.email}>
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('account.profile.update')}
                                        </Button>
                                    </div>

                                    {user?.emailVerified && (
                                        <div className="flex items-center gap-1.5 mt-2 text-sm text-green-600">
                                            <Check className="w-4 h-4" />
                                            {t('account.profile.verified')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">{t('account.danger.title')}</h3>
                            <p className="text-sm text-red-700 mb-4">{t('account.danger.description')}</p>
                            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
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
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-blue-200 text-sm font-medium mb-1">{t('subscription.current.label')}</p>
                                    <h3 className="text-2xl font-bold">{subscription?.plan || 'Starter'}</h3>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleManageSubscription} variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                                        {t('subscription.current.manage')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.usage.title')}</h3>

                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">{t('subscription.usage.images')}</span>
                                    <span className="font-medium text-gray-900">
                                        {subscription?.imagesUsed || 0} / {subscription?.imagesQuota || 50}
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, ((subscription?.imagesUsed || 0) / (subscription?.imagesQuota || 50)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <p className="text-sm text-blue-700">
                                    {t('subscription.usage.remaining', { count: (subscription?.imagesQuota || 50) - (subscription?.imagesUsed || 0) })}
                                </p>
                            </div>
                        </div>

                        {/* Billing History Placeholder */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.billing.title')}</h3>
                            <p className="text-gray-500 text-sm">{t('subscription.billing.empty')}</p>
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
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
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
                                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
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
                                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleUpdatePassword}
                                    disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('security.password.update')}
                                </Button>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('security.sessions.title')}</h3>
                            <p className="text-gray-500 text-sm mb-4">{t('security.sessions.description')}</p>
                            <Button onClick={handleLogout} variant="outline" className="gap-2">
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
