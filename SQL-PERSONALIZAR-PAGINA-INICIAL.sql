-- Execute uma vez no SQL Editor do projeto SEACOM. Não apaga conteúdo existente.
ALTER TABLE public.seacom_site_content
ADD COLUMN IF NOT EXISTS home_sections jsonb NOT NULL DEFAULT '[{"id":"hero","type":"hero","visible":true},{"id":"about","type":"about","visible":true}]'::jsonb;

-- O controle de edição continua protegido pela política RLS seacom_site_edit.
GRANT UPDATE (home_sections) ON public.seacom_site_content TO authenticated;

-- Validação de estrutura para evitar conteúdo malformado.
ALTER TABLE public.seacom_site_content
DROP CONSTRAINT IF EXISTS seacom_home_sections_is_array;
ALTER TABLE public.seacom_site_content
ADD CONSTRAINT seacom_home_sections_is_array CHECK (jsonb_typeof(home_sections) = 'array');

NOTIFY pgrst, 'reload schema';
