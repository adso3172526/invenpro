-- Crea el bucket 'productos' como PUBLICO (idempotente).
-- Correr en el SQL Editor de Supabase.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;
