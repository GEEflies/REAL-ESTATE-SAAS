'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail } from 'lucide-react'
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
            <DialogContent className="sm:max-w-md [&>button]:hidden"> {/* Hide close button */}
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">{t('emailTitle')}</DialogTitle>
                    <DialogDescription className="text-center">
                        {t('emailSubtitle')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-lg py-6"
                    />
                    <Button
                        type="submit"
                        className="w-full text-lg py-6"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('emailButton')}
                    </Button>
                </form>
                <DialogFooter className="sm:justify-center">
                    <p className="text-xs text-gray-400 text-center">
                        {t('promise')}
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
