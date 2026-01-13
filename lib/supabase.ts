
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role Key for server-side admin tasks

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables')
}

// Create a single supabase client for interacting with your database
export const db = createClient(supabaseUrl, supabaseKey)
