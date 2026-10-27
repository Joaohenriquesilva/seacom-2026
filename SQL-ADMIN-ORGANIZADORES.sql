-- SEACOM 2026 - Executar no SQL Editor como administrador do projeto.
-- A conta proprietaria ja deve existir em public.admin_members (is_owner=true).
CREATE TABLE IF NOT EXISTS public.admin_permission_overrides (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL,
  PRIMARY KEY (user_id, permission_key)
);
ALTER TABLE public.admin_permission_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_permission_overrides FROM anon, authenticated;

-- Funcao interna: a checagem usa o UID do token autenticado, nunca um ID enviado pelo navegador.
CREATE OR REPLACE FUNCTION public.seacom_is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.admin_members
 WHERE user_id = (SELECT auth.uid()) AND is_owner = true AND is_active = true);
$$;
REVOKE ALL ON FUNCTION public.seacom_is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_is_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.seacom_list_organizers()
RETURNS TABLE (user_id uuid, display_name text, profile_id text, is_owner boolean, is_active boolean, email text, overrides jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT public.seacom_is_owner() THEN RAISE EXCEPTION 'Acesso restrito a administracao principal' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT m.user_id, m.display_name::text, m.profile_id::text, m.is_owner, m.is_active,
 u.email::text, COALESCE((SELECT jsonb_object_agg(o.permission_key,o.allowed) FROM public.admin_permission_overrides o WHERE o.user_id=m.user_id),'{}'::jsonb)
 FROM public.admin_members m JOIN auth.users u ON u.id=m.user_id ORDER BY m.is_owner DESC,m.display_name;
END; $$;
REVOKE ALL ON FUNCTION public.seacom_list_organizers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_list_organizers() TO authenticated;

-- Adiciona SOMENTE conta ja criada no Authentication > Users.
CREATE OR REPLACE FUNCTION public.seacom_add_organizer(p_email text,p_name text,p_profile text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid;
BEGIN
 IF NOT public.seacom_is_owner() THEN RAISE EXCEPTION 'Sem permissao' USING ERRCODE='42501'; END IF;
 IF p_profile NOT IN ('comunicacao','programacao','inscricoes','credenciamento','consulta') THEN RAISE EXCEPTION 'Perfil invalido'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Informe um nome entre 2 e 100 caracteres'; END IF;
 SELECT id INTO v_uid FROM auth.users WHERE lower(email)=lower(trim(p_email)) AND email_confirmed_at IS NOT NULL;
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Crie e confirme primeiro este usuario em Authentication > Users'; END IF;
 IF EXISTS (SELECT 1 FROM public.admin_members WHERE user_id=v_uid) THEN RAISE EXCEPTION 'Este usuario ja e organizador'; END IF;
 INSERT INTO public.admin_members(user_id,display_name,profile_id,is_owner,is_active)
 VALUES(v_uid,trim(p_name),p_profile,false,true);
END; $$;
REVOKE ALL ON FUNCTION public.seacom_add_organizer(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_add_organizer(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.seacom_update_organizer(p_user_id uuid,p_name text,p_profile text,p_active boolean,p_overrides jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_key text; v_value jsonb;
BEGIN
 IF NOT public.seacom_is_owner() THEN RAISE EXCEPTION 'Sem permissao' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.admin_members WHERE user_id=p_user_id AND is_owner=false) THEN RAISE EXCEPTION 'Nao e permitido alterar a conta proprietaria'; END IF;
 IF p_profile NOT IN ('comunicacao','programacao','inscricoes','credenciamento','consulta') THEN RAISE EXCEPTION 'Perfil invalido'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Nome invalido'; END IF;
 IF p_overrides IS NULL OR jsonb_typeof(p_overrides) <> 'object' THEN RAISE EXCEPTION 'Permissoes invalidas'; END IF;
 FOR v_key,v_value IN SELECT key,value FROM jsonb_each(p_overrides) LOOP
  IF v_key NOT IN ('programacao.visualizar','programacao.criar','programacao.editar','programacao.excluir','programacao.publicar',
  'palestrantes.visualizar','palestrantes.criar','palestrantes.editar','palestrantes.excluir',
  'noticias.visualizar','noticias.criar','noticias.editar','noticias.excluir','noticias.publicar',
  'inscricoes.visualizar','inscricoes.confirmar','inscricoes.cancelar','inscricoes.exportar',
  'credenciamento.visualizar','credenciamento.presenca','site.editar') OR jsonb_typeof(v_value) <> 'boolean'
  THEN RAISE EXCEPTION 'Permissao invalida: %',v_key; END IF;
 END LOOP;
 UPDATE public.admin_members SET display_name=trim(p_name),profile_id=p_profile,is_active=p_active WHERE user_id=p_user_id;
 DELETE FROM public.admin_permission_overrides WHERE user_id=p_user_id;
 INSERT INTO public.admin_permission_overrides(user_id,permission_key,allowed)
 SELECT p_user_id,key,(value::text)::boolean FROM jsonb_each(p_overrides);
END; $$;
REVOKE ALL ON FUNCTION public.seacom_update_organizer(uuid,text,text,boolean,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_update_organizer(uuid,text,text,boolean,jsonb) TO authenticated;

-- Checagem de permissao para futuras operacoes no servidor.
CREATE OR REPLACE FUNCTION public.seacom_can(p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (
 SELECT 1 FROM public.admin_members m
 WHERE m.user_id=(SELECT auth.uid()) AND m.is_active=true AND (
 m.is_owner=true OR COALESCE(
 (SELECT o.allowed FROM public.admin_permission_overrides o WHERE o.user_id=m.user_id AND o.permission_key=p_permission),
 CASE
 WHEN m.profile_id='programacao' THEN p_permission IN ('programacao.visualizar','programacao.criar','programacao.editar','programacao.publicar','palestrantes.visualizar','palestrantes.criar','palestrantes.editar')
 WHEN m.profile_id='comunicacao' THEN p_permission IN ('noticias.visualizar','noticias.criar','noticias.editar','noticias.publicar')
 WHEN m.profile_id='inscricoes' THEN p_permission IN ('inscricoes.visualizar','inscricoes.confirmar')
 WHEN m.profile_id='credenciamento' THEN p_permission IN ('credenciamento.visualizar','credenciamento.presenca')
 ELSE false END)));
$$;
REVOKE ALL ON FUNCTION public.seacom_can(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seacom_can(text) TO authenticated;
