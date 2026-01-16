'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color' | 'coming_soon'

interface ModeOption {
    id: EnhanceMode
    icon: any
    label: string
    description: string
    bgGradient?: string
    borderColor?: string
}

interface EnhanceModeSelectorProps {
    selectedMode: EnhanceMode
    onSelectMode: (mode: EnhanceMode) => void
    modes: ModeOption[]
    disabled?: boolean
    modeTitle: string
}

export function EnhanceModeSelector({
    selectedMode,
    onSelectMode,
    modes,
    disabled = false,
    modeTitle
}: EnhanceModeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen && !isMobile) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, isMobile])

    const selectedModeInfo = modes.find(m => m.id === selectedMode)

    const handleModeSelect = (modeId: EnhanceMode) => {
        onSelectMode(modeId)
        setIsOpen(false)
    }

    return (
        <div className="mb-8 relative max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
                {modeTitle}
            </h2>

            {/* Desktop Dropdown */}
            {!isMobile && (
                <div className="relative max-w-2xl mx-auto" ref={dropdownRef}>
                    {/* Trigger Button */}
                    <button
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className={cn(
                            "w-full bg-white border-2 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all cursor-pointer",
                            isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-100 hover:border-blue-200",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {selectedModeInfo && (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                    <selectedModeInfo.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900 text-lg">{selectedModeInfo.label}</div>
                                    <div className="text-sm text-gray-500">{selectedModeInfo.description}</div>
                                </div>
                            </div>
                        )}
                        <ChevronDown className={cn(
                            "w-5 h-5 text-gray-400 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-100 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto"
                            >
                                <div className="p-2">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => mode.id !== 'coming_soon' && handleModeSelect(mode.id)}
                                            disabled={mode.id === 'coming_soon'}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all",
                                                mode.id === 'coming_soon'
                                                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-2 border-dashed border-gray-200"
                                                    : selectedMode === mode.id
                                                        ? "bg-blue-50 border-2 border-blue-500 cursor-pointer"
                                                        : "hover:bg-gray-50 border-2 border-transparent cursor-pointer"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                                selectedMode === mode.id ? "bg-blue-100" : "bg-gray-100"
                                            )}>
                                                <mode.icon className={cn(
                                                    "w-6 h-6",
                                                    selectedMode === mode.id ? "text-blue-600" : "text-gray-500"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-bold",
                                                    selectedMode === mode.id ? "text-blue-700" : "text-gray-900"
                                                )}>
                                                    {mode.label}
                                                </div>
                                                <div className="text-sm text-gray-500">{mode.description}</div>
                                            </div>
                                            {selectedMode === mode.id && (
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Mobile Bottom Sheet */}
            {isMobile && selectedModeInfo && (
                <>
                    <div className="px-4">
                        <button
                            onClick={() => !disabled && setIsOpen(true)}
                            disabled={disabled}
                            className={cn(
                                "w-full bg-white border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <selectedModeInfo.icon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900">{selectedModeInfo.label}</div>
                                    <div className="text-xs text-gray-500">{selectedModeInfo.description}</div>
                                </div>
                            </div>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Mobile Action Sheet */}
                    <AnimatePresence>
                        {isOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                                    onClick={() => setIsOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 100 }}
                                    className="fixed bottom-0 left-0 w-full z-[70] bg-white rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                                >
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                        <h3 className="font-bold text-gray-900 text-lg">{modeTitle}</h3>
                                        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto p-2 pb-8">
                                        {modes.map((mode) => (
                                            <button
                                                key={mode.id}
                                                onClick={() => mode.id !== 'coming_soon' && handleModeSelect(mode.id)}
                                                disabled={mode.id === 'coming_soon'}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 rounded-xl mb-1 text-left transition-all",
                                                    mode.id === 'coming_soon'
                                                        ? "opacity-50 cursor-not-allowed bg-gray-50 border-2 border-dashed border-gray-200"
                                                        : selectedMode === mode.id
                                                            ? "bg-blue-50 border-2 border-blue-500 shadow-sm cursor-pointer"
                                                            : "hover:bg-gray-50 border-2 border-transparent cursor-pointer"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <mode.icon className={cn("w-6 h-6", selectedMode === mode.id ? "text-blue-600" : "text-gray-500")} />
                                                    <div>
                                                        <div className={cn("font-bold", selectedMode === mode.id ? "text-blue-700" : "text-gray-900")}>
                                                            {mode.label}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{mode.description}</div>
                                                    </div>
                                                </div>
                                                {selectedMode === mode.id && (
                                                    <Check className="w-5 h-5 text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    )
}
