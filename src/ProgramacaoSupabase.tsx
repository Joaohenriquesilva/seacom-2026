
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Atividade = {
  id: string
  title: string
  description: string | null
  activity_type: string
  starts_at: string
  ends_at: string
  location: string | null
  capacity: number | null
}

export default function ProgramacaoSupabase() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarAtividades() {
      const { data, error } = await supabase
        .from('activities')
        .select(
          'id, title, description, activity_type, starts_at, ends_at, location, capacity'
        )
        .eq('is_published', true)
        .order('starts_at', { ascending: true })

      if (error) {
        setErro(error.message)
      } else {
        setAtividades(data ?? [])
      }

      setCarregando(false)
    }

    carregarAtividades()
  }, [])

  if (carregando) {
    return <p>Carregando programação...</p>
  }

  if (erro) {
    return <p>Erro ao carregar programação: {erro}</p>
  }

  if (atividades.length === 0) {
    return <p>Nenhuma atividade publicada no momento.</p>
  }

  return (
    <section>
      <h2>Programação da SEACOM 2026</h2>

      {atividades.map((atividade) => (
        <article key={atividade.id}>
          <h3>{atividade.title}</h3>

          <p>{atividade.description}</p>

          <p>
            Tipo: {atividade.activity_type}
          </p>

          <p>
            Data e horário:{' '}
            {new Date(atividade.starts_at).toLocaleString(
              'pt-BR',
              { timeZone: 'America/Rio_Branco' }
            )}
          </p>

          <p>Local: {atividade.location ?? 'A definir'}</p>

          <p>
            Vagas: {atividade.capacity ?? 'Sem limite definido'}
          </p>
        </article>
      ))}
    </section>
  )
}
