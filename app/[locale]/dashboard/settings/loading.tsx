'use client'

import { Loader2 } from 'lucide-react'

export default function SettingsLoading() {
    return (
        <div className="p-4 lg:p-8">
            <div className="mb-8">
                <div className="h-8 w-24 bg-gray-200 rounded-full mb-4 animate-pulse" />
                <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2 animate-pulse" />
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="flex gap-2 mb-8">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
        </div>
    )
}
