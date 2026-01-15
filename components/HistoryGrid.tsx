'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, AlertCircle, CheckSquare, Square, X } from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useTranslations } from 'next-intl'

interface HistoryItem {
    id: string
    created_at: string
    original_url: string | null
    enhanced_url: string | null
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

export function HistoryGrid({ initialImages }: { initialImages: HistoryItem[] }) {
    const t = useTranslations('Dashboard.history')
    const [images, setImages] = useState<HistoryItem[]>(initialImages)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
        if (newSelected.size > 0 && !isSelectionMode) {
            setIsSelectionMode(true)
        }
    }

    const selectAll = () => {
        if (selectedIds.size === images.length) {
            setSelectedIds(new Set())
            setIsSelectionMode(false)
        } else {
            const allIds = new Set(images.filter(img => img.status === 'COMPLETED').map(img => img.id))
            setSelectedIds(allIds)
            setIsSelectionMode(true)
        }
    }

    const handleBatchDownload = async () => {
        if (selectedIds.size === 0) return
        setIsDownloading(true)
        const toastId = toast.loading(`${t('actions.downloadZip')}...`)

        try {
            const zip = new JSZip()
            const folder = zip.folder("enhanced-images")

            let count = 0
            const promises = Array.from(selectedIds).map(async (id) => {
                const img = images.find(i => i.id === id)
                if (!img || !img.enhanced_url) return

                try {
                    const response = await fetch(img.enhanced_url)
                    const blob = await response.blob()
                    folder?.file(`enhanced-${id}.jpg`, blob)
                    count++
                } catch (e) {
                    console.error(`Failed to download image ${id}`, e)
                }
            })

            await Promise.all(promises)

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" })
                saveAs(content, "aurix-batch-download.zip")
                toast.success(t('actions.downloadZip'), { id: toastId })
            } else {
                toast.error("No images could be downloaded", { id: toastId })
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to create zip file", { id: toastId })
        } finally {
            setIsDownloading(false)
            setSelectedIds(new Set())
            setIsSelectionMode(false)
        }
    }

    const handleSingleDownload = async (url: string | null, filename: string) => {
        if (!url) return

        try {
            if (url.startsWith('data:')) {
                const response = await fetch(url)
                const blob = await response.blob()
                const blobUrl = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = blobUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
            } else {
                const response = await fetch(url)
                const blob = await response.blob()
                const blobUrl = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = blobUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
            }
            toast.success(t('actions.downloadImage'))
        } catch (e) {
            console.error(e)
            window.open(url, '_blank')
        }
    }

    if (images.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">{t('empty.description')}</p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Batch Action Bar */}
            <div className={`fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 transition-all duration-300 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
                }`}>
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-4 md:px-6 md:py-3 flex items-center justify-between md:justify-center gap-4 border border-gray-200/50">
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-700 text-sm whitespace-nowrap">{t('actions.selected', { count: selectedIds.size })}</span>
                        <div className="h-4 w-px bg-gray-200 hidden md:block" />
                        <button
                            onClick={selectAll}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
                        >
                            {selectedIds.size === images.length ? t('actions.deselectAll') : t('actions.selectAll')}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBatchDownload}
                            disabled={isDownloading}
                            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                            {isDownloading ? (
                                <span className="md:hidden">...</span>
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span className="hidden md:inline">
                                {isDownloading ? 'Preparing...' : t('actions.downloadZip')}
                            </span>
                            <span className="md:hidden">
                                {isDownloading ? '...' : 'ZIP'}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedIds(new Set())
                                setIsSelectionMode(false)
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm border ${isSelectionMode
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                >
                    {isSelectionMode ? t('actions.cancel') : t('actions.select')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img) => (
                    <div
                        key={img.id}
                        className={`group bg-white rounded-xl border overflow-hidden transition-all relative ${selectedIds.has(img.id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:shadow-lg'
                            }`}
                        onClick={() => isSelectionMode && toggleSelection(img.id)}
                    >
                        {/* Selection Checkbox Overlay */}
                        {(isSelectionMode || selectedIds.has(img.id)) && (
                            <div className="absolute top-3 left-3 z-20">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.has(img.id)
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white/80 border-gray-300 hover:border-blue-400'
                                    }`}>
                                    {selectedIds.has(img.id) && <CheckSquare className="w-4 h-4" />}
                                </div>
                            </div>
                        )}

                        <div className="relative aspect-[4/3] bg-gray-100">
                            {img.enhanced_url ? (
                                <Image
                                    src={img.enhanced_url}
                                    alt="Enhanced"
                                    fill
                                    className={`object-cover transition-transform duration-500 ${selectedIds.has(img.id) ? 'scale-95' : 'group-hover:scale-105'
                                        }`}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    {img.status === 'FAILED' ? <AlertCircle /> : <div className="animate-pulse bg-gray-200 w-full h-full" />}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${img.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    img.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {img.status}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(img.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {!isSelectionMode && img.enhanced_url && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSingleDownload(img.enhanced_url, `enhanced-${img.id}.jpg`)
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg hover:from-black hover:to-gray-900 transition-all text-sm font-medium shadow-sm active:scale-95 border border-gray-800"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('actions.downloadImage')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
