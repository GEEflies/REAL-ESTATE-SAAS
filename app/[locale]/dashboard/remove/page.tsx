'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Eraser, Trash2, Plus, AlertCircle, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { get, set, del } from 'idb-keyval'

import { Button } from '@/components/ui/button'
import { ImageDropzone } from '@/components/ImageDropzone'
import { compressImage } from '@/lib/utils'
import { supabaseAuth } from '@/lib/supabase-auth'
import { PaywallGate } from '@/components/PaywallGate'

type QueueItem = {
    id: string
    file: File
    preview: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    resultUrl?: string
    error?: string
}

export default function DashboardRemovePage() {
    const t = useTranslations('Remove')
    const tToast = useTranslations('Toasts')

    const [queue, setQueue] = useState<QueueItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [isLoaded, setIsLoaded] = useState(false)
    const [showPaywall, setShowPaywall] = useState(false)

    // Load queue from IndexedDB
    useEffect(() => {
        get('remove-queue').then((val) => {
            if (val) {
                setQueue(val)
                // Reset processing items
                const hasProcessing = val.some((i: QueueItem) => i.status === 'processing')
                if (hasProcessing) {
                    setQueue(prev => prev.map(i => i.status === 'processing' ? { ...i, status: 'pending' } : i))
                }
            }
            setIsLoaded(true)
        })
    }, [])

    // Save queue to IndexedDB
    useEffect(() => {
        if (isLoaded) {
            set('remove-queue', queue)
        }
    }, [queue, isLoaded])

    // Warn on unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isProcessing || queue.some(i => i.status === 'pending')) {
                e.preventDefault()
                e.returnValue = ''
                return ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isProcessing, queue])

    const handleImagesSelect = async (files: File[]) => {
        if (queue.length + files.length > 20) {
            toast.error(tToast('limitExceeded'))
            return
        }

        const newItems: QueueItem[] = []
        for (const file of files) {
            const reader = new FileReader()
            const preview = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })

            newItems.push({
                id: Math.random().toString(36).substring(7),
                file,
                preview,
                status: 'pending'
            })
        }
        setQueue(prev => [...prev, ...newItems])
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImagesSelect(Array.from(e.target.files))
            e.target.value = ''
        }
    }

    const processQueue = async () => {
        if (!prompt.trim()) {
            toast.error(tToast('enterPrompt') || 'Please describe what to remove')
            return
        }

        setIsProcessing(true)
        const idsToProcess = queue.filter(q => q.status === 'pending').map(q => q.id)

        for (const id of idsToProcess) {
            const currentItem = queue.find(q => q.id === id)
            if (!currentItem || currentItem.status !== 'pending') continue

            setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i))

            try {
                const { base64, mimeType } = await compressImage(currentItem.file, 4, 2048)
                const { data: { session } } = await supabaseAuth.auth.getSession()
                const token = session?.access_token

                const response = await fetch('/api/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        image: base64,
                        mimeType: mimeType,
                        objectToRemove: prompt.trim(),
                    }),
                })

                if (!response.ok) {
                    const errorJson = await response.json()

                    if (response.status === 403 && errorJson.error === 'QUOTA_EXCEEDED') {
                        setIsProcessing(false)
                        setShowPaywall(true)
                        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'pending' } : i))
                        toast.error(errorJson.message || 'Quota exceeded')
                        return
                    }

                    throw new Error(errorJson.message || 'Failed to process')
                }

                const data = await response.json()
                const resultUrl = data.result // api/remove returns { result: base64/url }

                setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', resultUrl } : i))

                window.dispatchEvent(new Event('quotaUpdated'))

            } catch (error) {
                console.error(error)
                setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: 'Failed' } : i))
            }
        }
        setIsProcessing(false)
        if (queue.some(i => i.status === 'completed')) {
            toast.success(tToast('processSuccess') || 'Processing complete!')
        }
    }

    const removeQueueItem = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id))
    }

    const clearQueue = () => {
        setQueue([])
        setIsProcessing(false)
        del('remove-queue')
    }

    if (!isLoaded) return null

    return (
        <div className="p-4 lg:p-8">
            <PaywallGate
                open={showPaywall}
                onClose={() => setShowPaywall(false)}
                defaultTab="payPerImage"
                showOnlyPayPerImage={true}
            />

            {/* Header */}
            <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                    <Eraser className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
            </div>

            {/* Removal Prompt Input (Redesigned) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-1 mb-8 shadow-sm max-w-3xl">
                <div className="relative">
                    <div className="absolute top-5 left-5 pointer-events-none">
                        <Wand2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('prompt.placeholder')}
                        className="w-full min-h-[100px] pl-14 pr-4 py-4 rounded-xl border-none focus:ring-0 text-lg placeholder:text-gray-400 resize-none bg-transparent"
                        disabled={isProcessing || queue.some(i => i.status === 'processing')}
                    />
                    <div className="px-5 pb-4 flex justify-between items-center border-t border-gray-100 pt-3">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {t('prompt.batchHint')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Queue UI */}
            {queue.length === 0 ? (
                <div className="space-y-8">
                    <ImageDropzone
                        onImagesSelect={handleImagesSelect}
                        multiple={true}
                        maxFiles={20}
                        disabled={isProcessing}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {queue.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden relative group">
                                <div className="aspect-video relative bg-gray-100">
                                    <Image
                                        src={item.status === 'completed' && item.resultUrl ? item.resultUrl : item.preview}
                                        alt="Img"
                                        fill
                                        className="object-cover"
                                    />
                                    {item.status === 'processing' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                    {item.status === 'error' && (
                                        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center text-white font-bold">{t('errorLabel')}</div>
                                    )}
                                    {item.status === 'completed' && (
                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-2">
                                                <Eraser className="w-5 h-5 text-green-600" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeQueueItem(item.id)
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-red-500 backdrop-blur-sm rounded-full text-white transition-colors z-20"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <span className="text-xs font-mono truncate max-w-[100px]">{item.file.name}</span>
                                    {item.status === 'completed' && item.resultUrl ? (
                                        <a href={item.resultUrl} download target="_blank" className="text-blue-600 hover:text-blue-800">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    ) : item.status === 'pending' && !isProcessing ? (
                                        <button onClick={() => removeQueueItem(item.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}


                    </div>

                    <div className="flex justify-end gap-4 sticky bottom-6 ml-auto w-fit z-40">
                        <Button
                            onClick={processQueue}
                            disabled={isProcessing || queue.filter(i => i.status === 'pending').length === 0 || !prompt.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 w-48"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {t('processing')}
                                </>
                            ) : (
                                <>
                                    <Eraser className="w-4 h-4 mr-2" />
                                    {t('removeButton')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
