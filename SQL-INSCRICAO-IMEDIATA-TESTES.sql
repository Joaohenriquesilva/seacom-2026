-- SEACOM 2026: inscrição de participante autenticado, sem confirmação por e-mail.
-- Execute no SQL Editor. Em Authentication > Providers > Email, desative
-- temporariamente Confirm email (somente durante os testes privados).
-- O SQL não altera as configurações de envio de e-mail do Auth.

CREATE OR REPLACE FUNCTION public.seacom_register_participant(
  p_full_name text, p_phone text, p_course text, p_institution text,
  p_student_id text, p_activity_ids uuid[]
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(trim(auth.jwt()->>'email'));
  v_participant_id uuid;
  v_registration_id uuid;
  v_protocol text;
  v_expected integer;
BEGIN
  IF v_uid IS NULL OR v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Faça login para concluir a inscrição' USING ERRCODE = '42501';
  END IF;
  IF length(trim(coalesce(p_full_name,''))) < 3 OR length(trim(coalesce(p_course,''))) < 2
     OR length(trim(coalesce(p_institution,''))) < 2
     OR coalesce(p_phone,'') !~ '^\([0-9]{2}\) [0-9]{5}-[0-9]{4}$' THEN
    RAISE EXCEPTION 'Preencha corretamente os dados obrigatórios';
  END IF;
  v_expected := coalesce(array_length(p_activity_ids,1),0);
  IF v_expected = 0 OR v_expected <> (SELECT count(DISTINCT x) FROM unnest(p_activity_ids) x) THEN
    RAISE EXCEPTION 'Selecione atividades válidas sem duplicações';
  END IF;
  IF (SELECT count(*) FROM public.activities a WHERE a.id = ANY(p_activity_ids) AND a.is_published = true) <> v_expected THEN
    RAISE EXCEPTION 'Uma das atividades não está disponível para inscrição';
  END IF;

  -- Impede cadastro duplicado por e-mail; não altera inscrições existentes.
  SELECT id INTO v_participant_id FROM public.participants WHERE lower(email) = v_email LIMIT 1;
  IF v_participant_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.registrations WHERE participant_id=v_participant_id AND status <> 'cancelled') THEN
      RAISE EXCEPTION 'Já existe inscrição para este e-mail';
    END IF;
    UPDATE public.participants SET full_name=trim(p_full_name), phone=p_phone,
      course=trim(p_course), institution=trim(p_institution), student_id=nullif(trim(p_student_id),'')
    WHERE id=v_participant_id;
  ELSE
    INSERT INTO public.participants (full_name,email,phone,course,institution,student_id)
    VALUES (trim(p_full_name),v_email,p_phone,trim(p_course),trim(p_institution),nullif(trim(p_student_id),''))
    RETURNING id INTO v_participant_id;
  END IF;

  INSERT INTO public.registrations (participant_id,status)
  VALUES (v_participant_id,'confirmed')
  RETURNING id,protocol INTO v_registration_id,v_protocol;

  INSERT INTO public.registration_activities (registration_id,activity_id)
  SELECT v_registration_id, x FROM unnest(p_activity_ids) AS x;
  RETURN v_protocol;
END;
$$;
REVOKE ALL ON FUNCTION public.seacom_register_participant(text,text,text,text,text,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seacom_register_participant(text,text,text,text,text,uuid[]) TO authenticated;
NOTIFY pgrst,'reload schema';
