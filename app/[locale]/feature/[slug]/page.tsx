'use client'

import { ImageCompareSlider } from '@/components/ImageCompareSlider'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface FeaturePageProps {
    params: {
        slug: string
        locale: string
    }
}

// Map slugs to image paths
const featureImages: Record<string, { before: string; after: string }> = {
    'sky-replacement': {
        before: '/landing/sky replacement/sky-before.jpeg',
        after: '/landing/sky replacement/sky-after.jpeg'
    },
    'perspective-correction': {
        before: '/landing/perspective correction/prsp-before.jpeg',
        after: '/landing/perspective correction/prsp-after.jpeg'
    },
    'hdr-merge': {
        before: '/landing/hdr merging/hdr-before.jpg',
        after: '/landing/hdr merging/hdr-after.jpeg'
    },
    'window-pulling': {
        before: '/landing/window pulling/wp-before.jpg',
        after: '/landing/window pulling/wp-after.jpeg'
    },
    'white-balance': {
        before: '/landing/white balance/wb-before.jpg',
        after: '/landing/white balance/wb-after.jpeg'
    },
    'image-relighting': {
        before: '/landing/relighting/religh-before.jpg',
        after: '/landing/relighting/religh-after.jpg'
    },
    'raw-support': {
        before: '/landing/raw/raw-before.jpg',
        after: '/landing/raw/raw-after.jpg'
    },
    'auto-privacy': {
        before: '/landing/privacy/privacy-before.jpeg',
        after: '/landing/privacy/privacy-after.jpeg'
    }
}

export default function FeaturePage({ params }: FeaturePageProps) {
    const { slug } = params
    const t = useTranslations(`FeaturePages.${slug}`)

    const images = featureImages[slug] || featureImages['sky-replacement'] // Fallback

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-6">
                                {t('title')}
                            </h1>
                            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto lg:mx-0">
                                {t('description')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/enhance">
                                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all">
                                        {t('cta')}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <ImageCompareSlider
                                beforeImage={images.before}
                                afterImage={images.after}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">
                        {t('benefitsTitle')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">{t('benefit1.title')}</h3>
                            <p className="text-gray-600">{t('benefit1.desc')}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">{t('benefit2.title')}</h3>
                            <p className="text-gray-600">{t('benefit2.desc')}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-lg mb-2">{t('benefit3.title')}</h3>
                            <p className="text-gray-600">{t('benefit3.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
