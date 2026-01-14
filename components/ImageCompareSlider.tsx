'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface ImageCompareSliderProps {
    beforeImage: string
    afterImage: string
    beforeAlt?: string
    afterAlt?: string
    className?: string
}

export function ImageCompareSlider({
    beforeImage,
    afterImage,
    beforeAlt = 'Before',
    afterAlt = 'After',
    className = '',
}: ImageCompareSliderProps) {
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

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return
        handleMove(e.clientX)
    }, [handleMove])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX)
    }, [handleMove])

    const handleClick = useCallback((e: React.MouseEvent) => {
        handleMove(e.clientX)
    }, [handleMove])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-xl cursor-ew-resize select-none ${className}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={handleClick}
        >
            {/* After Image (Background) */}
            <div className="relative w-full aspect-[4/3]">
                <Image
                    src={afterImage}
                    alt={afterAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                />
            </div>

            {/* Before Image (Clipped) */}
            <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <Image
                    src={beforeImage}
                    alt={beforeAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                {/* Handle Circle with Arrows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5">
                    <svg
                        className="w-3 h-3 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    <svg
                        className="w-3 h-3 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </div>
            </div>
        </div>
    )
}
