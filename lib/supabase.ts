
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Missing Supabase environment variables - functionality will be limited')
}

// Create a single supabase client for interacting with your database
export const db = createClient(supabaseUrl, supabaseKey)
