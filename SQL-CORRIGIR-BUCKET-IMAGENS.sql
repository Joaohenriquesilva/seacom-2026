-- SEACOM 2026 - Correção do erro "Bucket not found".
-- Execute no SQL Editor do MESMO projeto Supabase configurado no Netlify.
-- Não remove arquivos, tabelas ou notícias existentes.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seacom-images', 'seacom-images', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- A leitura pública permite exibir as capas e notícias no site.
DROP POLICY IF EXISTS "seacom_images_public_read" ON storage.objects;
CREATE POLICY "seacom_images_public_read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'seacom-images');

-- O envio exige login, pasta do próprio usuário e permissão administrativa.
DROP POLICY IF EXISTS "seacom_images_authorized_upload" ON storage.objects;
CREATE POLICY "seacom_images_authorized_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'seacom-images'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  AND (
    (
      (storage.foldername(name))[1] = 'news'
      AND (SELECT public.seacom_can('noticias.criar'))
    )
    OR
    (
      (storage.foldername(name))[1] = 'cover'
      AND (SELECT public.seacom_can('site.editar'))
    )
  )
);

-- Confirmação: deve retornar seacom-images | true.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'seacom-images';
