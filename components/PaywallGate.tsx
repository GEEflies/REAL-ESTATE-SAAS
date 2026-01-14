'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, Flame, X, Sparkles, Building2, Crown, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PaywallGateProps {
    open: boolean
    onClose?: () => void
}

type PricingTab = 'payPerImage' | 'limitedOffer' | 'enterprise'

export function PaywallGate({ open, onClose }: PaywallGateProps) {
    const t = useTranslations('Paywall')
    const [activeTab, setActiveTab] = useState<PricingTab>('payPerImage')
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds

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
                <div className="relative pt-8 pb-4 px-6 text-center bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-900" />
                    </button>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-gray-500 text-base max-w-lg mx-auto leading-relaxed">
                        {t('subtitle')}
                    </p>

                    {/* Premium Tab Switcher - smaller padding */}
                    <div className="flex justify-center mt-6">
                        <div className="inline-flex bg-gray-100/80 p-1 rounded-full border border-gray-200/50 backdrop-blur-sm">
                            {[
                                { id: 'payPerImage', label: t('tabs.payPerImage'), icon: Sparkles },
                                { id: 'limitedOffer', label: t('tabs.limitedOffer'), icon: Flame },
                                { id: 'enterprise', label: t('tabs.enterprise'), icon: Building2 }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as PricingTab)}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 z-10",
                                        activeTab === tab.id
                                            ? "text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id && "text-blue-600")} />
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area - Tighter padding */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
                    <AnimatePresence mode="wait">
                        {activeTab === 'payPerImage' && (
                            <motion.div
                                key="payPerImage"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-2 gap-8 items-center"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900">{t('payPerImage.title')}</h3>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                                <Zap className="w-3 h-3" />
                                                Flexible Usage
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-base leading-relaxed">{t('payPerImage.description')}</p>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold tracking-tight text-gray-900">€0.69</span>
                                        <span className="text-lg text-gray-500 font-medium">/ {t('payPerImage.perImage')}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span className="font-medium text-sm text-gray-700">{t(`payPerImage.features.${i}`)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button size="lg" className="w-full h-12 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                                        {t('getStarted')}
                                    </Button>

                                    <p className="text-center text-xs text-gray-400">
                                        {t('payPerImage.invoiceNote')}
                                    </p>
                                </div>

                                <div className="relative pt-8 px-4 pb-4">
                                    {/* Abstract background decorative element */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/50 via-purple-100/30 to-transparent rounded-full blur-3xl -z-10" />

                                    {/* Container for images to preserve aspect ratio */}
                                    <div className="relative w-full aspect-[4/3]">
                                        {/* Before Image - Behind and Higher Up */}
                                        <div className="absolute -top-12 left-0 w-full h-[90%] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100 z-0 scale-95 origin-top opacity-60 rotate-[-8deg]">
                                            <div className="absolute top-3 left-3 z-30 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md">
                                                {t('before')}
                                            </div>
                                            <Image
                                                src="/landing/pricing/before.jpeg"
                                                alt="Before"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* After Image - Front and Lower Down */}
                                        <div className="absolute -bottom-4 left-0 w-full h-[90%] rounded-2xl overflow-hidden shadow-2xl border-2 border-white bg-white z-10 rotate-[8deg]">
                                            <div className="absolute top-3 right-3 z-30 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                {t('after')}
                                            </div>
                                            <Image
                                                src="/landing/pricing/after.jpeg"
                                                alt="After"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'limitedOffer' && (
                            <motion.div
                                key="limitedOffer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-3xl mx-auto"
                            >
                                {/* Urgency Banner */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 p-1 shadow-lg shadow-orange-500/20">
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-yellow-400/20 blur-2xl" />

                                        <div className="relative bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-white/20 rounded-lg shrink-0 animate-pulse">
                                                    <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg leading-none tracking-tight">
                                                        60% OFF Sale
                                                    </span>
                                                    <span className="text-xs font-medium text-orange-50/90 mt-1 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                        9 spots remaining
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/10">
                                                <span className="text-xs uppercase tracking-wider font-medium text-orange-100/80">
                                                    Expires in
                                                </span>
                                                <span className="font-mono text-xl font-bold tabular-nums tracking-widest text-white">
                                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                                                    {(timeLeft % 60).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { count: 50, price: '16.99', per: '0.34', highlight: false, id: 'starter' },
                                        { count: 100, price: '24.99', per: '0.25', highlight: true, id: 'pro' }
                                    ].map((plan) => (
                                        <div
                                            key={plan.count}
                                            className={cn(
                                                "relative p-6 rounded-2xl border-2 transition-all duration-300",
                                                plan.highlight
                                                    ? "border-orange-500/50 bg-orange-50/30 shadow-xl shadow-orange-500/10 scale-102 z-10"
                                                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg"
                                            )}
                                        >
                                            {plan.highlight && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Flame className="w-3 h-3 fill-current" />
                                                    {t('limitedOffer.bestValue')}
                                                </div>
                                            )}

                                            <h3 className="text-base font-medium text-gray-500 mb-1">
                                                {plan.count} {t('limitedOffer.images')}
                                            </h3>
                                            <div className="flex items-baseline gap-2 mb-4">
                                                <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                                                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                                    €{plan.per}/{t('payPerImage.perImage')}
                                                </span>
                                            </div>

                                            <Button
                                                className={cn(
                                                    "w-full h-10 text-sm mb-6 rounded-lg",
                                                    plan.highlight
                                                        ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20"
                                                        : "bg-gray-900 hover:bg-gray-800"
                                                )}
                                            >
                                                {t('selectPlan')}
                                            </Button>

                                            <div className="space-y-3">
                                                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Features</div>
                                                {[0, 1, 2, 3].map((i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                            plan.highlight ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                                                        )}>
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                        <span className="text-gray-700 text-sm font-medium">{t(`limitedOffer.features.${i}`)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'enterprise' && (
                            <motion.div
                                key="enterprise"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl mx-auto text-center"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>

                                <h3 className="text-3xl font-bold text-gray-900 mb-4 font-display">
                                    {t('enterprise.title')}
                                </h3>
                                <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
                                    {t('enterprise.description')}
                                </p>

                                <div className="grid md:grid-cols-2 gap-3 mb-6">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-left">
                                            <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
                                                <Check className="w-3.5 h-3.5 text-indigo-600" />
                                            </div>
                                            <span className="font-semibold text-xs text-gray-900">{t(`enterprise.features.${i}`)}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button size="lg" className="px-10 h-12 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all">
                                    {t('enterprise.contact')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
