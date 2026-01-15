import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Download, Clock } from 'lucide-react'
import { HistoryGrid } from '@/components/HistoryGrid'

export default async function HistoryPage() {
    const t = await getTranslations('Dashboard.history')
    const tToasts = await getTranslations('Toasts')
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-center">{tToasts('loginRequired')}</div>
    }

    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-6 max-w-7xl mx-auto">


            <HistoryGrid initialImages={images || []} />
        </div>
    )
}
