-- Executar no SQL Editor após SQL-MODULOS-CONTEUDO-PRESENCA.sql.
-- Idempotente: não altera dados existentes, perfis ou permissões de outras funções.
BEGIN;
ALTER TABLE public.seacom_site_content
 ADD COLUMN IF NOT EXISTS visual_theme jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.seacom_site_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.seacom_site_content TO anon, authenticated;
GRANT UPDATE (visual_theme, updated_at) ON public.seacom_site_content TO authenticated;
-- A política existente usa a mesma permissão do editor de conteúdo.
DROP POLICY IF EXISTS seacom_site_edit ON public.seacom_site_content;
CREATE POLICY seacom_site_edit ON public.seacom_site_content
 FOR UPDATE TO authenticated
 USING ((SELECT public.seacom_can('site.editar')))
 WITH CHECK ((SELECT public.seacom_can('site.editar')));
COMMIT;
NOTIFY pgrst, 'reload schema';
