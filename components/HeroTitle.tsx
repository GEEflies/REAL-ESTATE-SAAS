'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function HeroTitle() {
    const t = useTranslations('Home.animatedHero')
    const [index, setIndex] = useState(0)

    // List of keys to corresponding translations
    const phrases = [
        t('rotating.0'),
        t('rotating.1'),
        t('rotating.2'),
        t('rotating.3'),
        t('rotating.4'),
        t('rotating.5'),
        t('rotating.6'),
        t('rotating.7'),
        t('rotating.8'),
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length)
        }, 3000) // 3 seconds per rotation
        return () => clearInterval(interval)
    }, [phrases.length])

    return (
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.2] flex flex-col md:block">
            <span className="text-gray-900 mr-2 md:mr-3">
                {t('static')}
            </span>
            <span className="inline-grid grid-cols-1 grid-rows-1 h-[1.3em] align-top overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={index}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="row-start-1 col-start-1 block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 whitespace-nowrap pl-1"
                    >
                        {phrases[index]}
                    </motion.span>
                </AnimatePresence>

                {/* Invisible duplicate to force width to be the max necessary */}
                <span className="row-start-1 col-start-1 opacity-0 pointer-events-none invisible whitespace-nowrap pl-1" aria-hidden="true">
                    {phrases.sort((a, b) => b.length - a.length)[0]}
                </span>
            </span>
        </h1>
    )
}
