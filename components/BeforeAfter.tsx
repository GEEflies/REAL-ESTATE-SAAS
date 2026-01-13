'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GripVertical } from 'lucide-react'

import { useTranslations } from 'next-intl'

interface BeforeAfterProps {
    beforeImage: string
    afterImage: string
    beforeLabel?: string
    afterLabel?: string
}

export function BeforeAfter({
    beforeImage,
    afterImage,
    beforeLabel, // remove defaults here
    afterLabel,
}: BeforeAfterProps) {
    const t = useTranslations('Common')
    // Set defaults using translation if props not provided
    const finalBeforeLabel = beforeLabel || t('before')
    const finalAfterLabel = afterLabel || t('after')

    const [sliderPosition, setSliderPosition] = useState(50)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
        setSliderPosition(percentage)
    }, [])

    const handleMouseDown = useCallback(() => {
        isDragging.current = true
    }, [])

    const handleMouseUp = useCallback(() => {
        isDragging.current = false
    }, [])

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging.current) return
            handleMove(e.clientX)
        },
        [handleMove]
    )

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            const touch = e.touches[0]
            handleMove(touch.clientX)
        },
        [handleMove]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            handleMove(e.clientX)
        },
        [handleMove]
    )

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full rounded-2xl overflow-hidden cursor-col-resize select-none shadow-xl"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onClick={handleClick}
        >
            {/* Invisible image to set container aspect ratio based on the 'before' (original) image */}
            <img
                src={beforeImage}
                alt=""
                className="w-full h-auto opacity-0 pointer-events-none"
                aria-hidden="true"
            />

            {/* After Image (Background) - forced to fill container */}
            <div className="absolute inset-0">
                <img
                    src={afterImage}
                    alt={afterLabel}
                    className="w-full h-full"
                    draggable={false}
                />
            </div>

            {/* Before Image (Clipped) - forced to fill container */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt={beforeLabel}
                    className="w-full h-full"
                    draggable={false}
                />
            </div>

            {/* Slider Line */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                {/* Handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {finalBeforeLabel}
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {finalAfterLabel}
            </div>
        </motion.div>
    )
}
