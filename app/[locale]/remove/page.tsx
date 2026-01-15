'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Eraser, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageDropzone } from '@/components/ImageDropzone'
import { BeforeAfter } from '@/components/BeforeAfter'
import { getBase64FromFile } from '@/lib/utils'
import { EmailGate } from '@/components/EmailGate'
import { PaywallGate } from '@/components/PaywallGate'
import { Footer } from '@/components/Footer'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

export default function RemovePage() {
    const t = useTranslations('Remove')
    const tToast = useTranslations('Toasts')
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [objectToRemove, setObjectToRemove] = useState('')
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')

    // Gate States
    const [emailGateOpen, setEmailGateOpen] = useState(false)
    const [paywallGateOpen, setPaywallGateOpen] = useState(false)
    const [hasEmail, setHasEmail] = useState(false)
    const [usageCount, setUsageCount] = useState(0)
    const [isPro, setIsPro] = useState(false)

    // Save state to localStorage when paywall opens (before going to Stripe)
    useEffect(() => {
        if (paywallGateOpen && originalImage) {
            try {
                localStorage.setItem('aurix_remove_state', JSON.stringify({
                    originalImage,
                    objectToRemove,
                    timestamp: Date.now(),
                }))
            } catch (e) {
                console.warn('Could not save remove state:', e)
            }
        }
    }, [paywallGateOpen, originalImage, objectToRemove])

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
                const savedState = localStorage.getItem('aurix_remove_state')
                if (savedState) {
                    const { originalImage: savedImage, objectToRemove: savedObject, timestamp } = JSON.parse(savedState)
                    // Only restore if saved within last 30 minutes
                    if (timestamp && Date.now() - timestamp < 30 * 60 * 1000) {
                        if (savedImage) setOriginalImage(savedImage)
                        if (savedObject) setObjectToRemove(savedObject)
                    }
                    // Clean up localStorage after restoring
                    localStorage.removeItem('aurix_remove_state')
                }
            } catch (e) {
                console.warn('Could not restore remove state:', e)
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
        setTimeout(processImage, 100)
    }

    const handleImageSelect = async (file: File, preview: string) => {
        setOriginalImage(preview)
        setOriginalFile(file)
        setProcessedImage(null)
        setProcessingState('idle')
    }

    const processImage = async () => {
        if (!originalFile || !objectToRemove.trim()) {
            toast.error(tToast('specifyRemove'))
            return
        }

        // Gate Checks
        if (!hasEmail) {
            setEmailGateOpen(true)
            return
        }

        if (usageCount >= 3 && !isPro) {
            setPaywallGateOpen(true)
            return
        }

        setProcessingState('processing')

        try {
            const base64 = await getBase64FromFile(originalFile)

            const response = await fetch('/api/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: originalFile.type,
                    objectToRemove: objectToRemove.trim(),
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                // Handle gate errors
                if (response.status === 401 && error.error === 'EMAIL_REQUIRED') {
                    setHasEmail(false)
                    setEmailGateOpen(true)
                    setProcessingState('idle')
                    return
                }
                if (response.status === 403 && error.error === 'LIMIT_REACHED') {
                    setUsageCount(3)
                    toast.error(tToast('limitReached'))
                    setPaywallGateOpen(true)
                    setProcessingState('idle')
                    return
                }
                throw new Error(error.message || tToast('removeError'))
            }

            const data = await response.json()
            setProcessedImage(data.processed)
            setProcessingState('done')
            setUsageCount(prev => prev + 1)
            toast.success(tToast('removeSuccess'))
        } catch (error) {
            console.error('Removal error:', error)
            setProcessingState('error')
            toast.error(error instanceof Error ? error.message : tToast('removeError'))
        }
    }

    const handleDownload = () => {
        if (!processedImage) return

        try {
            console.log('Download start. Image starts with:', processedImage.substring(0, 50))

            // Force browser to treat it as a download by changing MIME type to octet-stream
            const base64Data = processedImage.split(',')[1]
            const mimeType = processedImage.split(',')[0].split(':')[1].split(';')[0]
            const ext = mimeType.includes('png') ? 'png' : 'jpg'
            const filename = `edited-image-${Date.now()}.${ext}`

            const link = document.createElement('a')
            link.href = `data:application/octet-stream;base64,${base64Data}`
            link.download = filename

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success(`${tToast('downloadSuccess')}`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error(tToast('downloadError'))
        }
    }

    const handleReset = () => {
        setOriginalImage(null)
        setOriginalFile(null)
        setProcessedImage(null)
        setObjectToRemove('')
        setProcessingState('idle')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
            <EmailGate open={emailGateOpen} onSuccess={handleEmailSuccess} />
            <PaywallGate open={paywallGateOpen} onClose={() => setPaywallGateOpen(false)} />
            <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                        <Eraser className="w-4 h-4" />
                        <span>{t('badge')}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {processingState === 'done' && processedImage ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <BeforeAfter
                                    beforeImage={originalImage!}
                                    afterImage={processedImage}
                                />

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button onClick={handleDownload} size="lg" className="gap-2 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
                                        <Download className="w-5 h-5" />
                                        {t('download')}
                                    </Button>
                                    <Button onClick={handleReset} size="lg" variant="outline" className="gap-2 cursor-pointer hover:bg-gray-50">
                                        <RotateCcw className="w-5 h-5" />
                                        {t('editAnother')}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <ImageDropzone
                                    onImageSelect={handleImageSelect}
                                    disabled={processingState === 'processing'}
                                    currentPreview={originalImage}
                                    onClear={handleReset}
                                />

                                {/* Object Input & Process Button */}
                                {originalImage && processingState !== 'processing' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label
                                                htmlFor="objectToRemove"
                                                className="block text-sm font-medium text-gray-700 mb-2"
                                            >
                                                {t('label')}
                                            </label>
                                            <Input
                                                id="objectToRemove"
                                                type="text"
                                                placeholder={t('placeholder')}
                                                value={objectToRemove}
                                                onChange={(e) => setObjectToRemove(e.target.value)}
                                                className="max-w-md"
                                            />
                                        </div>

                                        <Button
                                            onClick={processImage}
                                            size="lg"
                                            className="gap-2 px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 cursor-pointer"
                                            disabled={!objectToRemove.trim()}
                                        >
                                            <Eraser className="w-5 h-5" />
                                            {t('button')}
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Processing State */}
                                {processingState === 'processing' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center"
                                    >
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-purple-50 text-purple-700">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">{t('removing')} &quot;{objectToRemove}&quot;...</span>
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
