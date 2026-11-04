import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
export const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

let client = null
let configurationError = ''
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY) no arquivo .env.local e reinicie o servidor.')
  }
  client = createClient(supabaseUrl, supabaseKey, {
    auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
} catch (error) {
  configurationError = error instanceof Error ? error.message : 'Não foi possível iniciar a conexão com o Supabase.'
}

// A ausência de configuração não impede a abertura das páginas públicas.
export const supabase = client
export const supabaseConfigurationError = configurationError
