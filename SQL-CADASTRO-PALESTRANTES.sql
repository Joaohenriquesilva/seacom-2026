BEGIN;

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

GRANT INSERT (name) ON public.speakers TO authenticated;

DROP POLICY IF EXISTS seacom_programacao_speakers_insert ON public.speakers;
CREATE POLICY seacom_programacao_speakers_insert ON public.speakers
FOR INSERT TO authenticated
WITH CHECK (public.seacom_can('palestrantes.criar') AND btrim(name) <> '');

COMMIT;
