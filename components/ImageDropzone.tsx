'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn, formatFileSize, isValidImageType } from '@/lib/utils'

interface ImageDropzoneProps {
    onImageSelect?: (file: File, preview: string) => void
    onImagesSelect?: (files: File[]) => void
    disabled?: boolean
    currentPreview?: string | null
    onClear?: () => void
    multiple?: boolean
    maxFiles?: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

import { useTranslations } from 'next-intl'

export function ImageDropzone({
    onImageSelect,
    onImagesSelect,
    disabled = false,
    currentPreview,
    onClear,
    multiple = false,
    maxFiles = 20
}: ImageDropzoneProps) {
    const t = useTranslations('Dropzone')
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFiles = useCallback(
        (files: File[]) => {
            setError(null)

            if (multiple && files.length > maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`)
                return
            }

            // Filter valid files
            const validFiles = files.filter(file => {
                if (!isValidImageType(file.type)) return false
                if (file.size > MAX_FILE_SIZE) return false
                return true
            })

            if (validFiles.length !== files.length) {
                setError(t('errorFormat')) // Simplification
            }

            if (validFiles.length === 0) return

            if (multiple && onImagesSelect) {
                onImagesSelect(validFiles)
            } else if (onImageSelect && validFiles.length > 0) {
                const file = validFiles[0]
                const reader = new FileReader()
                reader.onload = () => {
                    onImageSelect(file, reader.result as string)
                }
                reader.readAsDataURL(file)
            }
        },
        [onImageSelect, onImagesSelect, multiple, maxFiles, t]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            if (disabled) return

            const droppedFiles = Array.from(e.dataTransfer.files)
            if (droppedFiles.length > 0) {
                handleFiles(droppedFiles)
            }
        },
        [disabled, handleFiles]
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
        input.multiple = multiple
        input.accept = 'image/jpeg,image/png,image/webp'
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files
            if (files && files.length > 0) {
                handleFiles(Array.from(files))
            }
        }
        input.click()
    }, [disabled, handleFiles, multiple])

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {currentPreview ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 w-full max-w-2xl mx-auto aspect-video"
                    >
                        <img
                            src={currentPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {onClear && !disabled && (
                            <button
                                onClick={onClear}
                                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer backdrop-blur-sm"
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
                            'relative border-2 border-dashed rounded-2xl p-6 md:p-12 transition-all duration-200 cursor-pointer group',
                            isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-white',
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
                                    'w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                                    isDragging ? 'bg-blue-100' : 'bg-white shadow-sm group-hover:scale-110 group-hover:shadow-md'
                                )}
                            >
                                {isDragging ? (
                                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                )}
                            </motion.div>

                            <p className="text-base md:text-lg font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
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
