-- Fase 1 (fotos de producto): columna + politicas de Storage.
-- Correr en el SQL Editor de Supabase. Idempotente (se puede repetir).

alter table productos add column if not exists foto_url text;

drop policy if exists "productos_fotos_read" on storage.objects;
drop policy if exists "productos_fotos_insert" on storage.objects;
drop policy if exists "productos_fotos_update" on storage.objects;

create policy "productos_fotos_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'productos');

create policy "productos_fotos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'productos');

create policy "productos_fotos_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'productos')
  with check (bucket_id = 'productos');
