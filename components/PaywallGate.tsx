'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Flame, X, Sparkles, Building2, Zap, ChevronDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PaywallGateProps {
    open: boolean
    onClose?: () => void
    defaultTab?: PricingTab
    showOnlyPayPerImage?: boolean
}

type PricingTab = 'payPerImage' | 'limitedOffer' | 'enterprise'

export function PaywallGate({ open, onClose, defaultTab = 'limitedOffer', showOnlyPayPerImage = false }: PaywallGateProps) {
    const t = useTranslations('Paywall')
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<PricingTab>(defaultTab)
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
    const [selectedProTier, setSelectedProTier] = useState(100)
    const [proDropdownOpen, setProDropdownOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Pro tier pricing tiers
    const starterTier = { count: 50, price: '16.99', originalPrice: '42.49', per: '0.34' }
    const standardProTiers = [
        { count: 100, price: '29.99', originalPrice: '74.99', per: '0.30' },
        { count: 200, price: '54.99', originalPrice: '137.99', per: '0.27' },
        { count: 300, price: '74.99', originalPrice: '187.99', per: '0.25' },
        { count: 400, price: '91.99', originalPrice: '229.99', per: '0.23' },
        { count: 500, price: '104.99', originalPrice: '262.99', per: '0.21' },
        { count: 1000, price: '189.99', originalPrice: '474.99', per: '0.19' },
    ]

    const proTiers = isMobile ? [starterTier, ...standardProTiers] : standardProTiers
    const selectedProPricing = proTiers.find(t => t.count === selectedProTier) || (isMobile ? starterTier : standardProTiers[0])

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile && selectedProTier === 100) {
                setSelectedProTier(50)
            } else if (!mobile && selectedProTier === 50) {
                setSelectedProTier(100)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (!open) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 300 // Reset or stay at 0? Let's reset for now or handle expiration
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [open])

    if (!open) return null

    const handleClose = () => {
        if (onClose) onClose()
    }

    // Handle plan selection - triggers simulated or real Stripe checkout
    const handleSelectPlan = async (tier: string) => {
        setIsLoading(true)
        try {
            // Build return URL with showPaywall parameter so paywall auto-opens on cancel
            const currentUrl = window.location.href.split('?')[0] // Get base URL without query params
            const returnUrl = `${currentUrl}?showPaywall=true`

            // Save current page state to localStorage before redirecting
            // This preserves the user's uploaded image and selected feature
            try {
                const pageState = {
                    timestamp: Date.now(),
                    url: currentUrl,
                }
                localStorage.setItem('aurix_checkout_state', JSON.stringify(pageState))
            } catch (e) {
                console.warn('Could not save checkout state:', e)
            }

            // For pay-per-image, use the dedicated endpoint
            if (tier === 'pay_per_image') {
                // Get auth token from Supabase session
                const { data: { session } } = await (await import('@/lib/supabase-auth')).supabaseAuth.auth.getSession()

                const headers: Record<string, string> = { 'Content-Type': 'application/json' }
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`
                }

                const response = await fetch('/api/checkout/pay-per-image', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ returnUrl }),
                })

                if (!response.ok) {
                    throw new Error('Failed to enable pay-per-image')
                }

                const data = await response.json()

                if (data.alreadyEnabled) {
                    toast.success('Pay-per-image is already enabled!')
                    handleClose()
                    return
                }

                if (data.requiresCheckout && data.url) {
                    // New user - redirect to Stripe checkout
                    router.push(data.url)
                } else if (data.success) {
                    // Existing customer - enabled instantly
                    toast.success('Pay-per-image enabled! You can now enhance images.')
                    handleClose()
                    // Refresh the page to update quota status
                    router.refresh()
                    return
                }
            } else {
                // Regular subscription checkout
                const response = await fetch('/api/checkout/stripe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tier,
                        returnUrl // Pass the return URL for cancel button
                    }),
                })

                if (!response.ok) {
                    throw new Error('Failed to create checkout session')
                }

                const data = await response.json()

                if (data.url) {
                    // Redirect to Stripe checkout
                    router.push(data.url)
                } else {
                    throw new Error('No checkout URL returned')
                }
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Failed to start checkout. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Map image count to tier key
    const getTierKey = (count: number): string => {
        if (count === 50) return 'starter'
        return `pro_${count}`
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with sophisticated blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Main Modal - Made smaller (max-w-4xl, max-h-[85vh]) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                {/* Header Section - Tighter padding */}
                <div className="relative pt-6 pb-2 px-6 text-center bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-900" />
                    </button>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
                        {t('subtitle')}
                    </p>

                    {/* Premium Tab Switcher - Clean Button Design */}
                    {!showOnlyPayPerImage && (
                        <div className="mt-6 px-2 sm:px-0">
                            <div className={cn(
                                "grid gap-3",
                                isMobile ? "grid-cols-2" : "flex justify-center"
                            )}>
                                {[
                                    { id: 'payPerImage', label: t('tabs.payPerImage'), icon: Sparkles },
                                    { id: 'limitedOffer', label: t('tabs.limitedOffer'), icon: Flame },
                                    { id: 'enterprise', label: t('tabs.enterprise'), icon: Building2 }
                                ].filter(tab => !isMobile || tab.id !== 'enterprise').map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as PricingTab)}
                                        className={cn(
                                            "relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                                            activeTab === tab.id
                                                ? "bg-gray-900 text-white shadow-lg scale-[1.02]"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                                        )}
                                    >
                                        <tab.icon className={cn("w-6 h-6", activeTab === tab.id ? "text-blue-300" : "text-gray-500")} />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area - Optimized for mobile */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-white">
                    <AnimatePresence mode="wait">
                        {(activeTab === 'payPerImage' || showOnlyPayPerImage) && (
                            <motion.div
                                key="payPerImage"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center"
                            >
                                <div className="space-y-4 order-2 lg:order-1 text-center lg:text-left">
                                    <div>
                                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-1">
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('payPerImage.title')}</h3>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                                <Zap className="w-3 h-3" />
                                                Flexible
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{t('payPerImage.description')}</p>
                                    </div>

                                    <div className="flex items-baseline justify-center lg:justify-start gap-2">
                                        <span className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">€0.69</span>
                                        <span className="text-base sm:text-lg text-gray-500 font-medium">/ {t('payPerImage.perImage')}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-left">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span className="font-medium text-sm text-gray-700">{t(`payPerImage.features.${i}`)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full h-11 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                                        onClick={() => handleSelectPlan('pay_per_image')}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('getStarted')}
                                    </Button>

                                    <p className="text-center text-xs text-gray-400">
                                        {t('payPerImage.invoiceNote')}
                                    </p>
                                </div>

                                <div className="relative pt-4 px-4 pb-4 order-1 lg:order-2">
                                    {/* Container for images - Reduced height on mobile */}
                                    <div className="relative w-full aspect-video sm:aspect-[4/3] mx-auto max-w-sm lg:max-w-none">
                                        {/* Before Image */}
                                        <div className="absolute top-0 left-0 w-[90%] h-[90%] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100 z-0 scale-95 origin-top-left -rotate-3">
                                            <div className="absolute top-2 left-2 z-30 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md">
                                                {t('before')}
                                            </div>
                                            <Image
                                                src="/landing/pricing/before.jpeg"
                                                alt="Before"
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </div>

                                        {/* After Image */}
                                        <div className="absolute bottom-0 right-0 w-[90%] h-[90%] rounded-2xl overflow-hidden shadow-2xl border-2 border-white bg-white z-10 rotate-3">
                                            <div className="absolute top-2 right-2 z-30 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                {t('after')}
                                            </div>
                                            <Image
                                                src="/landing/pricing/after.jpeg"
                                                alt="After"
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!showOnlyPayPerImage && activeTab === 'limitedOffer' && (
                            <motion.div
                                key="limitedOffer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-3xl mx-auto"
                            >
                                {/* Urgency Banner - Simplified */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 p-3 sm:p-4 shadow-lg text-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 sm:p-2 bg-white/20 rounded-full shrink-0 animate-pulse">
                                                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 fill-yellow-300" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm sm:text-lg leading-tight">{t('banner.sale')}</div>
                                                    <div className="text-[10px] sm:text-xs font-medium text-orange-100 opacity-90">{t('banner.spots')}</div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 bg-black/20 rounded-lg px-3 py-1.5 flex items-center justify-center">
                                                <span className="text-lg sm:text-xl font-mono font-bold tracking-widest">
                                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                                                    {(timeLeft % 60).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Starter Tier */}
                                    <div className="hidden md:block relative p-5 sm:p-6 rounded-2xl border-2 border-gray-100 bg-white">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {t('limitedOffer.starterName')}
                                        </h3>

                                        <div className="flex items-baseline flex-wrap gap-2 mb-1">
                                            <span className="text-base text-gray-400 line-through font-medium">€42.49</span>
                                            <span className="text-3xl font-bold text-gray-900">€16.99</span>
                                            <span className="text-sm font-medium text-orange-600">{t('limitedOffer.perMonth')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                                            <span>(€0.34/{t('payPerImage.perImage')})</span>
                                        </div>

                                        <Button
                                            className="w-full h-10 text-sm mb-4 rounded-lg bg-gray-900 hover:bg-gray-800"
                                            onClick={() => handleSelectPlan('starter')}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('selectPlan')}
                                        </Button>

                                        <div className="space-y-2">
                                            {/* Features list ... same as before but tighter spacing */}
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('featuresLabel')}</div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500 shrink-0" />
                                                <span className="text-gray-700 text-sm font-medium">50 {t('limitedOffer.images').toLowerCase()}</span>
                                            </div>
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                                    <span className="text-gray-700 text-sm font-medium">{t(`limitedOffer.features.${i}`)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pro Tier with Dropdown */}
                                    <div className="relative p-5 sm:p-6 rounded-2xl border-2 border-orange-500/50 bg-orange-50/30 shadow-lg">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 whitespace-nowrap">
                                            <Flame className="w-3 h-3 fill-current" />
                                            {t('limitedOffer.bestValue')}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 mt-1">
                                            {t('limitedOffer.proName')}
                                        </h3>

                                        <div className="flex items-baseline flex-wrap gap-2 mb-1">
                                            <span className="text-base text-gray-400 line-through font-medium">€{selectedProPricing.originalPrice}</span>
                                            <span className="text-3xl font-bold text-gray-900">€{selectedProPricing.price}</span>
                                            <span className="text-sm font-medium text-orange-600">{t('limitedOffer.perMonth')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                                            <span>(€{selectedProPricing.per}/{t('payPerImage.perImage')})</span>
                                        </div>

                                        <Button
                                            className="w-full h-10 text-sm mb-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md"
                                            onClick={() => handleSelectPlan(getTierKey(selectedProTier))}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('selectPlan')}
                                        </Button>

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('featuresLabel')}</div>
                                            {/* Dropdown in features */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <div className="relative flex-1">
                                                    <button
                                                        onClick={() => setProDropdownOpen(true)}
                                                        className="w-full flex items-center justify-between text-sm text-gray-700 font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-orange-400 transition-colors cursor-pointer"
                                                    >
                                                        <span>{selectedProTier} {t('limitedOffer.images').toLowerCase()}</span>
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-gray-700 text-sm font-medium">
                                                        {i === 3 && selectedProTier !== 50 ? t('limitedOffer.proFeatures.3') : t(`limitedOffer.features.${i}`)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Global Dropdown Overlay */}
                        <AnimatePresence>
                            {proDropdownOpen && (
                                <>
                                    {/* Backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                                        onClick={() => setProDropdownOpen(false)}
                                    />
                                    {/* Bottom Sheet / Modal */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 100 }}
                                        className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[400px] z-[70] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                                    >
                                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                            <h3 className="font-bold text-gray-900 text-lg">{t('selectImageCount')}</h3>
                                            <button onClick={() => setProDropdownOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                                                <X className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>
                                        <div className="overflow-y-auto p-2">
                                            {proTiers.map((tier) => (
                                                <button
                                                    key={tier.count}
                                                    onClick={() => {
                                                        setSelectedProTier(tier.count)
                                                        setProDropdownOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-4 rounded-xl mb-1 text-left transition-all",
                                                        selectedProTier === tier.count
                                                            ? "bg-orange-50 border-2 border-orange-500 shadow-sm"
                                                            : "hover:bg-gray-50 border-2 border-transparent"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={cn("font-bold text-lg", selectedProTier === tier.count ? "text-orange-700" : "text-gray-900")}>
                                                            {tier.count} {t('limitedOffer.images').toLowerCase()}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            €{tier.per}/{t('payPerImage.perImage')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-400 line-through decoration-gray-400">
                                                            €{tier.originalPrice}
                                                        </span>
                                                        <span className={cn("text-lg font-bold", selectedProTier === tier.count ? "text-orange-600" : "text-gray-900")}>
                                                            €{tier.price}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {!showOnlyPayPerImage && activeTab === 'enterprise' && (
                            <motion.div
                                key="enterprise"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-md mx-auto"
                            >
                                <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-xl shadow-indigo-500/10">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                        <Building2 className="w-7 h-7 text-white" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                                        {t('enterprise.title')}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                        {t('enterprise.description')}
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-indigo-600" />
                                                </div>
                                                <span className="font-medium text-sm text-gray-700">{t(`enterprise.features.${i}`)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full h-11 text-base bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                                        onClick={() => window.location.href = 'mailto:enterprise@aurix.pics?subject=Enterprise%20Inquiry'}
                                    >
                                        {t('enterprise.contact')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
