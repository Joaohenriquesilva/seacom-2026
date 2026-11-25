-- Execute no mesmo projeto Supabase. Não altera atividades nem inscrições.
CREATE TABLE IF NOT EXISTS public.seacom_schedule_config (
 id integer PRIMARY KEY CHECK (id = 1),
 labels jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(labels)='object'),
 day_labels jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(day_labels)='object'),
 activity_order jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(activity_order)='object')
);
INSERT INTO public.seacom_schedule_config(id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.seacom_schedule_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seacom_schedule_config FROM anon, authenticated;
GRANT SELECT ON public.seacom_schedule_config TO anon, authenticated;
GRANT UPDATE(labels,day_labels,activity_order) ON public.seacom_schedule_config TO authenticated;
DROP POLICY IF EXISTS seacom_schedule_read ON public.seacom_schedule_config;
CREATE POLICY seacom_schedule_read ON public.seacom_schedule_config FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS seacom_schedule_edit ON public.seacom_schedule_config;
CREATE POLICY seacom_schedule_edit ON public.seacom_schedule_config FOR UPDATE TO authenticated USING (public.seacom_can('programacao.editar')) WITH CHECK (public.seacom_can('programacao.editar'));
NOTIFY pgrst, 'reload schema';
