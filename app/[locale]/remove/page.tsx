'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Eraser, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageDropzone } from '@/components/ImageDropzone'
import { BeforeAfter } from '@/components/BeforeAfter'
import { getBase64FromFile } from '@/lib/utils'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

export default function RemovePage() {
    const t = useTranslations('Remove')
    const tToast = useTranslations('Toasts')
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [processedImage, setProcessedImage] = useState<string | null>(null)
    const [objectToRemove, setObjectToRemove] = useState('')
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')

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
                throw new Error(error.message || tToast('removeError'))
            }

            const data = await response.json()
            setProcessedImage(data.processed)
            setProcessingState('done')
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
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
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
                                    <Button onClick={handleDownload} size="lg" className="gap-2">
                                        <Download className="w-5 h-5" />
                                        {t('download')}
                                    </Button>
                                    <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
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
                                            className="gap-2"
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
        </div>
    )
}
