begin;

alter table public.seacom_notices
  add column if not exists external_url text,
  alter column file_path drop not null;

alter table public.seacom_notices drop constraint if exists seacom_notices_destination;
alter table public.seacom_notices add constraint seacom_notices_destination check (
  (file_path is not null and external_url is null)
  or
  (file_path is null and external_url is not null
    and char_length(external_url) <= 2048
    and external_url ~ '^https?://[^[:space:]]+$')
);

commit;
