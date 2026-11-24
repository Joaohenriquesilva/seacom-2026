-- SEACOM 2026: controle de envio do e-mail de confirmação de inscrição.
-- Execute no SQL Editor do Supabase. Não altera dados existentes nem desativa RLS.
-- A coluna é usada pela Edge Function seacom-send-registration-email para
-- impedir reenvios em sequência (1 e-mail por minuto por inscrição).

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

NOTIFY pgrst, 'reload schema';
