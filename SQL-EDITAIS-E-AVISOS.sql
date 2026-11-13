begin;

create table if not exists public.seacom_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  file_path text not null unique check (file_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]pdf$'),
  position integer not null default 0 check (position >= 0),
  active boolean not null default false,
  revision uuid not null default gen_random_uuid()
);

alter table public.seacom_notices enable row level security;
revoke all on public.seacom_notices from public, anon, authenticated;
grant select on public.seacom_notices to anon, authenticated;
grant insert, update, delete on public.seacom_notices to authenticated;

drop policy if exists seacom_notices_published on public.seacom_notices;
create policy seacom_notices_published on public.seacom_notices
  for select to anon, authenticated using (active);

drop policy if exists seacom_notices_manage on public.seacom_notices;
create policy seacom_notices_manage on public.seacom_notices
  for all to authenticated
  using ((select public.seacom_can('noticias.publicar')))
  with check ((select public.seacom_can('noticias.publicar')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seacom-notices', 'seacom-notices', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists seacom_notice_read on storage.objects;
create policy seacom_notice_read on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'seacom-notices' and exists (
      select 1 from public.seacom_notices n where n.file_path = storage.objects.name and n.active
    )
  );

drop policy if exists seacom_notice_manage_read on storage.objects;
create policy seacom_notice_manage_read on storage.objects
  for select to authenticated using (
    bucket_id = 'seacom-notices' and (select public.seacom_can('noticias.publicar'))
  );

drop policy if exists seacom_notice_upload on storage.objects;
create policy seacom_notice_upload on storage.objects
  for insert to authenticated with check (
    bucket_id = 'seacom-notices'
    and (select public.seacom_can('noticias.publicar'))
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]pdf$'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists seacom_notice_delete on storage.objects;
create policy seacom_notice_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'seacom-notices'
    and (select public.seacom_can('noticias.publicar'))
    and not exists (select 1 from public.seacom_notices n where n.file_path = storage.objects.name)
  );

commit;
