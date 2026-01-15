'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Sparkles, RotateCcw, Check, ChevronDown, X, Layers, AppWindow, CloudSun, Scale, Ruler, Lightbulb, Camera, Lock, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ImageDropzone } from '@/components/ImageDropzone'
import { BeforeAfter } from '@/components/BeforeAfter'
import { compressImage, cn } from '@/lib/utils'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'
type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color'

interface ModeOption {
    id: EnhanceMode
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
}

export default function DashboardEnhancePage() {
    const t = useTranslations('Enhance')
    const tToast = useTranslations('Toasts')
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
    const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [selectedMode, setSelectedMode] = useState<EnhanceMode>('full')
    const [isMobile, setIsMobile] = useState(false)
    const [modeSheetOpen, setModeSheetOpen] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const ENHANCE_MODES: ModeOption[] = [
        { id: 'full', icon: Sparkles, label: t('modes.full.label'), description: t('modes.full.description') },
        { id: 'hdr', icon: Layers, label: t('modes.hdr.label'), description: t('modes.hdr.description') },
        { id: 'window', icon: AppWindow, label: t('modes.window.label'), description: t('modes.window.description') },
        { id: 'sky', icon: CloudSun, label: t('modes.sky.label'), description: t('modes.sky.description') },
        { id: 'white_balance', icon: Scale, label: t('modes.white_balance.label'), description: t('modes.white_balance.description') },
        { id: 'perspective', icon: Ruler, label: t('modes.perspective.label'), description: t('modes.perspective.description') },
        { id: 'relighting', icon: Lightbulb, label: t('modes.relighting.label'), description: t('modes.relighting.description') },
        { id: 'raw_quality', icon: Camera, label: t('modes.raw_quality.label'), description: t('modes.raw_quality.description') },
        { id: 'privacy', icon: Lock, label: t('modes.privacy.label'), description: t('modes.privacy.description') },
        { id: 'color', icon: Palette, label: t('modes.color.label'), description: t('modes.color.description') },
    ]

    const handleImageSelect = async (file: File, preview: string) => {
        setOriginalImage(preview)
        setOriginalFile(file)
        setEnhancedImage(null)
        setUpscaledImage(null)
        setProcessingState('idle')
    }

    const processImage = async () => {
        if (!originalFile) {
            toast.error(tToast('selectImage'))
            return
        }

        setProcessingState('processing')

        try {
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
                if (response.status === 403 && error.error === 'LIMIT_REACHED') {
                    toast.error(tToast('limitReached'))
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
            const isBase64 = imageToDownload.startsWith('data:')
            const link = document.createElement('a')

            if (isBase64) {
                const base64Data = imageToDownload.split(',')[1]
                const mimeType = imageToDownload.split(',')[0].split(':')[1].split(';')[0]
                const ext = mimeType.includes('png') ? 'png' : 'jpg'
                const filename = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`

                link.href = `data:application/octet-stream;base64,${base64Data}`
                link.download = filename
            } else {
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
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
                <p className="text-gray-600">
                    {t('subtitle')}
                </p>
            </div>

            {/* Mode Selection */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('modeTitle')}</h2>

                {/* Desktop Grid */}
                {!isMobile && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {ENHANCE_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                disabled={processingState === 'processing'}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 border",
                                    selectedMode === mode.id
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-1 ring-blue-500'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50',
                                    processingState === 'processing' && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {selectedMode === mode.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <mode.icon className={cn("w-8 h-8 mb-2", selectedMode === mode.id ? "text-blue-600" : "text-gray-400")} />
                                <span className="text-xs font-bold text-center leading-tight">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Mobile Trigger */}
                {isMobile && selectedModeInfo && (
                    <button
                        onClick={() => setModeSheetOpen(true)}
                        className="w-full bg-white border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <selectedModeInfo.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-900">{selectedModeInfo.label}</div>
                                <div className="text-xs text-gray-500">{selectedModeInfo.description}</div>
                            </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Mobile Mode Sheet */}
            <AnimatePresence>
                {modeSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                            onClick={() => setModeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed bottom-0 left-0 w-full z-[70] bg-white rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-bold text-gray-900 text-lg">{t('modeTitle')}</h3>
                                <button onClick={() => setModeSheetOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-2 pb-8">
                                {ENHANCE_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            setSelectedMode(mode.id)
                                            setModeSheetOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-xl mb-1 text-left transition-all",
                                            selectedMode === mode.id
                                                ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                                                : "hover:bg-gray-50 border-2 border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <mode.icon className={cn("w-6 h-6", selectedMode === mode.id ? "text-blue-600" : "text-gray-500")} />
                                            <div>
                                                <div className={cn("font-bold", selectedMode === mode.id ? "text-blue-700" : "text-gray-900")}>
                                                    {mode.label}
                                                </div>
                                                <div className="text-xs text-gray-500">{mode.description}</div>
                                            </div>
                                        </div>
                                        {selectedMode === mode.id && <Check className="w-5 h-5 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                            {/* Enhanced Result Card */}
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">{t('geminiCard.title')}</h3>
                                    <span className="ml-auto text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">{t('geminiCard.badge')}</span>
                                </div>
                                <div className="mb-4">
                                    <BeforeAfter beforeImage={originalImage!} afterImage={enhancedImage} />
                                    <p className="text-center text-xs text-gray-500 mt-2">{t('geminiCard.slider')}</p>
                                </div>
                                <Button
                                    onClick={() => handleDownload(enhancedImage, 'Standard Enhanced')}
                                    className="w-full gap-2"
                                    variant="secondary"
                                >
                                    <Download className="w-5 h-5" />
                                    {t('geminiCard.download')}
                                </Button>
                            </div>

                            {/* 4K Upscaled Card */}
                            {upscaledImage && (
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">{t('replicateCard.title')}</h3>
                                        <span className="ml-auto text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full font-medium">{t('replicateCard.badge')}</span>
                                    </div>
                                    <div className="mb-4">
                                        <BeforeAfter beforeImage={enhancedImage} afterImage={upscaledImage} />
                                        <p className="text-center text-xs text-purple-600 mt-2 font-medium">{t('replicateCard.slider')}</p>
                                    </div>
                                    <Button
                                        onClick={() => handleDownload(upscaledImage, '4K Upscaled')}
                                        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    >
                                        <Download className="w-5 h-5" />
                                        {t('replicateCard.download')}
                                    </Button>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                                    <RotateCcw className="w-5 h-5" />
                                    {t('enhanceAnother')}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ImageDropzone
                                onImageSelect={handleImageSelect}
                                disabled={processingState === 'processing'}
                                currentPreview={originalImage}
                                onClear={handleReset}
                            />

                            {originalImage && processingState === 'idle' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
                                    <Button
                                        onClick={processImage}
                                        size="lg"
                                        className="w-full sm:w-auto gap-2 px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        {t('enhanceButton')} {selectedModeInfo?.label}
                                    </Button>
                                </motion.div>
                            )}

                            {processingState === 'processing' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
                                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-blue-50 text-blue-700">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-medium">{t('applying')} {selectedModeInfo?.label}...</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">{t('timeEstimate')}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
