'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles,
    Eraser,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    ChevronRight,
    User,
    Clock,
    MessageSquare
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { supabaseAuth, signOut, getSession } from '@/lib/supabase-auth'
import { toast } from 'sonner'
import { FeedbackModal } from '@/components/FeedbackModal'

interface DashboardLayoutProps {
    children: React.ReactNode
}

interface UserData {
    id: string
    email: string
    tier: string
    tierName: string
    imagesUsed: number
    imagesQuota: number
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const t = useTranslations('Dashboard')
    const tCommon = useTranslations('Common')
    const tToasts = useTranslations('Toasts')
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [user, setUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const checkAuth = async () => {
        console.log('checkAuth started')
        try {
            const session = await getSession()
            console.log('getSession result:', session ? 'Session found' : 'No session')

            if (!session) {
                console.log('No session found, redirecting to login...')

                // If on app subdomain, redirect to main domain login with return URL
                if (typeof window !== 'undefined' && window.location.hostname.startsWith('app.')) {
                    const mainDomain = window.location.hostname.includes('localhost')
                        ? 'http://localhost:3000'
                        : 'https://www.aurix.pics';
                    const returnUrl = encodeURIComponent(window.location.href);
                    const locale = pathname.startsWith('/sk') ? 'sk' : 'en';
                    window.location.href = `${mainDomain}/${locale}/login?redirect=${returnUrl}`;
                } else {
                    // Normal redirect on same domain
                    router.push('/login');
                }
                return
            }

            // Check if this is a login-only attempt (from login page via Google)
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search)
                const isLoginOnly = urlParams.get('login_only') === 'true'

                if (isLoginOnly) {
                    console.log('Login-only attempt detected, checking if user exists in database...')

                    // Check if user exists in our database
                    const response = await fetch('/api/user/me')

                    if (!response.ok) {
                        // User doesn't exist in database - this is a new Google account
                        console.log('User not found in database, signing out...')
                        await signOut()

                        // Redirect to login with error
                        const mainDomain = window.location.hostname.includes('localhost')
                            ? 'http://localhost:3000'
                            : 'https://www.aurix.pics';
                        const locale = pathname.startsWith('/sk') ? 'sk' : 'en';

                        toast.error(tToasts('accountNotFound') || 'Account not found. Please sign up first.')
                        window.location.href = `${mainDomain}/${locale}/login?error=account_not_found`;
                        return
                    }

                    // User exists, remove the login_only parameter and continue
                    urlParams.delete('login_only')
                    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
                    window.history.replaceState({}, '', newUrl)
                }
            }

            // Get user data from API
            console.log('Fetching user data...')
            const response = await fetch('/api/user/me')
            console.log('User data response status:', response.status)

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            } else {
                console.warn('Failed to fetch user data, falling back to session')
                // Fallback to session metadata
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    tier: session.user.user_metadata?.tier || 'starter',
                    tierName: session.user.user_metadata?.tierName || 'Starter',
                    imagesUsed: 0,
                    imagesQuota: session.user.user_metadata?.imagesQuota || 50,
                })
            }
        } catch (error) {
            console.error('Auth check error:', error)
            router.push('/login')
        } finally {
            console.log('Setting isLoading false')
            setIsLoading(false)
        }
    }

    // Refresh user data (can be called after quota updates)
    const refreshUserData = async () => {
        try {
            const response = await fetch('/api/user/me')
            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
                console.log('✅ User data refreshed:', userData.imagesUsed, '/', userData.imagesQuota)
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error)
        }
    }

    useEffect(() => {
        checkAuth()

        // Listen for quota update events from enhance/remove pages
        const handleQuotaUpdate = () => {
            console.log('📊 Quota update event detected, refreshing user data...')
            refreshUserData()
        }

        window.addEventListener('quotaUpdated', handleQuotaUpdate)
        return () => window.removeEventListener('quotaUpdated', handleQuotaUpdate)
    }, [])

    const handleLogout = async () => {
        const { error } = await signOut()
        if (error) {
            toast.error(tToasts('logoutError'))
        } else {
            // Determine redirect URL (Landing Page)
            let redirectUrl = 'https://www.aurix.pics'
            if (typeof window !== 'undefined') {
                if (window.location.hostname.includes('localhost')) {
                    redirectUrl = 'http://localhost:3000'
                }
            }

            toast.success(tToasts('logoutSuccess'))
            // Force full page navigation to remove 'app' subdomain if present
            window.location.href = redirectUrl
        }
    }

    const navItems = [
        { href: '/dashboard', icon: Home, label: t('nav.home') },
        { href: '/dashboard/enhance', icon: Sparkles, label: t('nav.enhance') },
        { href: '/dashboard/remove', icon: Eraser, label: t('nav.remove') },
        { href: '/dashboard/history', icon: Clock, label: t('nav.history') },
        { href: '/dashboard/settings', icon: Settings, label: t('nav.settings') },
    ]

    const isActive = (href: string) => {
        // Handle locale prefix
        const cleanPath = pathname.replace(/^\/(en|sk)/, '')
        return cleanPath === href || (href !== '/dashboard' && cleanPath.startsWith(href))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">{tCommon('loading')}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
            {/* Sidebar - Desktop (ChatGPT Style) */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed h-full text-gray-300">
                {/* Logo */}
                <div className="p-4 mb-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-2">
                        <Image src="/aurix-logo.png" alt="Aurix" width={32} height={32} className="rounded-lg" />
                        <span className="text-xl font-bold text-white tracking-tight">Aurix</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4">
                    <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">{t('nav.menu')}</div>
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive(item.href)
                                        ? 'bg-slate-800 text-white font-medium'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'}`} />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info & Quota (Bottom) */}
                <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-slate-500">
                            <User className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.email || 'User'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-400 font-medium">{user?.tierName || 'Free'}</span>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-slate-500">{user?.imagesUsed}/{user?.imagesQuota} {t('nav.used')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Button */}
                    <button
                        onClick={() => setFeedbackOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-blue-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm cursor-pointer"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {t('nav.feedback')}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={() => setLogoutConfirmOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 mt-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {logoutConfirmOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                            onClick={() => setLogoutConfirmOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <LogOut className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('nav.logoutConfirmTitle', { default: 'Log out?' })}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {t('nav.logoutConfirmMessage', { default: 'Are you sure you want to sign out? You will be redirected to the home page.' })}
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setLogoutConfirmOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        {t('nav.logoutConfirmCancel')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/30"
                                    >
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-start gap-4 transition-transform duration-300">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors"
                    aria-label={t('nav.menu')}
                >
                    <Menu className="w-6 h-6 text-gray-300" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src="/aurix-logo.png" alt="Aurix" width={32} height={32} className="rounded-lg" />
                    <span className="text-lg font-bold text-white">Aurix</span>
                </Link>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50 bg-black/50"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 shadow-xl flex flex-col text-gray-300"
                        >
                            {/* Close Button */}
                            <div className="p-4 flex items-center justify-between border-b border-slate-800">
                                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                                    <Image src="/aurix-logo.png" alt="Aurix" width={32} height={32} className="rounded-lg" />
                                    <span className="text-lg font-bold text-white">Aurix</span>
                                </Link>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="flex-1 p-4">
                                <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">{t('nav.menu')}</div>
                                <ul className="space-y-1">
                                    {navItems.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                                                    ? 'bg-slate-800 text-white font-medium'
                                                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-400' : 'text-gray-500'}`} />
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Mobile User Info */}
                            <div className="p-4 border-t border-slate-800">
                                {user && (
                                    <div className="mb-4 p-4 bg-slate-800 rounded-xl">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-400">{t('quota.title')}</span>
                                            <span className="font-medium text-white">
                                                {user.imagesUsed}/{user.imagesQuota}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                style={{ width: `${Math.min(100, (user.imagesUsed / user.imagesQuota) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* Feedback Button */}
                                <button
                                    onClick={() => { setSidebarOpen(false); setFeedbackOpen(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    {t('nav.feedback')}
                                </button>
                                <button
                                    onClick={() => { setSidebarOpen(false); setLogoutConfirmOpen(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {t('nav.logout')}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64">
                <div className="pt-16 lg:pt-0 min-h-screen">
                    {children}
                </div>
            </main>

            {/* Feedback Modal */}
            <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </div>
    )
}
