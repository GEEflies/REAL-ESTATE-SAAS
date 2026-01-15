'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface EmailGateProps {
    open: boolean
    onSuccess: () => void
}

export function EmailGate({ open, onSuccess }: EmailGateProps) {
    const t = useTranslations('Gates')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !email.includes('@')) return

        setLoading(true)
        try {
            const response = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) throw new Error('Failed to register')

            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md w-[95vw] max-w-[400px] overflow-hidden p-0 border-0 shadow-2xl rounded-2xl">
                <div className="bg-gradient-to-b from-blue-50 to-white px-6 pt-8 pb-6 text-center">
                    <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center mb-4 sm:mb-6">
                        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">{t('emailTitle')}</DialogTitle>
                    <DialogDescription className="text-gray-600 text-sm sm:text-base max-w-[280px] mx-auto">
                        {t('emailSubtitle')}
                    </DialogDescription>
                </div>

                <div className="px-6 pb-6 sm:pb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 sm:h-14 text-base sm:text-lg px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('emailButton')}
                        </Button>
                    </form>
                    <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-green-500" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('promise')}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
