import { createClient } from '@supabase/supabase-js'

// A sessão dura apenas enquanto esta guia estiver aberta.
// sessionStorage preserva o login ao atualizar a página, mas não entre sessões novas.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)
