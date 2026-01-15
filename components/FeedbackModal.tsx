'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Star, Lightbulb, Send, Loader2, Check, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
    open: boolean
    onClose: () => void
}

type Step = 'welcome' | 'satisfaction' | 'features' | 'message' | 'done'

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
    const t = useTranslations('Feedback')
    const [step, setStep] = useState<Step>('welcome')
    const [satisfaction, setSatisfaction] = useState<number | null>(null)
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const features = [
        { id: 'hdr', label: t('features.hdr') },
        { id: 'sky', label: t('features.sky') },
        { id: 'virtual_staging', label: t('features.virtualStaging') },
        { id: 'remove_objects', label: t('features.removeObjects') },
        { id: 'floor_plans', label: t('features.floorPlans') },
        { id: 'video', label: t('features.video') },
    ]

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    satisfaction,
                    wantedFeatures: selectedFeatures,
                    message: message.trim(),
                }),
            })

            if (!response.ok) throw new Error('Failed to submit')

            setStep('done')
            toast.success(t('successToast'))
        } catch (error) {
            toast.error(t('errorToast'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        // Reset state on close
        setTimeout(() => {
            setStep('welcome')
            setSatisfaction(null)
            setSelectedFeatures([])
            setMessage('')
        }, 300)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <h3 className="font-bold">{t('title')}</h3>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* Welcome Step */}
                        {step === 'welcome' && (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Lightbulb className="w-8 h-8 text-blue-600" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">{t('welcome.title')}</h4>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    {t('welcome.description')}
                                </p>
                                <Button onClick={() => setStep('satisfaction')} className="w-full gap-2">
                                    {t('welcome.start')} <ChevronRight className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Satisfaction Step */}
                        {step === 'satisfaction' && (
                            <motion.div
                                key="satisfaction"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{t('satisfaction.title')}</h4>
                                <p className="text-gray-600 text-sm mb-6">{t('satisfaction.subtitle')}</p>

                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => setSatisfaction(rating)}
                                            className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all border-2",
                                                satisfaction === rating
                                                    ? "bg-yellow-100 border-yellow-400 scale-110"
                                                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                                            )}
                                        >
                                            {rating <= 2 ? '😞' : rating === 3 ? '😐' : rating === 4 ? '🙂' : '🤩'}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                                        {t('back')}
                                    </Button>
                                    <Button
                                        onClick={() => setStep('features')}
                                        disabled={satisfaction === null}
                                        className="flex-1 gap-2"
                                    >
                                        {t('next')} <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Features Step */}
                        {step === 'features' && (
                            <motion.div
                                key="features"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{t('featuresStep.title')}</h4>
                                <p className="text-gray-600 text-sm mb-4">{t('featuresStep.subtitle')}</p>

                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    {features.map((feature) => (
                                        <button
                                            key={feature.id}
                                            onClick={() => toggleFeature(feature.id)}
                                            className={cn(
                                                "p-3 rounded-xl text-left text-sm font-medium transition-all border-2",
                                                selectedFeatures.includes(feature.id)
                                                    ? "bg-blue-50 border-blue-500 text-blue-700"
                                                    : "bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100"
                                            )}
                                        >
                                            {feature.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep('satisfaction')} className="flex-1">
                                        {t('back')}
                                    </Button>
                                    <Button onClick={() => setStep('message')} className="flex-1 gap-2">
                                        {t('next')} <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Message Step */}
                        {step === 'message' && (
                            <motion.div
                                key="message"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{t('messageStep.title')}</h4>
                                <p className="text-gray-600 text-sm mb-4">{t('messageStep.subtitle')}</p>

                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t('messageStep.placeholder')}
                                    className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-sm mb-4"
                                />

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep('features')} className="flex-1">
                                        {t('back')}
                                    </Button>
                                    <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 gap-2">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {t('submit')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Done Step */}
                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-4"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">{t('done.title')}</h4>
                                <p className="text-gray-600 text-sm mb-6">{t('done.description')}</p>
                                <Button onClick={handleClose} className="w-full">
                                    {t('done.close')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
