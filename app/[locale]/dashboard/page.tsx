'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Eraser, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DashboardHomePage() {
    const t = useTranslations('Dashboard')

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] lg:min-h-screen p-6 max-w-4xl mx-auto">
            {/* Centered Welcome */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-900/10">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                    {t('home.welcome')}
                </h1>
                <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
                    {t('home.subtitle')}
                </p>
            </motion.div>

            {/* Simple Actions Actions */}
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
                <Link href="/dashboard/enhance" className="group">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="h-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-200 rounded-2xl p-8 transition-all hover:shadow-lg hover:shadow-blue-900/5 text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.enhance.title')}</h3>
                        <p className="text-gray-500 leading-relaxed mb-4">{t('home.enhance.description')}</p>
                        <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                            {t('home.enhance.cta')} <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </motion.div>
                </Link>

                <Link href="/dashboard/remove" className="group">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="h-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-200 rounded-2xl p-8 transition-all hover:shadow-lg hover:shadow-purple-900/5 text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Eraser className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.remove.title')}</h3>
                        <p className="text-gray-500 leading-relaxed mb-4">{t('home.remove.description')}</p>
                        <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                            {t('home.remove.cta')} <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Footer / Quote */}
            <footer className="mt-12 text-center text-sm text-gray-400 py-8 border-t border-gray-100">
                {t('home.tagline')} • Aurix v1.0
            </footer>
        </div>
    )
}
