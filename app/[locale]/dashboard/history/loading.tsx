'use client'

import { Loader2 } from 'lucide-react'

export default function HistoryLoading() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6 animate-pulse" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="aspect-video bg-gray-100 animate-pulse" />
                        <div className="p-4">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center mt-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
        </div>
    )
}
