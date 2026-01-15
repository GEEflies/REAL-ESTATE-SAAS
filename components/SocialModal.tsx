'use client'

import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

interface SocialModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SocialModal({ isOpen, onClose }: SocialModalProps) {
    const t = useTranslations('SocialModal')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Content */}
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('title')}
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {t.rich('message', {
                            email: (chunks) => (
                                <a
                                    href={`mailto:${t('email')}`}
                                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                >
                                    {chunks}
                                </a>
                            )
                        })}
                    </p>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    )
}
