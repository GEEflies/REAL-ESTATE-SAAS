'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Sparkles, RotateCcw, Check, ChevronDown, X, Layers, AppWindow, CloudSun, Scale, Ruler, Lightbulb, Camera, Lock, Palette, Trash2, ArrowRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { get, set, del } from 'idb-keyval'

import { Button } from '@/components/ui/button'
import { ImageDropzone } from '@/components/ImageDropzone'
import { compressImage, cn } from '@/lib/utils'
import { supabaseAuth } from '@/lib/supabase-auth'
import { PaywallGate } from '@/components/PaywallGate'
import { createClient } from '@supabase/supabase-js'
import { EnhanceModeSelector } from '@/components/EnhanceModeSelector'

type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color'

interface ModeOption {
    id: EnhanceMode
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
}

type QueueItem = {
    id: string
    file: File
    preview: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    enhancedUrl?: string
    error?: string
}

export default function DashboardEnhancePage() {
    const t = useTranslations('Enhance')
    const tToast = useTranslations('Toasts')

    const [queue, setQueue] = useState<QueueItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedMode, setSelectedMode] = useState<EnhanceMode>('full')
    const [isLoaded, setIsLoaded] = useState(false)

    // Supabase client for insert (History logic)
    // We utilize the client-side supabaseAuth but creating a fresh client if needed or reuse
    // We already have supabaseAuth imported.

    // Removed mobile check effect - handled by EnhanceModeSelector component

    // Load queue from IndexedDB on mount
    useEffect(() => {
        get('enhance-queue').then((val) => {
            if (val) {
                // Deserialize if needed (idb handles Files/Blobs natively)
                setQueue(val)
                // If there were processing items, reset them to pending or error because process was interrupted
                const hasProcessing = val.some((i: QueueItem) => i.status === 'processing')
                if (hasProcessing) {
                    setQueue(prev => prev.map(i => i.status === 'processing' ? { ...i, status: 'pending' } : i))
                    toast.info("Restored previous session. Processing paused.")
                }
            }
            setIsLoaded(true)
        })
    }, [])

    // Save queue to IndexedDB on change (debounce slightly implicitly by React effect)
    useEffect(() => {
        if (isLoaded) {
            set('enhance-queue', queue)
        }
    }, [queue, isLoaded])

    // Warn on reload if processing
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

    const handleImagesSelect = async (files: File[]) => {
        if (queue.length + files.length > 20) {
            toast.error("Maximum 20 images limit exceeded")
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

    const [showPaywall, setShowPaywall] = useState(false)

    // ... (existing effects)

    const processQueue = async () => {
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

                const response = await fetch('/api/enhance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        image: base64,
                        mimeType: mimeType,
                        mode: selectedMode,
                    }),
                })

                if (!response.ok) {
                    const errorJson = await response.json()

                    // Check for Quota Exceeded
                    if (response.status === 403 && errorJson.error === 'QUOTA_EXCEEDED') {
                        setIsProcessing(false) // Stop processing immediately
                        setShowPaywall(true) // Show Paywall

                        // Mark current as pending again so they can retry after paying? 
                        // Or error it? Let's leave it processing/pending state or reset it.
                        // Better to reset this item to pending so they can click start again.
                        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'pending' } : i))

                        toast.error(errorJson.message || "Quota exceeded")
                        return // Exit function completely
                    }

                    throw new Error(errorJson.message || tToast('enhanceError'))
                }

                const data = await response.json()
                const enhancedUrl = data.upscaled || data.enhanced

                setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', enhancedUrl } : i))

            } catch (error) {
                console.error(error)
                setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: 'Failed' } : i))
            }
        }
        setIsProcessing(false)
        if (queue.some(i => i.status === 'completed')) {
            toast.success(tToast('enhanceSuccess'))
        }
    }

    const removeQueueItem = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id))
    }

    const clearQueue = () => {
        setQueue([])
        setIsProcessing(false)
        del('enhance-queue')
    }

    const selectedModeInfo = ENHANCE_MODES.find(m => m.id === selectedMode)

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
            <div className="mb-8">
                {/* ... rest of existing render ... */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('badge')}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h1>
                <p className="text-gray-600">
                    {t('batch.title')} - {queue.length}/20 {t('selected')}
                </p>
            </div>

            {/* Mode Selection */}
            <EnhanceModeSelector
                selectedMode={selectedMode}
                onSelectMode={setSelectedMode}
                modes={ENHANCE_MODES}
                disabled={isProcessing || queue.some(i => i.status !== 'pending')}
                modeTitle={t('modeTitle')}
            />

            {/* Queue UI */}
            {queue.length === 0 ? (
                <ImageDropzone
                    onImagesSelect={handleImagesSelect}
                    multiple={true}
                    maxFiles={20}
                    disabled={isProcessing}
                />
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {queue.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden relative group">
                                <div className="aspect-video relative bg-gray-100">
                                    <Image src={item.status === 'completed' && item.enhancedUrl ? item.enhancedUrl : item.preview} alt="Img" fill className="object-cover" />
                                    {item.status === 'processing' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                    {item.status === 'error' && (
                                        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center text-white font-bold">Error</div>
                                    )}
                                    {item.status === 'completed' && (
                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-2">
                                                <Check className="w-5 h-5 text-green-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <span className="text-xs font-mono truncate max-w-[100px]">{item.file.name}</span>
                                    {item.status === 'completed' && item.enhancedUrl ? (
                                        <a href={item.enhancedUrl} download target="_blank" className="text-blue-600 hover:text-blue-800">
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

                        {/* New Item Placeholder to Add More */}
                        {queue.length < 20 && !isProcessing && (
                            <div className="relative border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center aspect-video cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors group">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileInput}
                                    className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer"
                                    disabled={isProcessing}
                                />
                                <div className="text-center pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">{t('batch.addMore')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 sticky bottom-6 ml-auto w-fit bg-white/80 p-4 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 z-40">
                        <Button variant="ghost" onClick={clearQueue} disabled={isProcessing} className="w-32">
                            {t('batch.clearAll')}
                        </Button>
                        <Button
                            onClick={processQueue}
                            disabled={isProcessing || queue.filter(i => i.status === 'pending').length === 0}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 w-48"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {t('batch.processing')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {t('batch.start')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
