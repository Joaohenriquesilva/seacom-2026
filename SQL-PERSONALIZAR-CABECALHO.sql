-- Execute uma vez no Supabase SQL Editor. Não remove dados existentes.
ALTER TABLE public.seacom_site_content
  ADD COLUMN IF NOT EXISTS header_logo_url text,
  ADD COLUMN IF NOT EXISTS header_name text DEFAULT 'SEACOM',
  ADD COLUMN IF NOT EXISTS header_subtitle text DEFAULT 'Semana Acadêmica de Comunicação',
  ADD COLUMN IF NOT EXISTS header_edition text DEFAULT 'XIII EDIÇÃO • 2026',
  ADD COLUMN IF NOT EXISTS header_show_edition boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS header_logo_size integer DEFAULT 44;
NOTIFY pgrst, 'reload schema';
