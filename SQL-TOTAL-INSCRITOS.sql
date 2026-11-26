BEGIN;

CREATE OR REPLACE FUNCTION public.seacom_total_inscritos()
RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT (
  coalesce(public.seacom_can('inscricoes.exportar'), false) OR
  coalesce(public.seacom_can('credenciamento.visualizar'), false)
 ) THEN
  RAISE EXCEPTION 'Sem permissão para consultar o total de inscritos' USING ERRCODE = '42501';
 END IF;

 RETURN (
  SELECT count(DISTINCT coalesce(
   'email:' || nullif(lower(btrim(p.email::text)), ''),
   'participante:' || p.id::text
  ))
  FROM public.participants p
  WHERE EXISTS (
   SELECT 1
   FROM public.registrations r
   JOIN public.registration_activities ra ON ra.registration_id = r.id
   WHERE r.participant_id = p.id AND r.status <> 'cancelled'
  )
 );
END;
$$;

REVOKE ALL ON FUNCTION public.seacom_total_inscritos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seacom_total_inscritos() TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
