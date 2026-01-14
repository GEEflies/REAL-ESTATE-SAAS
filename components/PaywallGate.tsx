'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, Flame, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaywallGateProps {
    open: boolean
    onClose?: () => void
}

type PricingTab = 'payPerImage' | 'limitedOffer' | 'enterprise'

export function PaywallGate({ open, onClose }: PaywallGateProps) {
    const t = useTranslations('Paywall')
    const [activeTab, setActiveTab] = useState<PricingTab>('payPerImage')

    if (!open) return null

    const handleClose = () => {
        if (onClose) onClose()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            {t('title')}
                        </h2>
                        <p className="text-gray-600">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-gray-100 rounded-full p-1">
                            <button
                                onClick={() => setActiveTab('payPerImage')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'payPerImage'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t('tabs.payPerImage')}
                            </button>
                            <button
                                onClick={() => setActiveTab('limitedOffer')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'limitedOffer'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Flame className="w-4 h-4 text-orange-500" />
                                {t('tabs.limitedOffer')}
                            </button>
                            <button
                                onClick={() => setActiveTab('enterprise')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'enterprise'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t('tabs.enterprise')}
                            </button>
                        </div>
                    </div>

                    {/* Pay Per Image */}
                    {activeTab === 'payPerImage' && (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('payPerImage.title')}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {t('payPerImage.description')}
                                </p>
                                <div className="mb-2">
                                    <span className="text-4xl font-bold text-gray-900">€0.69</span>
                                    <span className="text-gray-600"> / {t('payPerImage.perImage')}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    {t('payPerImage.invoiceNote')}
                                </p>
                                <Button size="lg" variant="outline" className="px-8 mb-8">
                                    {t('getStarted')}
                                </Button>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-2 text-gray-600">
                                        <Check className="w-5 h-5 text-green-500" />
                                        {t('payPerImage.features.0')}
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600">
                                        <Check className="w-5 h-5 text-green-500" />
                                        {t('payPerImage.features.1')}
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-600">
                                        <Check className="w-5 h-5 text-green-500" />
                                        {t('payPerImage.features.2')}
                                    </li>
                                </ul>
                            </div>
                            <div className="relative flex items-center justify-center py-8">
                                {/* Before Image - Tilted left */}
                                <div className="relative w-36 rounded-xl overflow-hidden shadow-lg transform -rotate-[15deg] z-10">
                                    <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-20">
                                        {t('before')}
                                    </div>
                                    <Image
                                        src="/landing/pricing/before.jpeg"
                                        alt="Before"
                                        width={300}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                                {/* After Image - Tilted right, overlapping */}
                                <div className="relative w-40 rounded-xl overflow-hidden shadow-2xl border-4 border-white transform rotate-[15deg] -ml-8 z-20">
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-20">
                                        {t('after')}
                                    </div>
                                    <Image
                                        src="/landing/pricing/after.jpeg"
                                        alt="After"
                                        width={300}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Limited Offer */}
                    {activeTab === 'limitedOffer' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* 50 Images Pack */}
                            <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 transition-colors">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm font-medium text-orange-600">{t('limitedOffer.popular')}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    50 {t('limitedOffer.images')}
                                </h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-gray-900">€16.99</span>
                                    <span className="text-gray-500 text-sm ml-2">(€0.34/{t('payPerImage.perImage')})</span>
                                </div>
                                <Button className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
                                    {t('selectPlan')}
                                </Button>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.0')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.1')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.2')}
                                    </li>
                                </ul>
                            </div>

                            {/* 100 Images Pack */}
                            <div className="border-2 border-blue-500 rounded-2xl p-6 relative bg-blue-50/50">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                                    {t('limitedOffer.bestValue')}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">
                                    100 {t('limitedOffer.images')}
                                </h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-gray-900">€24.99</span>
                                    <span className="text-gray-500 text-sm ml-2">(€0.25/{t('payPerImage.perImage')})</span>
                                </div>
                                <Button className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
                                    {t('selectPlan')}
                                </Button>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.0')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.1')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.2')}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t('limitedOffer.features.3')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Enterprise */}
                    {activeTab === 'enterprise' && (
                        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('enterprise.title')}
                            </h3>
                            <p className="text-gray-600 mb-8">
                                {t('enterprise.description')}
                            </p>
                            <ul className="space-y-3 mb-8 w-full">
                                <li className="flex items-center justify-center gap-3 text-gray-700">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    {t('enterprise.features.0')}
                                </li>
                                <li className="flex items-center justify-center gap-3 text-gray-700">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    {t('enterprise.features.1')}
                                </li>
                                <li className="flex items-center justify-center gap-3 text-gray-700">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    {t('enterprise.features.2')}
                                </li>
                                <li className="flex items-center justify-center gap-3 text-gray-700">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    {t('enterprise.features.3')}
                                </li>
                            </ul>
                            <Button size="lg" className="px-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                {t('enterprise.contact')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
