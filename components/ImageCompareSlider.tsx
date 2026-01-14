'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        isDragging.current = true
        // Prevent page scroll when starting touch on slider
        e.preventDefault()
        handleMove(e.touches[0].clientX)
    }, [handleMove])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) return
        // Prevent page scroll during slider drag
        e.preventDefault()
        handleMove(e.touches[0].clientX)
    }, [handleMove])

    const handleClick = useCallback((e: React.MouseEvent) => {
        handleMove(e.clientX)
    }, [handleMove])

    // Track loading state for both images
    const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false })
    const allImagesLoaded = imagesLoaded.before && imagesLoaded.after

    // Global mouse event handlers
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            handleMove(e.clientX)
        }

        const handleGlobalMouseUp = () => {
            isDragging.current = false
        }

        // Global touch handlers for smooth dragging
        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return
            e.preventDefault()
            handleMove(e.touches[0].clientX)
        }

        const handleGlobalTouchEnd = () => {
            isDragging.current = false
        }

        document.addEventListener('mousemove', handleGlobalMouseMove)
        document.addEventListener('mouseup', handleGlobalMouseUp)
        document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
        document.addEventListener('touchend', handleGlobalTouchEnd)

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
            document.removeEventListener('touchmove', handleGlobalTouchMove)
            document.removeEventListener('touchend', handleGlobalTouchEnd)
        }
    }, [handleMove])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-xl cursor-ew-resize select-none ${className} bg-gray-100 transition-opacity duration-500 ease-in-out ${allImagesLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onClick={handleClick}
        >
            {/* AfterImage (Background) */}
            <div className="relative w-full aspect-[4/3]">
                <Image
                    src={afterImage}
                    alt={afterAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, after: true }))}
                />
            </div>

            {/* Before Image (Clipped) */}
            <div
                className="absolute inset-0"
                style={{
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                    willChange: 'clip-path'
                }}
            >
                <Image
                    src={beforeImage}
                    alt={beforeAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, before: true }))}
                />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{
                    left: `${sliderPosition}%`,
                    transform: 'translateX(-50%)',
                    willChange: 'left, transform'
                }}
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
