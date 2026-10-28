-- SEACOM: configuração do ponto de presença. Preencha latitude e longitude
-- do local exato de credenciamento antes de ativar a confirmação.
-- Consulte as coordenadas no mapa do local e use valores em graus decimais.
CREATE TABLE IF NOT EXISTS public.seacom_checkin_location (
 id integer PRIMARY KEY CHECK (id=1),
 latitude double precision,
 longitude double precision,
 radius_m integer NOT NULL DEFAULT 250 CHECK (radius_m BETWEEN 30 AND 2000),
 max_accuracy_m integer NOT NULL DEFAULT 120 CHECK (max_accuracy_m BETWEEN 10 AND 1000)
);
INSERT INTO public.seacom_checkin_location(id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.seacom_checkin_location ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seacom_checkin_location FROM anon,authenticated;

-- ATENÇÃO: preencha as coordenadas reais do ponto de credenciamento.
-- Exemplo de configuração (NÃO EXECUTAR com valores fictícios):
-- UPDATE public.seacom_checkin_location
-- SET latitude = -9.000000, longitude = -67.000000, radius_m = 250
-- WHERE id = 1;

-- A função antiga sem localização NÃO pode continuar acessível,
-- pois permitiria confirmar presença ignorando a verificação geográfica.
REVOKE ALL ON FUNCTION public.seacom_checkin(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.seacom_checkin_local(
 p_activity_id uuid, p_latitude double precision,
 p_longitude double precision, p_accuracy double precision
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 v_lat double precision;v_lon double precision;v_radius integer;v_max_accuracy integer;
 v_distance double precision;v_registration_id uuid;v_start timestamptz;v_end timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login para confirmar a presença'; END IF;
 SELECT latitude,longitude,radius_m,max_accuracy_m INTO v_lat,v_lon,v_radius,v_max_accuracy
 FROM public.seacom_checkin_location WHERE id=1;
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
