'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, X, AppWindow, CloudSun, Scale, Ruler, Lock, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { EnhanceAddonCheckbox } from './EnhanceAddonCheckbox'
import { useTranslations } from 'next-intl'

export type EnhanceMode = 'full' | 'hdr' | 'window' | 'sky' | 'white_balance' | 'perspective' | 'relighting' | 'raw_quality' | 'privacy' | 'color' | 'coming_soon'
export type EnhanceAddon = 'window' | 'sky' | 'white_balance' | 'perspective' | 'privacy'

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

    selectedAddons: EnhanceAddon[]
    onToggleAddon: (addon: EnhanceAddon) => void

    modes: ModeOption[]
    disabled?: boolean
    modeTitle: string
}

export function EnhanceModeSelector({
    selectedMode,
    onSelectMode,
    selectedAddons,
    onToggleAddon,
    modes,
    disabled = false,
    modeTitle
}: EnhanceModeSelectorProps) {
    const t = useTranslations('Enhance')
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

    const selectedModeInfo = modes.find(m => m.id === selectedMode) || modes[0]

    const handleModeSelect = (modeId: EnhanceMode) => {
        onSelectMode(modeId)
        setIsOpen(false)
    }

    const ADDONS: { id: EnhanceAddon; icon: any; labelKey: string; descKey: string }[] = [
        { id: 'window', icon: AppWindow, labelKey: 'modes.window.label', descKey: 'modes.window.description' },
        { id: 'sky', icon: CloudSun, labelKey: 'modes.sky.label', descKey: 'modes.sky.description' },
        { id: 'white_balance', icon: Scale, labelKey: 'modes.white_balance.label', descKey: 'modes.white_balance.description' },
        { id: 'perspective', icon: Ruler, labelKey: 'modes.perspective.label', descKey: 'modes.perspective.description' },
        { id: 'privacy', icon: Lock, labelKey: 'modes.privacy.label', descKey: 'modes.privacy.description' },
    ]

    return (
        <div className="mb-8 relative max-w-4xl mx-auto">
            {/* Primary Mode Dropdown */}
            <div className="max-w-2xl mx-auto mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
                    {modeTitle}
                </h2>

                {/* Desktop Dropdown Trigger */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className={cn(
                            "w-full bg-white border-2 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all cursor-pointer group",
                            isOpen ? "border-blue-500 ring-4 ring-blue-50" : "border-blue-100 hover:border-blue-300",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {selectedModeInfo && (
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                    "bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100"
                                )}>
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

                    {/* Desktop Dropdown Menu */}
                    <AnimatePresence>
                        {isOpen && !isMobile && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                            >
                                <div className="p-2 space-y-1">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => mode.id !== 'coming_soon' && handleModeSelect(mode.id)}
                                            disabled={mode.id === 'coming_soon'}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all",
                                                mode.id === 'coming_soon'
                                                    ? "opacity-60 cursor-not-allowed bg-gray-50 border border-dashed border-gray-200"
                                                    : selectedMode === mode.id
                                                        ? "bg-blue-50 border border-blue-200 cursor-pointer"
                                                        : "hover:bg-gray-50 border border-transparent cursor-pointer"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                                mode.id === 'coming_soon' ? "bg-gray-100" : (selectedMode === mode.id ? "bg-blue-100" : "bg-gray-100")
                                            )}>
                                                <mode.icon className={cn(
                                                    "w-5 h-5",
                                                    mode.id === 'coming_soon' ? "text-gray-400" : (selectedMode === mode.id ? "text-blue-600" : "text-gray-500")
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-bold text-sm",
                                                    selectedMode === mode.id ? "text-blue-700" : "text-gray-900"
                                                )}>
                                                    {mode.id === 'coming_soon' ? t('modes.coming_soon.label') : mode.label}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {mode.id === 'coming_soon' ? t('modes.coming_soon.description') : mode.description}
                                                </div>
                                            </div>
                                            {selectedMode === mode.id && (
                                                <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Bottom Sheet for Modes */}
            <AnimatePresence>
                {isOpen && isMobile && (
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
                                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-200">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-3 space-y-2 pb-8">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => mode.id !== 'coming_soon' && handleModeSelect(mode.id)}
                                        disabled={mode.id === 'coming_soon'}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all",
                                            mode.id === 'coming_soon'
                                                ? "opacity-60 cursor-not-allowed bg-gray-50 border-2 border-dashed border-gray-200"
                                                : selectedMode === mode.id
                                                    ? "bg-blue-50 border-2 border-blue-500"
                                                    : "hover:bg-gray-50 border-2 border-gray-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                            selectedMode === mode.id ? "bg-blue-100" : "bg-gray-100"
                                        )}>
                                            <mode.icon className={cn("w-5 h-5", selectedMode === mode.id ? "text-blue-600" : "text-gray-500")} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">{mode.label}</div>
                                            <div className="text-xs text-gray-500">{mode.description}</div>
                                        </div>
                                        {selectedMode === mode.id && <Check className="w-5 h-5 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Addon Checkboxes Section */}
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {t('addons.title') || "Optional Add-ons"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {ADDONS.map(addon => (
                        <EnhanceAddonCheckbox
                            key={addon.id}
                            id={addon.id}
                            label={t(addon.labelKey)}
                            description={t(addon.descKey)}
                            icon={addon.icon}
                            checked={selectedAddons.includes(addon.id)}
                            onChange={() => onToggleAddon(addon.id)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
