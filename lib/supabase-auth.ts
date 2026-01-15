import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client with Auth capabilities
// Uses the anon key which is safe to expose on client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables for auth - some features will be limited')
}

export const supabaseAuth = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
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
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
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
            redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
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
