'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn, formatFileSize, isValidImageType } from '@/lib/utils'

interface ImageDropzoneProps {
    onImageSelect: (file: File, preview: string) => void
    disabled?: boolean
    currentPreview?: string | null
    onClear?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

import { useTranslations } from 'next-intl'

export function ImageDropzone({
    onImageSelect,
    disabled = false,
    currentPreview,
    onClear,
}: ImageDropzoneProps) {
    const t = useTranslations('Dropzone')
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFile = useCallback(
        (file: File) => {
            setError(null)

            if (!isValidImageType(file.type)) {
                setError(t('errorFormat'))
                return
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(t('errorSize', { maxSize: formatFileSize(MAX_FILE_SIZE) }))
                return
            }

            const reader = new FileReader()
            reader.onload = () => {
                const preview = reader.result as string
                onImageSelect(file, preview)
            }
            reader.readAsDataURL(file)
        },
        [onImageSelect, t]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            if (disabled) return

            const file = e.dataTransfer.files[0]
            if (file) {
                handleFile(file)
            }
        },
        [disabled, handleFile]
    )

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            if (!disabled) {
                setIsDragging(true)
            }
        },
        [disabled]
    )

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleClick = useCallback(() => {
        if (disabled) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/jpeg,image/png,image/webp'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                handleFile(file)
            }
        }
        input.click()
    }, [disabled, handleFile])

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {currentPreview ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50"
                    >
                        <img
                            src={currentPreview}
                            alt="Preview"
                            className="w-full h-auto max-h-[400px] object-contain"
                        />
                        {onClear && !disabled && (
                            <button
                                onClick={onClear}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            'relative border-2 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-200 cursor-pointer',
                            isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleClick}
                    >
                        <div className="flex flex-col items-center justify-center text-center">
                            <motion.div
                                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                                className={cn(
                                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
                                    isDragging ? 'bg-blue-100' : 'bg-white shadow-md'
                                )}
                            >
                                {isDragging ? (
                                    <Upload className="w-8 h-8 text-blue-500" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                )}
                            </motion.div>

                            <p className="text-lg font-medium text-gray-900 mb-1">
                                {t('dragDrop')}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('supports')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 flex items-center gap-2 text-red-500 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
