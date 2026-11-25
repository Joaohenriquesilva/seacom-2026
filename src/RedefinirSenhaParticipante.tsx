import React, { useEffect, useState } from 'react';
import { createParticipantClient } from './lib/participantAuth';

const registrationPage = '/#/register';
const invalidLink = 'Link inválido, expirado ou já utilizado. Solicite um novo link na página de inscrições.';

function readRecoveryLink() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const tokenHash = params.get('token_hash');
  if (tokenHash) return { tokenHash } as const;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (params.get('type') === 'recovery' && accessToken && refreshToken) {
    return { accessToken, refreshToken } as const;
  }
  return null;
}

export default function RedefinirSenhaParticipante() {
  const [link] = useState(readRecoveryLink);
  const [client] = useState(createParticipantClient);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [verified, setVerified] = useState(false);
  const [invalid, setInvalid] = useState(!link);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!link || busy || invalid || saved) return;
    if (password.length < 8 || password !== confirmation) {
      setMessage('Use pelo menos 8 caracteres e repita a mesma senha.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (!verified) {
        const { data, error } = 'tokenHash' in link
          ? await client.auth.verifyOtp({ token_hash: link.tokenHash, type: 'recovery' })
          : await client.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken });
        if (error?.code === 'otp_expired' || [400, 401, 403].includes(error?.status ?? 0) || (!error && !data.session)) {
          setInvalid(true);
          return;
        }
        if (error) throw error;
        setVerified(true);
      }
      const { error } = await client.auth.updateUser({ password });
      if (error?.code === 'same_password') {
        setMessage('Escolha uma senha diferente da atual.');
      } else if (error?.code === 'weak_password') {
        setMessage('Escolha uma senha mais forte e tente novamente.');
      } else if (error) {
        throw error;
      } else {
        setSaved(true);
        setPassword('');
        setConfirmation('');
        await client.auth.signOut().catch(() => {});
      }
    } catch {
      setMessage('Não foi possível atualizar a senha agora. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const input = 'mt-1 w-full rounded-xl border border-slate-300 p-3';
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <section className="bg-surface border border-slate-200 rounded-3xl shadow-sm p-7 w-full max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Redefinir senha</h1>
      {invalid ? <p role="alert">{invalidLink}</p>
        : saved ? <p role="status">Senha atualizada. Entre com a nova senha para consultar sua inscrição.</p>
        : <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Nova senha
            <input required minLength={8} type="password" autoComplete="new-password" className={input}
              value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
          </label>
          <label className="block text-sm font-medium">Confirmar nova senha
            <input required minLength={8} type="password" autoComplete="new-password" className={input}
              value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-700 p-3 font-bold text-white disabled:opacity-60">
            {busy ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>}
      {message && <p role="alert" className="text-sm text-rose-900">{message}</p>}
      {(saved || invalid) && <a className="inline-block font-semibold text-indigo-700 underline" href={registrationPage}>
        Voltar às inscrições
      </a>}
    </section>
  </main>;
}
