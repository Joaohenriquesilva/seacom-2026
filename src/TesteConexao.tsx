import { useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function TesteConexao() {
  useEffect(() => {
    let active = true;
    async function testar() {
      console.info('[SEACOM] Iniciando teste do Supabase...');
      try {
        const { data, error } = await supabase.from('activities').select('id').limit(1);
        if (!active) return;
        if (error) console.error('[SEACOM] Erro na consulta:', error.message);
        else console.info('[SEACOM] Supabase conectado com sucesso!', data);
      } catch (error) {
        if (active) console.error('[SEACOM] Falha de rede:', error);
      }
    }
    void testar();
    return () => { active = false; };
  }, []);
  return null;
}
