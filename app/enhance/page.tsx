'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Sparkles, RotateCcw, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ImageDropzone } from '@/components/ImageDropzone'
import { BeforeAfter } from '@/components/BeforeAfter'
import { compressImage } from '@/lib/utils'

type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

// Enhancement modes
type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color'

interface ModeOption {
    id: EnhanceMode
    icon: string
    label: string
    description: string
    bgGradient: string
    borderColor: string
}

const ENHANCE_MODES: ModeOption[] = [
    { id: 'full', icon: '✨', label: 'Full Enhance', description: 'All features combined', bgGradient: 'from-purple-50 to-indigo-50', borderColor: 'border-purple-200' },
    { id: 'hdr', icon: '🌅', label: 'HDR Merge', description: 'Shadows & highlight', bgGradient: 'from-amber-50 to-orange-50', borderColor: 'border-amber-100' },
    { id: 'window', icon: '🪟', label: 'Window Pull', description: 'Crystal clear views', bgGradient: 'from-sky-50 to-blue-50', borderColor: 'border-sky-100' },
    { id: 'sky', icon: '☁️', label: 'Sky Replace', description: 'Blue sky & clouds', bgGradient: 'from-cyan-50 to-sky-50', borderColor: 'border-cyan-100' },
    { id: 'white_balance', icon: '⚖️', label: 'White Balance', description: 'Color temperature fix', bgGradient: 'from-gray-50 to-slate-50', borderColor: 'border-gray-100' },
    { id: 'perspective', icon: '📐', label: 'Perspective', description: 'Straighten lines', bgGradient: 'from-indigo-50 to-purple-50', borderColor: 'border-indigo-100' },
    { id: 'relighting', icon: '💡', label: 'Relighting', description: 'Even illumination', bgGradient: 'from-yellow-50 to-amber-50', borderColor: 'border-yellow-100' },
    { id: 'raw_quality', icon: '📷', label: 'RAW Quality', description: '4K maximum detail', bgGradient: 'from-emerald-50 to-green-50', borderColor: 'border-emerald-100' },
    { id: 'privacy', icon: '🔒', label: 'Auto Privacy', description: 'Blur plates & faces', bgGradient: 'from-rose-50 to-pink-50', borderColor: 'border-rose-100' },
    { id: 'color', icon: '🎨', label: 'Color Fix', description: 'Vibrant colors', bgGradient: 'from-violet-50 to-purple-50', borderColor: 'border-violet-100' },
]

export default function EnhancePage() {
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
    const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
    const [processingState, setProcessingState] = useState<ProcessingState>('idle')
    const [selectedMode, setSelectedMode] = useState<EnhanceMode>('full')

    const handleImageSelect = async (file: File, preview: string) => {
        setOriginalImage(preview)
        setOriginalFile(file)
        setEnhancedImage(null)
        setUpscaledImage(null)
        setProcessingState('idle')
        // Don't auto-process - wait for user to select mode and click enhance
    }

    const processImage = async () => {
        if (!originalFile) {
            toast.error('Please select an image first')
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
                throw new Error(error.message || 'Enhancement failed')
            }

            const data = await response.json()
            setEnhancedImage(data.enhanced)
            if (data.upscaled) {
                setUpscaledImage(data.upscaled)
            }
            setProcessingState('done')
            toast.success('Image enhanced successfully!')
        } catch (error) {
            console.error('Enhancement error:', error)
            setProcessingState('error')
            toast.error(error instanceof Error ? error.message : 'Enhancement failed. Please try again.')
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

            toast.success(`${label} downloaded!`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download image')
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
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-5xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Enhancement</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Enhance Your Photo
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Select an enhancement mode below, then upload your image.
                    </p>
                </div>

                {/* Mode Selection Grid */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Choose Enhancement Mode</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
                        {ENHANCE_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                disabled={processingState === 'processing'}
                                className={`
                                    relative flex flex-col items-center gap-1 p-4 rounded-xl transition-all duration-200
                                    bg-gradient-to-br ${mode.bgGradient} border-2
                                    ${selectedMode === mode.id
                                        ? 'border-blue-500 ring-2 ring-blue-200 scale-105 shadow-lg'
                                        : `${mode.borderColor} hover:scale-102 hover:shadow-md`
                                    }
                                    ${processingState === 'processing' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                {selectedMode === mode.id && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <span className="text-2xl">{mode.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{mode.label}</span>
                                <span className="text-xs text-gray-500 text-center">{mode.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Mode Info */}
                {selectedModeInfo && (
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700">
                            <span className="text-xl">{selectedModeInfo.icon}</span>
                            <span className="font-medium">Selected: {selectedModeInfo.label}</span>
                            <span className="text-blue-500">- {selectedModeInfo.description}</span>
                        </div>
                    </div>
                )}


                {/* Main Content */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {processingState === 'done' && enhancedImage ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <BeforeAfter
                                    beforeImage={originalImage!}
                                    afterImage={upscaledImage || enhancedImage}
                                />
                                {upscaledImage && (
                                    <div className="text-center text-sm text-gray-500 -mt-4">
                                        Showing 4K Upscaled Result
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button onClick={() => handleDownload(enhancedImage, 'Standard Enhanced')} size="lg" variant="secondary" className="gap-2">
                                        <Download className="w-5 h-5" />
                                        Standard Enhanced
                                    </Button>

                                    {upscaledImage && (
                                        <Button onClick={() => handleDownload(upscaledImage, '4K Upscaled')} size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0">
                                            <Download className="w-5 h-5" />
                                            Download 4K Version
                                        </Button>
                                    )}

                                    <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                                        <RotateCcw className="w-5 h-5" />
                                        Enhance Another
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
                                        className="mt-6 text-center"
                                    >
                                        <Button
                                            onClick={processImage}
                                            size="lg"
                                            className="gap-2 px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Enhance with {selectedModeInfo?.label}
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
                                            <span className="font-medium">Applying {selectedModeInfo?.label}...</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            This usually takes 20-30 seconds
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
