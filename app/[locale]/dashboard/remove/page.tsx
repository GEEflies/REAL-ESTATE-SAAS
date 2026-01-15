'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Eraser, RotateCcw, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { compressImage } from '@/lib/utils'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

export default function DashboardRemovePage() {
    const t = useTranslations('Remove')
    const tToast = useTranslations('Toasts')
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [prompt, setPrompt] = useState<string>('')
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setOriginalImage(reader.result as string)
            setOriginalFile(file)
            setProcessedImage(null)
            setProcessingState('idle')
        }
        reader.readAsDataURL(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please drop an image file')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setOriginalImage(reader.result as string)
            setOriginalFile(file)
            setProcessedImage(null)
            setProcessingState('idle')
        }
        reader.readAsDataURL(file)
    }

    const processImage = async () => {
        if (!originalFile) {
            toast.error(tToast('selectImage'))
            return
        }

        if (!prompt.trim()) {
            toast.error('Please describe what you want to remove')
            return
        }

        setProcessingState('processing')

        try {
            const { base64, mimeType } = await compressImage(originalFile, 4, 2048)

            const response = await fetch('/api/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    mimeType: mimeType,
                    prompt: prompt.trim(),
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                if (response.status === 403 && error.error === 'LIMIT_REACHED') {
                    toast.error(tToast('limitReached'))
                    setProcessingState('idle')
                    return
                }
                throw new Error(error.message || 'Failed to process image')
            }

            const data = await response.json()
            setProcessedImage(data.result)
            setProcessingState('done')
            toast.success('Object removed successfully!')
        } catch (error) {
            console.error('Remove error:', error)
            setProcessingState('error')
            toast.error(error instanceof Error ? error.message : 'Failed to remove object')
        }
    }

    const handleDownload = () => {
        if (!processedImage) return

        try {
            const isBase64 = processedImage.startsWith('data:')
            const link = document.createElement('a')

            if (isBase64) {
                const base64Data = processedImage.split(',')[1]
                link.href = `data:application/octet-stream;base64,${base64Data}`
                link.download = `removed-${Date.now()}.png`
            } else {
                link.href = processedImage
                link.download = `removed-${Date.now()}.png`
                link.target = "_blank"
            }

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success(tToast('downloadSuccess'))
        } catch (error) {
            console.error('Download error:', error)
            toast.error(tToast('downloadError'))
        }
    }

    const handleReset = () => {
        setOriginalImage(null)
        setOriginalFile(null)
        setProcessedImage(null)
        setProcessingState('idle')
        setPrompt('')
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                    <Eraser className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
                <p className="text-gray-600">
                    {t('subtitle')}
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto space-y-8">
                <AnimatePresence mode="wait">
                    {processingState === 'done' && processedImage ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Result Card */}
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Eraser className="w-5 h-5 text-purple-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">{t('result.title')}</h3>
                                </div>

                                {/* Before/After Comparison */}
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                                        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            Before
                                        </div>
                                        {originalImage && (
                                            <Image src={originalImage} alt="Original" fill className="object-cover" />
                                        )}
                                    </div>
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                                        <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            After
                                        </div>
                                        <Image src={processedImage} alt="Processed" fill className="object-cover" />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleDownload}
                                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    <Download className="w-5 h-5" />
                                    {t('result.download')}
                                </Button>
                            </div>

                            <div className="flex justify-center">
                                <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                                    <RotateCcw className="w-5 h-5" />
                                    {t('result.removeAnother')}
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
                            {/* Upload Area */}
                            {!originalImage ? (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <p className="text-gray-900 font-medium mb-2">{t('upload.title')}</p>
                                        <p className="text-sm text-gray-500">{t('upload.subtitle')}</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                                    {/* Image Preview */}
                                    <div className="relative">
                                        <button
                                            onClick={handleReset}
                                            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                                            <Image src={originalImage} alt="Selected" fill className="object-cover" />
                                        </div>
                                    </div>

                                    {/* Prompt Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('prompt.label')}
                                        </label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={t('prompt.placeholder')}
                                            className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                                            disabled={processingState === 'processing'}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">{t('prompt.hint')}</p>
                                    </div>

                                    {/* Process Button */}
                                    <Button
                                        onClick={processImage}
                                        size="lg"
                                        disabled={processingState === 'processing' || !prompt.trim()}
                                        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        {processingState === 'processing' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t('processing')}
                                            </>
                                        ) : (
                                            <>
                                                <Eraser className="w-5 h-5" />
                                                {t('removeButton')}
                                            </>
                                        )}
                                    </Button>

                                    {processingState === 'processing' && (
                                        <p className="text-sm text-gray-500 text-center">{t('processingHint')}</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
