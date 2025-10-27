
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://chyrdulcwxkcqhugzpiy.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'REPLACE_WITH_YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnon)
