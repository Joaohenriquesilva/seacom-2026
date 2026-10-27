-- SEACOM 2026 — executar uma vez no SQL Editor do Supabase.
-- Bucket público: apenas as imagens ficam públicas; upload exige login e permissão.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('seacom-images','seacom-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=true,file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "seacom_images_public_read" ON storage.objects;
CREATE POLICY "seacom_images_public_read" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id='seacom-images');

DROP POLICY IF EXISTS "seacom_images_authorized_upload" ON storage.objects;
CREATE POLICY "seacom_images_authorized_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id='seacom-images'
  AND (
    (storage.foldername(name))[1]='news'
    AND (SELECT public.seacom_can('noticias.criar'))
    OR
    (storage.foldername(name))[1]='cover'
    AND (SELECT public.seacom_can('site.editar'))
  )
  AND (storage.foldername(name))[2]=(SELECT auth.uid())::text
);
