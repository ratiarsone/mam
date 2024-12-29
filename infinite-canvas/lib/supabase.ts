import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing environment variable: SUPABASE_URL')
}

if (!process.env.SUPABASE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_KEY')
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Add a test function to verify connection
export async function testConnection() {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Supabase connection test failed:', error)
    return false
  }

  return true
}

