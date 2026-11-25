BEGIN;

-- Consulta privada: a identidade vem da sessão autenticada.
CREATE OR REPLACE FUNCTION public.seacom_my_registrations()
RETURNS TABLE (nome text, protocolo text, situacao text, atividades text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p.full_name::text, r.protocol::text, r.status::text,
        ARRAY(
          SELECT a.title::text
          FROM public.registration_activities ra
          JOIN public.activities a ON a.id = ra.activity_id
          WHERE ra.registration_id = r.id
          ORDER BY a.starts_at, a.id
        )
 FROM public.participants p
 JOIN public.registrations r ON r.participant_id = p.id
 WHERE p.auth_user_id = (SELECT auth.uid())
 ORDER BY r.created_at DESC, r.id;
$$;

REVOKE ALL ON FUNCTION public.seacom_my_registrations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seacom_my_registrations() TO authenticated;

-- Limite compartilhado pela validação pública de e-mails. Uma linha, sem dados pessoais.
CREATE TABLE IF NOT EXISTS public.seacom_recovery_quota (
 singleton boolean PRIMARY KEY CHECK (singleton),
 minute_started timestamptz NOT NULL,
 attempts integer NOT NULL CHECK (attempts > 0)
);
ALTER TABLE public.seacom_recovery_quota ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seacom_recovery_quota FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.seacom_registration_recovery_target(p_email text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_minute timestamptz := date_trunc('minute', clock_timestamp());
 v_email text;
BEGIN
 INSERT INTO public.seacom_recovery_quota AS quota (singleton, minute_started, attempts)
 VALUES (true, v_minute, 1)
 ON CONFLICT (singleton) DO UPDATE
 SET minute_started = greatest(quota.minute_started, EXCLUDED.minute_started),
     attempts = CASE WHEN quota.minute_started < EXCLUDED.minute_started THEN 1 ELSE quota.attempts + 1 END
 WHERE quota.minute_started < EXCLUDED.minute_started OR quota.attempts < 120;
 IF NOT FOUND THEN
   RAISE SQLSTATE 'PT429' USING MESSAGE = 'Limite de recuperação atingido';
 END IF;

 SELECT u.email INTO v_email
 FROM auth.users u
 JOIN public.participants p ON p.auth_user_id = u.id
 WHERE lower(u.email) = lower(p_email)
 AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.participant_id = p.id)
 LIMIT 1;

 RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.seacom_registration_recovery_target(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seacom_registration_recovery_target(text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
