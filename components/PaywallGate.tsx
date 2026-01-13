'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/navigation'

interface PaywallGateProps {
    open: boolean
}

export function PaywallGate({ open }: PaywallGateProps) {
    const t = useTranslations('Gates')
    const router = useRouter()

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                        <Crown className="w-6 h-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">{t('limitTitle')}</DialogTitle>
                    <DialogDescription className="text-center">
                        {t('limitSubtitle')}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <Button
                        onClick={() => router.push('/#pricing')}
                        className="w-full text-lg py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0"
                    >
                        {t('limitButton')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
