BEGIN;

ALTER TABLE public.seacom_checkin_location ADD COLUMN IF NOT EXISTS address text;

CREATE TABLE IF NOT EXISTS public.seacom_activity_checkin_locations (
 activity_id uuid PRIMARY KEY REFERENCES public.activities(id) ON DELETE CASCADE,
 address text NOT NULL CHECK (char_length(btrim(address)) BETWEEN 3 AND 500),
 latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180)
);
ALTER TABLE public.seacom_activity_checkin_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seacom_activity_checkin_locations FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.seacom_can_manage_checkin_location()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS (
  SELECT 1 FROM auth.users u JOIN public.admin_members m ON m.user_id=u.id
  WHERE u.id=auth.uid() AND m.is_active AND u.email_confirmed_at IS NOT NULL
    AND lower(u.email)='henrrique.costta@gmail.com'
 );
$$;

CREATE OR REPLACE FUNCTION public.seacom_get_checkin_settings()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.seacom_can_manage_checkin_location() THEN
  RAISE EXCEPTION 'Sem permissão para configurar o local' USING ERRCODE='42501';
 END IF;
 RETURN jsonb_build_object(
  'default_address', (SELECT address FROM public.seacom_checkin_location WHERE id=1),
  'activities', coalesce((
   SELECT jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'address',l.address)
                    ORDER BY a.starts_at,a.title,a.id)
   FROM public.activities a
   LEFT JOIN public.seacom_activity_checkin_locations l ON l.activity_id=a.id
  ), '[]'::jsonb)
 );
END $$;

CREATE OR REPLACE FUNCTION public.seacom_set_checkin_location(
 p_activity_id uuid, p_address text, p_latitude double precision, p_longitude double precision
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.seacom_can_manage_checkin_location() THEN
  RAISE EXCEPTION 'Sem permissão para configurar o local' USING ERRCODE='42501';
 END IF;
 IF p_activity_id IS NOT NULL AND p_address IS NULL AND p_latitude IS NULL AND p_longitude IS NULL THEN
  DELETE FROM public.seacom_activity_checkin_locations WHERE activity_id=p_activity_id;
  RETURN;
 END IF;
 IF coalesce(char_length(btrim(p_address)) BETWEEN 3 AND 500, false) IS FALSE
  OR coalesce(p_latitude BETWEEN -90 AND 90, false) IS FALSE
  OR coalesce(p_longitude BETWEEN -180 AND 180, false) IS FALSE THEN
  RAISE EXCEPTION 'Endereço ou coordenadas inválidos';
 END IF;
 IF p_activity_id IS NULL THEN
  INSERT INTO public.seacom_checkin_location(id,address,latitude,longitude)
  VALUES (1,btrim(p_address),p_latitude,p_longitude)
  ON CONFLICT (id) DO UPDATE SET address=EXCLUDED.address,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude;
 ELSE
  INSERT INTO public.seacom_activity_checkin_locations(activity_id,address,latitude,longitude)
  VALUES (p_activity_id,btrim(p_address),p_latitude,p_longitude)
  ON CONFLICT (activity_id) DO UPDATE SET address=EXCLUDED.address,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.seacom_checkin_address(p_activity_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(l.address,g.address)
 FROM public.activities a
 LEFT JOIN public.seacom_checkin_location g ON g.id=1
 LEFT JOIN public.seacom_activity_checkin_locations l ON l.activity_id=a.id
 WHERE a.id=p_activity_id AND a.is_published;
$$;

CREATE OR REPLACE FUNCTION public.seacom_attendance_export(p_activity_id uuid)
RETURNS TABLE (nome text,email text,telefone text,atividade text,status_presenca text,confirmado_em timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.seacom_can('inscricoes.exportar'),false) THEN
  RAISE EXCEPTION 'Sem permissão para exportar presenças' USING ERRCODE='42501';
 END IF;
 RETURN QUERY
 SELECT p.full_name::text,p.email::text,p.phone::text,a.title::text,
  CASE WHEN s.checked_in_at IS NULL THEN 'Não confirmou presença' ELSE 'Presença confirmada' END,
  s.checked_in_at
 FROM public.registration_activities ra
 JOIN public.registrations r ON r.id=ra.registration_id
 JOIN public.participants p ON p.id=r.participant_id
 JOIN public.activities a ON a.id=ra.activity_id
 LEFT JOIN public.seacom_attendance s ON s.registration_id=r.id AND s.activity_id=ra.activity_id
 WHERE ra.activity_id=p_activity_id AND r.status <> 'cancelled'
 ORDER BY p.full_name,r.id;
END $$;

REVOKE ALL ON FUNCTION public.seacom_can_manage_checkin_location(), public.seacom_get_checkin_settings(),
 public.seacom_set_checkin_location(uuid,text,double precision,double precision),
 public.seacom_attendance_export(uuid), public.seacom_checkin_address(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.seacom_can_manage_checkin_location(), public.seacom_get_checkin_settings(),
 public.seacom_set_checkin_location(uuid,text,double precision,double precision),
 public.seacom_attendance_export(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seacom_checkin_address(uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.seacom_checkin_local(
 p_activity_id uuid, p_latitude double precision,
 p_longitude double precision, p_accuracy double precision
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 v_lat double precision;v_lon double precision;v_radius integer;v_max_accuracy integer;
 v_distance double precision;v_registration_id uuid;v_start timestamptz;v_end timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login para confirmar a presença'; END IF;
 SELECT coalesce(l.latitude,g.latitude),coalesce(l.longitude,g.longitude),g.radius_m,g.max_accuracy_m INTO v_lat,v_lon,v_radius,v_max_accuracy
 FROM public.seacom_checkin_location g
 LEFT JOIN public.seacom_activity_checkin_locations l ON l.activity_id=p_activity_id
 WHERE g.id=1;
 IF v_lat IS NULL OR v_lon IS NULL THEN RAISE EXCEPTION 'Local do evento ainda não configurado. Contate a organização.'; END IF;
 IF p_latitude IS NULL OR p_longitude IS NULL OR p_accuracy IS NULL
 OR NOT (p_latitude BETWEEN -90 AND 90) OR NOT (p_longitude BETWEEN -180 AND 180)
 OR NOT (p_accuracy BETWEEN 0 AND v_max_accuracy) THEN
 RAISE EXCEPTION 'Localização imprecisa. Ative a localização precisa e tente novamente.';
 END IF;
 v_distance:=6371000*2*asin(least(1,sqrt(
 power(sin(radians(p_latitude-v_lat)/2),2)+
 cos(radians(v_lat))*cos(radians(p_latitude))*power(sin(radians(p_longitude-v_lon)/2),2)
 )));
 IF v_distance>v_radius THEN RAISE EXCEPTION 'Usuário Não Presente no Local'; END IF;
 SELECT starts_at,ends_at INTO v_start,v_end FROM public.activities WHERE id=p_activity_id AND is_published=true;
 IF v_start IS NULL THEN RAISE EXCEPTION 'Atividade não encontrada'; END IF;
 IF now()<v_start-interval '30 minutes' OR now()>v_end+interval '30 minutes' THEN
 RAISE EXCEPTION 'Confirmação disponível somente próximo ao horário da atividade'; END IF;
 SELECT r.id INTO v_registration_id
 FROM public.registrations r JOIN public.participants p ON p.id=r.participant_id
 JOIN public.registration_activities ra ON ra.registration_id=r.id AND ra.activity_id=p_activity_id
 WHERE lower(p.email)=lower(auth.jwt()->>'email') AND r.status='confirmed' LIMIT 1;
 IF v_registration_id IS NULL THEN RAISE EXCEPTION 'Inscrição confirmada não encontrada para este e-mail e atividade'; END IF;
 INSERT INTO public.seacom_attendance(registration_id,activity_id) VALUES(v_registration_id,p_activity_id)
 ON CONFLICT DO NOTHING;
 RETURN 'Presença registrada ou já confirmada.';
END $$;
REVOKE ALL ON FUNCTION public.seacom_checkin_local(uuid,double precision,double precision,double precision) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seacom_checkin_local(uuid,double precision,double precision,double precision) TO authenticated;
NOTIFY pgrst,'reload schema';

COMMIT;
