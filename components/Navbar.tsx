'use client'

import { usePathname } from '@/navigation'
import { Link } from '@/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles,
    Eraser,
    Menu,
    X,
    Home,
    LogIn,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { supabaseAuth } from '@/lib/supabase-auth'


export function Navbar() {
    const t = useTranslations('Navbar')
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Check if user is logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabaseAuth.auth.getSession()
                setIsLoggedIn(!!session)
            } catch (error) {
                console.error('Auth check error:', error)
            } finally {
                setIsLoading(false)
            }
        }
        checkAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const navItems = [
        { href: '/', label: t('home'), icon: Home },
        { href: '/vylepsit', label: t('enhance'), icon: Sparkles },
        { href: '/odstranit', label: t('remove'), icon: Eraser },
    ]

    const dashboardHref = process.env.NODE_ENV === 'production'
        ? 'https://app.aurix.pics'
        : '/nastenka'

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12">
                            <Image
                                src="/aurix-logo.png"
                                alt="Aurix Logo"
                                fill
                                sizes="48px"
                                className="object-contain"
                            />
                        </div>
                        <span className="font-bold text-2xl text-gray-900">
                            Aurix
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'gap-2 cursor-pointer',
                                            isActive && 'bg-blue-50 text-blue-600'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Auth + Mobile Menu */}
                    <div className="flex items-center gap-3">
                        {/* Login Button (Desktop only) */}
                        <Link href="/prihlasenie" className="hidden md:inline-block">
                            <Button size="sm" className="gap-2">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('signIn')}</span>
                            </Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-gray-100 bg-white"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
                                            isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                )
                            })}

                            {/* Mobile Login Button */}
                            <Link
                                href="/prihlasenie"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer text-gray-600 hover:bg-gray-50"
                            >
                                <LogIn className="w-5 h-5" />
                                <span className="font-medium">{t('signIn')}</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
