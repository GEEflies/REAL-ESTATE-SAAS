'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Eraser, TrendingUp, Image as ImageIcon, Clock, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface Stats {
    imagesEnhanced: number
    imagesRemoved: number
    imagesUsed: number
    imagesQuota: number
}

export default function DashboardHomePage() {
    const t = useTranslations('Dashboard')
    const [stats, setStats] = useState<Stats>({
        imagesEnhanced: 0,
        imagesRemoved: 0,
        imagesUsed: 0,
        imagesQuota: 50,
    })

    useEffect(() => {
        // Fetch user stats
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/user/stats')
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        }
    }

    const quickActions = [
        {
            href: '/dashboard/enhance',
            icon: Sparkles,
            title: t('home.enhance.title'),
            description: t('home.enhance.description'),
            gradient: 'from-blue-500 to-indigo-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            href: '/dashboard/remove',
            icon: Eraser,
            title: t('home.remove.title'),
            description: t('home.remove.description'),
            gradient: 'from-purple-500 to-pink-600',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
    ]

    return (
        <div className="p-6 lg:p-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {t('home.welcome')}
                </h1>
                <p className="text-gray-600">
                    {t('home.subtitle')}
                </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.imagesEnhanced}</p>
                    <p className="text-sm text-gray-500">{t('home.stats.enhanced')}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Eraser className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.imagesRemoved}</p>
                    <p className="text-sm text-gray-500">{t('home.stats.removed')}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {stats.imagesQuota - stats.imagesUsed}
                    </p>
                    <p className="text-sm text-gray-500">{t('home.stats.remaining')}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.imagesUsed}</p>
                    <p className="text-sm text-gray-500">{t('home.stats.total')}</p>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quickActions')}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center`}>
                                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{action.title}</h3>
                            <p className="text-sm text-gray-500">{action.description}</p>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Quota Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">{t('home.quota.title')}</h3>
                        <p className="text-blue-100 text-sm">
                            {t('home.quota.description', { used: stats.imagesUsed, total: stats.imagesQuota })}
                        </p>
                    </div>
                    <Link href="/dashboard/settings">
                        <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                            {t('home.quota.upgrade')}
                        </Button>
                    </Link>
                </div>
                <div className="mt-4">
                    <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${Math.min(100, (stats.imagesUsed / stats.imagesQuota) * 100)}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.recentActivity')}</h2>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('home.noActivity')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('home.startEnhancing')}</p>
                </div>
            </motion.div>
        </div>
    )
}
