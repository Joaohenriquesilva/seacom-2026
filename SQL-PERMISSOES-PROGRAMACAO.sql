-- SEACOM 2026: políticas de gerenciamento da programação.
-- Execute no SQL Editor do MESMO projeto Supabase conectado ao site.
-- Preserva as atividades e políticas já existentes.
-- Requer a função public.seacom_can(text) e a tabela public.activities.

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seacom_programacao_admin_select ON public.activities;
CREATE POLICY seacom_programacao_admin_select ON public.activities
FOR SELECT TO authenticated
USING (public.seacom_can('programacao.visualizar') OR public.seacom_can('programacao.criar') OR public.seacom_can('programacao.editar'));

DROP POLICY IF EXISTS seacom_programacao_admin_insert ON public.activities;
CREATE POLICY seacom_programacao_admin_insert ON public.activities
FOR INSERT TO authenticated
WITH CHECK (public.seacom_can('programacao.criar') AND (is_published = false OR public.seacom_can('programacao.publicar')));

DROP POLICY IF EXISTS seacom_programacao_admin_update ON public.activities;
CREATE POLICY seacom_programacao_admin_update ON public.activities
FOR UPDATE TO authenticated
USING (public.seacom_can('programacao.editar'))
WITH CHECK (public.seacom_can('programacao.editar') AND (is_published = false OR public.seacom_can('programacao.publicar')));

DROP POLICY IF EXISTS seacom_programacao_admin_delete ON public.activities;
CREATE POLICY seacom_programacao_admin_delete ON public.activities
FOR DELETE TO authenticated
USING (public.seacom_can('programacao.excluir'));

-- Palestrantes cadastrados podem ser selecionados no formulário.
-- Não amplia a permissão de escrita sobre palestrantes.
DROP POLICY IF EXISTS seacom_programacao_speakers_select ON public.speakers;
CREATE POLICY seacom_programacao_speakers_select ON public.speakers
FOR SELECT TO authenticated
USING (public.seacom_can('programacao.visualizar') OR public.seacom_can('programacao.criar') OR public.seacom_can('programacao.editar'));

NOTIFY pgrst, 'reload schema';
