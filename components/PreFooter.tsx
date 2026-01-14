'use client'

import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, PlayCircle } from 'lucide-react'

export function PreFooter() {
    const t = useTranslations('PreFooter')

    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-6">
                    {t('title')}
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    {t('subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/enhance">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105">
                            {t('cta')}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-gray-50">
                        <PlayCircle className="w-5 h-5 mr-2" />
                        {t('demo')}
                    </Button>
                </div>
            </div>
        </section>
    )
}
