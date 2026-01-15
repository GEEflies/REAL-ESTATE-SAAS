'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface QuotaBarProps {
    used: number
    limit: number
    tier: 'FREE' | 'STARTER' | 'PRO'
    showUpgrade?: boolean
}

const tierColors = {
    FREE: 'secondary',
    STARTER: 'default',
    PRO: 'success',
} as const

import { useTranslations } from 'next-intl'

export function QuotaBar({ used, limit, tier, showUpgrade = true }: QuotaBarProps) {
    const t = useTranslations('quota')
    const percentage = (used / limit) * 100
    const isNearLimit = percentage >= 80
    const isAtLimit = used >= limit

    return (
        <div className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{t('monthlyUsage')}</span>
                    <Badge variant={tierColors[tier]}>{tier}</Badge>
                </div>
                <span className="text-sm text-gray-500">
                    <span className={isAtLimit ? 'text-red-500 font-semibold' : 'font-semibold text-gray-900'}>
                        {used}
                    </span>
                    {' / '}
                    {limit} images
                </span>
            </div>

            <Progress value={used} max={limit} className="mb-3" />

            {isAtLimit && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('reachedLimit')}</span>
                </div>
            )}

            {isNearLimit && !isAtLimit && (
                <div className="flex items-center gap-2 text-amber-500 text-sm mb-3">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('nearLimit')}</span>
                </div>
            )}

            {showUpgrade && tier !== 'PRO' && (
                <Link
                    href="/#pricing"
                    className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('upgrade')}</span>
                </Link>
            )}
        </div>
    )
}
