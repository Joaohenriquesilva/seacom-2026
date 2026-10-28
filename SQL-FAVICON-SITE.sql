-- Execute no Supabase SQL Editor (uma única vez).
ALTER TABLE public.seacom_site_content ADD COLUMN IF NOT EXISTS favicon_url text;
NOTIFY pgrst, 'reload schema';
