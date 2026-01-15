'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Sparkles, RotateCcw, Check, ChevronDown, X, Layers, AppWindow, CloudSun, Scale, Ruler, Lightbulb, Camera, Lock, Palette, Image as LucideImage } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ImageDropzone } from '@/components/ImageDropzone'
import { BeforeAfter } from '@/components/BeforeAfter'
import { compressImage, cn } from '@/lib/utils'
import { EmailGate } from '@/components/EmailGate'
import { PaywallGate } from '@/components/PaywallGate'
import { Footer } from '@/components/Footer'
import { EnhanceModeSelector } from '@/components/EnhanceModeSelector'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

// Enhancement modes
type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color'

interface ModeOption {
    id: EnhanceMode
    icon: any
    label: string
    description: string
    bgGradient: string
    borderColor: string
}

export default function EnhancePage() {
    const t = useTranslations('Enhance')
    const tToast = useTranslations('Toasts')
    const locale = useLocale()
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
    const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [selectedMode, setSelectedMode] = useState<EnhanceMode>('full')

    // Gate States
    const [emailGateOpen, setEmailGateOpen] = useState(false)
    const [paywallGateOpen, setPaywallGateOpen] = useState(false)
    const [hasEmail, setHasEmail] = useState(false)
    const [usageCount, setUsageCount] = useState(0)
    const [isPro, setIsPro] = useState(false)

    // Save state to localStorage when paywall opens (before going to Stripe)
    useEffect(() => {
        if (paywallGateOpen && originalImage && selectedMode) {
            try {
                localStorage.setItem('aurix_enhance_state', JSON.stringify({
                    originalImage,
                    selectedMode,
                    timestamp: Date.now(),
                }))
            } catch (e) {
                console.warn('Could not save enhance state:', e)
            }
        }
    }, [paywallGateOpen, originalImage, selectedMode])

    useEffect(() => {
        checkUsage()

        // Check if user returned from Stripe checkout cancel
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('showPaywall') === 'true') {
            setPaywallGateOpen(true)
            // Clean up the URL without reloading the page
            window.history.replaceState({}, '', window.location.pathname)

            // Restore saved state from localStorage
            try {
                const savedState = localStorage.getItem('aurix_enhance_state')
                if (savedState) {
                    const { originalImage: savedImage, selectedMode: savedMode, timestamp } = JSON.parse(savedState)
                    // Only restore if saved within last 30 minutes
                    if (timestamp && Date.now() - timestamp < 30 * 60 * 1000) {
                        if (savedImage) setOriginalImage(savedImage)
                        if (savedMode) setSelectedMode(savedMode)
                    }
                    // Clean up localStorage after restoring
                    localStorage.removeItem('aurix_enhance_state')
                }
            } catch (e) {
                console.warn('Could not restore enhance state:', e)
            }
        }
    }, [])

    const checkUsage = async () => {
        try {
            const res = await fetch('/api/lead')
            if (res.ok) {
                const data = await res.json()
                setHasEmail(data.hasEmail)
                setUsageCount(data.usageCount)
                setIsPro(data.isPro)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEmailSuccess = () => {
        setHasEmail(true)
        setEmailGateOpen(false)
        // Pass true to bypass the local state check since we just successfully registered
        processImage(true)
    }

    const ENHANCE_MODES: ModeOption[] = [
        { id: 'full', icon: Sparkles, label: t('modes.full.label'), description: t('modes.full.description'), bgGradient: 'from-purple-50 to-indigo-50', borderColor: 'border-purple-200' },
        { id: 'hdr', icon: Layers, label: t('modes.hdr.label'), description: t('modes.hdr.description'), bgGradient: 'from-amber-50 to-orange-50', borderColor: 'border-amber-100' },
        { id: 'window', icon: AppWindow, label: t('modes.window.label'), description: t('modes.window.description'), bgGradient: 'from-sky-50 to-blue-50', borderColor: 'border-sky-100' },
        { id: 'sky', icon: CloudSun, label: t('modes.sky.label'), description: t('modes.sky.description'), bgGradient: 'from-cyan-50 to-sky-50', borderColor: 'border-cyan-100' },
        { id: 'white_balance', icon: Scale, label: t('modes.white_balance.label'), description: t('modes.white_balance.description'), bgGradient: 'from-gray-50 to-slate-50', borderColor: 'border-gray-100' },
        { id: 'perspective', icon: Ruler, label: t('modes.perspective.label'), description: t('modes.perspective.description'), bgGradient: 'from-indigo-50 to-purple-50', borderColor: 'border-indigo-100' },
        { id: 'relighting', icon: Lightbulb, label: t('modes.relighting.label'), description: t('modes.relighting.description'), bgGradient: 'from-yellow-50 to-amber-50', borderColor: 'border-yellow-100' },
        { id: 'raw_quality', icon: Camera, label: t('modes.raw_quality.label'), description: t('modes.raw_quality.description'), bgGradient: 'from-emerald-50 to-green-50', borderColor: 'border-emerald-100' },
        { id: 'privacy', icon: Lock, label: t('modes.privacy.label'), description: t('modes.privacy.description'), bgGradient: 'from-rose-50 to-pink-50', borderColor: 'border-rose-100' },
        { id: 'color', icon: Palette, label: t('modes.color.label'), description: t('modes.color.description'), bgGradient: 'from-violet-50 to-purple-50', borderColor: 'border-violet-100' },
    ]

    const handleImageSelect = async (file: File, preview: string) => {
        setOriginalImage(preview)
        setOriginalFile(file)
        setEnhancedImage(null)
        setUpscaledImage(null)
        setProcessingState('idle')
        // Don't auto-process - wait for user to select mode and click enhance
    }

    const processImage = async (bypassEmailCheck = false) => {
        if (!originalFile) {
            toast.error(tToast('selectImage'))
            return
        }

        // Gate Checks
        if (!hasEmail && !bypassEmailCheck) {
            setEmailGateOpen(true)
            return
        }

        if (usageCount >= 3 && !isPro) {
            setPaywallGateOpen(true)
            return
        }

        setProcessingState('processing')

        try {
            // Compress image to reduce file size (max 4MB, max 2048px dimension)
            const { base64, mimeType } = await compressImage(originalFile, 4, 2048)

            const response = await fetch('/api/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: mimeType,
                    mode: selectedMode,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                // Handle gate errors from API if frontend state was out of sync
                if (response.status === 401 && error.error === 'EMAIL_REQUIRED') {
                    setHasEmail(false)
                    setEmailGateOpen(true)
                    setProcessingState('idle')
                    return
                }
                if (response.status === 403 && error.error === 'LIMIT_REACHED') {
                    setUsageCount(3) // Force update
                    toast.error(tToast('limitReached'))
                    setPaywallGateOpen(true)
                    setProcessingState('idle')
                    return
                }
                throw new Error(error.message || tToast('enhanceError'))
            }

            const data = await response.json()
            setEnhancedImage(data.enhanced)
            if (data.upscaled) {
                setUpscaledImage(data.upscaled)
            }
            setProcessingState('done')
            setUsageCount(prev => prev + 1) // Optimistic increment
            toast.success(tToast('enhanceSuccess'))
        } catch (error) {
            console.error('Enhancement error:', error)
            setProcessingState('error')
            toast.error(error instanceof Error ? error.message : tToast('enhanceError'))
        }
    }

    const handleDownload = (imageToDownload: string | null, label: string) => {
        if (!imageToDownload) return

        try {
            console.log(`Download start (${label})...`)

            // Detect if it's base64 or URL
            const isBase64 = imageToDownload.startsWith('data:')
            const link = document.createElement('a')

            if (isBase64) {
                // Force browser to treat it as a download by changing MIME type to octet-stream
                const base64Data = imageToDownload.split(',')[1]
                const mimeType = imageToDownload.split(',')[0].split(':')[1].split(';')[0]
                const ext = mimeType.includes('png') ? 'png' : 'jpg'
                const filename = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`

                link.href = `data:application/octet-stream;base64,${base64Data}`
                link.download = filename
            } else {
                // For URLs (Replicate output), we can just download directly
                // However, cross-origin might be an issue for programmatic download without opening new tab
                // Let's try opening in new tab if download fails, or fetch and blob it
                link.href = imageToDownload
                link.download = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
                link.target = "_blank"
            }

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success(`${label} ${tToast('downloadSuccess')}`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error(tToast('downloadError'))
        }
    }

    const handleReset = () => {
        setOriginalImage(null)
        setOriginalFile(null)
        setEnhancedImage(null)
        setUpscaledImage(null)
        setProcessingState('idle')
        setSelectedMode('full')
    }

    const selectedModeInfo = ENHANCE_MODES.find(m => m.id === selectedMode)

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
            <EmailGate open={emailGateOpen} onSuccess={handleEmailSuccess} />
            <PaywallGate open={paywallGateOpen} onClose={() => setPaywallGateOpen(false)} />
            <div className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('badge')}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Mode Selection */}
                <EnhanceModeSelector
                    selectedMode={selectedMode}
                    onSelectMode={setSelectedMode}
                    modes={ENHANCE_MODES}
                    disabled={processingState === 'processing'}
                    modeTitle={t('modeTitle')}
                />


                {/* Main Content */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {processingState === 'done' && enhancedImage ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {/* Gemini Enhanced Result Card */}
                                <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">{t('geminiCard.title')}</h3>
                                        <span className="ml-auto text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">{t('geminiCard.badge')}</span>
                                    </div>
                                    <div className="mb-4">
                                        <BeforeAfter
                                            beforeImage={originalImage!}
                                            afterImage={enhancedImage}
                                        />
                                        <p className="text-center text-xs text-gray-500 mt-2">
                                            {t('geminiCard.slider')}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleDownload(enhancedImage, 'Standard Enhanced')}
                                        className="w-full gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                        variant="secondary"
                                    >
                                        <Download className="w-5 h-5" />
                                        {t('geminiCard.download')}
                                    </Button>
                                </div>

                                {/* 4K Upscaled Result Card */}
                                {upscaledImage && (
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                            <h3 className="text-lg font-semibold text-gray-800">{t('replicateCard.title')}</h3>
                                            <span className="ml-auto text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full font-medium">{t('replicateCard.badge')}</span>
                                        </div>
                                        <div className="mb-4">
                                            <BeforeAfter
                                                beforeImage={enhancedImage}
                                                afterImage={upscaledImage}
                                            />
                                            <p className="text-center text-xs text-purple-600 mt-2 font-medium">
                                                {t('replicateCard.slider')}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleDownload(upscaledImage, '4K Upscaled')}
                                            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 cursor-pointer transition-all"
                                        >
                                            <Download className="w-5 h-5" />
                                            {t('replicateCard.download')}
                                        </Button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-center">
                                    <Button onClick={handleReset} size="lg" variant="outline" className="gap-2 cursor-pointer hover:bg-gray-50">
                                        <RotateCcw className="w-5 h-5" />
                                        {t('enhanceAnother')}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <ImageDropzone
                                    onImageSelect={handleImageSelect}
                                    disabled={processingState === 'processing'}
                                    currentPreview={originalImage}
                                    onClear={handleReset}
                                />

                                {/* Enhance Button - shows after image is selected */}
                                {originalImage && processingState === 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 text-center px-4"
                                    >
                                        <Button
                                            onClick={() => processImage(false)}
                                            size="lg"
                                            className="w-full sm:w-auto gap-2 px-6 py-4 md:px-8 md:py-6 text-base md:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 cursor-pointer"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            {t('enhanceButton')} {locale === 'sk' ? '' : selectedModeInfo?.label}
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Processing State */}
                                {processingState === 'processing' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 text-center"
                                    >
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-blue-50 text-blue-700">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">{t('applying')} {selectedModeInfo?.label}...</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {t('timeEstimate')}
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <Footer />
        </div>
    )
}
