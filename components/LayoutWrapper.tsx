'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'

interface LayoutWrapperProps {
    children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname()
    const isDashboard = pathname?.includes('/dashboard')

    return (
        <>
            {!isDashboard && <Navbar />}
            <main className={!isDashboard ? "pt-16 min-h-screen" : "min-h-screen"}>
                {children}
            </main>
        </>
    )
}
