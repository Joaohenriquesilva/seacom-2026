-- SEACOM 2026: inscrição real para TESTES PRIVADOS, sem confirmação por e-mail.
-- Execute no SQL Editor. NÃO desativa RLS, NÃO remove inscrições existentes.
-- A confirmação de e-mail é uma configuração do painel Authentication > Providers > Email.

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS seacom_participants_auth_uid_idx
  ON public.participants(auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.seacom_register_participant(
  p_activity_ids uuid[],
  p_course text,
  p_full_name text,
  p_institution text,
  p_phone text,
  p_student_id text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_participant uuid;
  v_registration uuid;
  v_protocol text;
  v_activity uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Faça o cadastro ou login antes de se inscrever' USING ERRCODE='42501';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Conta sem e-mail'; END IF;
  IF length(trim(coalesce(p_full_name,''))) < 3 OR
     length(trim(coalesce(p_course,''))) = 0 OR
     length(trim(coalesce(p_institution,''))) = 0 OR
     length(trim(coalesce(p_student_id,''))) = 0 OR
     coalesce(p_phone,'') !~ '^\([0-9]{2}\) [0-9]{5}-[0-9]{4}$' THEN
    RAISE EXCEPTION 'Dados de inscrição incompletos ou telefone inválido';
  END IF;
  IF p_activity_ids IS NULL OR cardinality(p_activity_ids) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos uma atividade';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(p_activity_ids) AS selected(id)
    LEFT JOIN public.activities a ON a.id = selected.id AND a.is_published = true
    WHERE a.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Uma ou mais atividades não estão publicadas';
  END IF;

  SELECT id INTO v_participant FROM public.participants WHERE auth_user_id = v_uid LIMIT 1;
  IF v_participant IS NULL THEN
    INSERT INTO public.participants(auth_user_id,full_name,email,course,institution,student_id,phone)
    VALUES(v_uid,trim(p_full_name),v_email,trim(p_course),trim(p_institution),trim(p_student_id),p_phone)
    RETURNING id INTO v_participant;
  ELSE
    UPDATE public.participants SET
      full_name=trim(p_full_name),course=trim(p_course),institution=trim(p_institution),
      student_id=trim(p_student_id),phone=p_phone
    WHERE id=v_participant;
  END IF;

  SELECT id, protocol INTO v_registration, v_protocol
  FROM public.registrations
  WHERE participant_id=v_participant AND status <> 'cancelled'
  ORDER BY created_at DESC LIMIT 1;
  IF v_registration IS NULL THEN
    INSERT INTO public.registrations(participant_id,status)
    VALUES(v_participant,'confirmed')
    RETURNING id,protocol INTO v_registration,v_protocol;
  END IF;
  -- Confirmar a inscrição no clique do formulário, independentemente do check-in.
  UPDATE public.registrations
  SET status = 'confirmed'
  WHERE id = v_registration AND status <> 'confirmed';

  FOREACH v_activity IN ARRAY p_activity_ids LOOP
    INSERT INTO public.registration_activities(registration_id,activity_id)
    VALUES(v_registration,v_activity)
    ON CONFLICT (registration_id,activity_id) DO NOTHING;
  END LOOP;
  RETURN v_protocol;
END;
$$;
REVOKE ALL ON FUNCTION public.seacom_register_participant(uuid[],text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_register_participant(uuid[],text,text,text,text,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
