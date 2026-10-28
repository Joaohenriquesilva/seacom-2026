-- SEACOM 2026: lista segura de inscritos e presenças por atividade.
-- Não altera inscrições existentes nem desativa RLS.
CREATE OR REPLACE FUNCTION public.seacom_activity_enrollments(p_activity_id uuid)
RETURNS TABLE (
 registration_id uuid,
 nome text,
 email text,
 status_inscricao text,
 confirmado_em timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT (
  public.seacom_can('inscricoes.visualizar') OR
  public.seacom_can('inscricoes.exportar') OR
  public.seacom_can('credenciamento.visualizar') OR
  public.seacom_can('credenciamento.presenca')
 ) THEN
  RAISE EXCEPTION 'Sem permissão para consultar inscrições' USING ERRCODE='42501';
 END IF;
 RETURN QUERY
 SELECT r.id, p.full_name::text, p.email::text, r.status::text, s.checked_in_at
 FROM public.registration_activities ra
 JOIN public.registrations r ON r.id=ra.registration_id
 JOIN public.participants p ON p.id=r.participant_id
 LEFT JOIN public.seacom_attendance s ON s.registration_id=r.id AND s.activity_id=ra.activity_id
 WHERE ra.activity_id=p_activity_id AND r.status <> 'cancelled'
 ORDER BY p.full_name;
END;
$$;
REVOKE ALL ON FUNCTION public.seacom_activity_enrollments(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_activity_enrollments(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
