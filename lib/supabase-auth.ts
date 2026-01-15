import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client with Auth capabilities
// Uses the anon key which is safe to expose on client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables for auth - some features will be limited')
}

// Custom storage provider to share session between subdomains (www and app)
const customCookieStorage = {
    getItem: (key: string) => {
        if (typeof document === 'undefined') return null
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
        return match ? decodeURIComponent(match[2]) : null
    },
    setItem: (key: string, value: string) => {
        if (typeof document === 'undefined') return
        // In production, share cookie across all subdomains (.aurix.pics)
        // In development (localhost), use the exact hostname
        const hostname = window.location.hostname
        const isProd = hostname.includes('aurix.pics')
        const domainProp = isProd ? '; domain=.aurix.pics' : ''
        const secureProp = window.location.protocol === 'https:' ? '; Secure' : ''

        document.cookie = `${key}=${encodeURIComponent(value)}${domainProp}; path=/; max-age=31536000; SameSite=Lax${secureProp}`
    },
    removeItem: (key: string) => {
        if (typeof document === 'undefined') return
        const hostname = window.location.hostname
        const isProd = hostname.includes('aurix.pics')

        // Clear for shared domain
        if (isProd) {
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.aurix.pics`
        }

        // Also clear for current host (just in case)
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
}

export const supabaseAuth = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: customCookieStorage,
        },
    }
)

// Helper to get current session
export async function getSession() {
    const { data: { session }, error } = await supabaseAuth.auth.getSession()
    if (error) {
        console.error('Error getting session:', error)
        return null
    }
    return session
}

// Helper to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabaseAuth.auth.getUser()
    if (error) {
        console.error('Error getting user:', error)
        return null
    }
    return user
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
            data: metadata, // Store tier/quota info in user metadata
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.aurix.pics'}/verify-email`,
        },
    })
    return { data, error }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
    })
    return { data, error }
}

// Sign in with Google OAuth
export async function signInWithGoogle(redirectTo?: string) {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.aurix.pics'}/dashboard`,
        },
    })
    return { data, error }
}

// Sign out
export async function signOut() {
    const { error } = await supabaseAuth.auth.signOut()
    return { error }
}

// Verify email token (for email confirmation)
export async function verifyEmailToken(token: string, type: 'signup' | 'email_change' = 'signup') {
    const { data, error } = await supabaseAuth.auth.verifyOtp({
        token_hash: token,
        type,
    })
    return { data, error }
}

// Listen for auth state changes
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabaseAuth.auth.onAuthStateChange(callback)
}
