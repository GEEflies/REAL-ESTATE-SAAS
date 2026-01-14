'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function HeroTitle() {
    const t = useTranslations('Home.animatedHero')
    const [index, setIndex] = useState(0)

    // We need to ensure we have the phrases loaded, handled by detection or generic array
    const phrases = [
        t('rotating.0'),
        t('rotating.1'),
        t('rotating.2'),
        t('rotating.3'),
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length)
        }, 3000) // 3 seconds per rotation
        return () => clearInterval(interval)
    }, [phrases.length])

    return (
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.2]">
            <span className="text-gray-900 block md:inline mr-2 md:mr-3">
                {t('static')}
            </span>
            <span className="relative inline-block h-[1.3em] w-full md:w-[450px] align-top overflow-hidden">
                {phrases.map((phrase, i) => (
                    <span
                        key={i}
                        className={cn(
                            "absolute top-0 left-0 w-full h-full block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pl-1",
                            index === i
                                ? "opacity-100 transform-none"
                                : "opacity-0 -translate-x-[50%]"
                        )}
                        style={{
                            willChange: 'transform, opacity',
                            transformOrigin: '50% 50% 0px'
                        }}
                    >
                        {phrase}
                    </span>
                ))}
            </span>
        </h1>
    )
}
