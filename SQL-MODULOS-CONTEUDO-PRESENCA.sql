-- SEACOM: executar uma vez no SQL Editor, depois de conferir backup.
-- Corrige identificadores de perfis na checagem central, preservando overrides.
CREATE OR REPLACE FUNCTION public.seacom_can(p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.admin_members m
 WHERE m.user_id=(SELECT auth.uid()) AND m.is_active=true AND (
 m.is_owner=true OR COALESCE(
 (SELECT o.allowed FROM public.admin_permission_overrides o WHERE o.user_id=m.user_id AND o.permission_key=p_permission),
 CASE
 WHEN m.profile_id='programming' THEN p_permission IN ('programacao.visualizar','programacao.criar','programacao.editar','programacao.publicar','palestrantes.visualizar','palestrantes.criar','palestrantes.editar')
 WHEN m.profile_id='communication' THEN p_permission IN ('noticias.visualizar','noticias.criar','noticias.editar','noticias.publicar')
 WHEN m.profile_id='registration' THEN p_permission IN ('inscricoes.visualizar','inscricoes.confirmar','inscricoes.exportar')
 WHEN m.profile_id='checkin' THEN p_permission IN ('credenciamento.visualizar','credenciamento.presenca')
 ELSE false END)));
$$;
REVOKE ALL ON FUNCTION public.seacom_can(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_can(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.seacom_news (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 180),
 summary text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '', image_url text,
 published boolean NOT NULL DEFAULT false, created_by uuid REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seacom_news ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.seacom_news TO anon, authenticated;
GRANT INSERT(title,summary,body,image_url,published,created_by) ON public.seacom_news TO authenticated;
GRANT UPDATE(title,summary,body,image_url,published,updated_at) ON public.seacom_news TO authenticated;
GRANT DELETE ON public.seacom_news TO authenticated;
DROP POLICY IF EXISTS seacom_news_read ON public.seacom_news;
CREATE POLICY seacom_news_read ON public.seacom_news FOR SELECT TO anon,authenticated USING (published);
DROP POLICY IF EXISTS seacom_news_admin_read ON public.seacom_news;
CREATE POLICY seacom_news_admin_read ON public.seacom_news FOR SELECT TO authenticated USING ((SELECT public.seacom_can('noticias.visualizar')));
DROP POLICY IF EXISTS seacom_news_insert ON public.seacom_news;
CREATE POLICY seacom_news_insert ON public.seacom_news FOR INSERT TO authenticated
 WITH CHECK (created_by=auth.uid() AND (SELECT public.seacom_can('noticias.criar')) AND (NOT published OR (SELECT public.seacom_can('noticias.publicar'))));
DROP POLICY IF EXISTS seacom_news_update ON public.seacom_news;
CREATE POLICY seacom_news_update ON public.seacom_news FOR UPDATE TO authenticated
 USING ((SELECT public.seacom_can('noticias.editar')))
 WITH CHECK ((SELECT public.seacom_can('noticias.editar')) AND (NOT published OR (SELECT public.seacom_can('noticias.publicar'))));
DROP POLICY IF EXISTS seacom_news_delete ON public.seacom_news;
CREATE POLICY seacom_news_delete ON public.seacom_news FOR DELETE TO authenticated USING ((SELECT public.seacom_can('noticias.excluir')));

CREATE TABLE IF NOT EXISTS public.seacom_site_content (
 id integer PRIMARY KEY DEFAULT 1 CHECK (id=1), hero_badge text NOT NULL DEFAULT '',
 hero_title text NOT NULL DEFAULT '', hero_subtitle text NOT NULL DEFAULT '',
 cover_url text NOT NULL DEFAULT '', about_text text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.seacom_site_content(id,hero_badge,hero_title,hero_subtitle,about_text)
 VALUES (1,'SEACOM 2026','O Futuro da Comunicação, Jornalismo e Cultura Digital',
 'Participe da Semana Acadêmica de Comunicação.','Conheça a programação e as atividades da SEACOM 2026.')
 ON CONFLICT(id) DO NOTHING;
ALTER TABLE public.seacom_site_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.seacom_site_content TO anon,authenticated;
GRANT UPDATE(hero_badge,hero_title,hero_subtitle,cover_url,about_text,updated_at) ON public.seacom_site_content TO authenticated;
DROP POLICY IF EXISTS seacom_site_read ON public.seacom_site_content;
CREATE POLICY seacom_site_read ON public.seacom_site_content FOR SELECT TO anon,authenticated USING(true);
DROP POLICY IF EXISTS seacom_site_edit ON public.seacom_site_content;
CREATE POLICY seacom_site_edit ON public.seacom_site_content FOR UPDATE TO authenticated
 USING ((SELECT public.seacom_can('site.editar'))) WITH CHECK ((SELECT public.seacom_can('site.editar')));

-- Uma presença por inscrição e atividade. A pessoa deve ter inscrição na atividade
-- e estar autenticada com o MESMO e-mail da inscrição.
CREATE TABLE IF NOT EXISTS public.seacom_attendance (
 registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
 activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
 checked_in_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(registration_id,activity_id)
);
ALTER TABLE public.seacom_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seacom_attendance FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.seacom_checkin(p_activity_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_registration_id uuid; v_start timestamptz; v_end timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre com seu e-mail e senha para confirmar a presença'; END IF;
 SELECT starts_at,ends_at INTO v_start,v_end FROM public.activities WHERE id=p_activity_id AND is_published=true;
 IF v_start IS NULL THEN RAISE EXCEPTION 'Atividade não encontrada'; END IF;
 IF now() < v_start - interval '30 minutes' OR now() > v_end + interval '30 minutes' THEN
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
REVOKE ALL ON FUNCTION public.seacom_checkin(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seacom_checkin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.seacom_attendance_report(p_activity_id uuid)
RETURNS TABLE (nome text,email text,atividade text,confirmado_em timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT (public.seacom_can('inscricoes.exportar') OR public.seacom_can('credenciamento.visualizar')) THEN
 RAISE EXCEPTION 'Sem permissão para exportar presenças' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.full_name::text,p.email::text,a.title::text,s.checked_in_at
 FROM public.seacom_attendance s JOIN public.registrations r ON r.id=s.registration_id
 JOIN public.participants p ON p.id=r.participant_id
 JOIN public.activities a ON a.id=s.activity_id WHERE s.activity_id=p_activity_id ORDER BY s.checked_in_at;
END $$;
REVOKE ALL ON FUNCTION public.seacom_attendance_report(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seacom_attendance_report(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
