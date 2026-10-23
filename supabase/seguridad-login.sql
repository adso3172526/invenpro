-- ============================================================================
--  Seguridad: login por RPC (fn_login)
--  Verifica el hash de la contrasena DEL LADO SERVIDOR y NO devuelve 'pass'.
--  Paso 1 de la proteccion de usuarios_sistema. Solo AGREGA la funcion; no
--  cambia accesos todavia. Correr en el SQL Editor de Supabase.
--  permisos es text[] (no jsonb); columnas calificadas para evitar ambiguedad.
-- ============================================================================

drop function if exists fn_login(text, text, text);

create or replace function fn_login(p_usuario text, p_sha text, p_md5 text default '')
returns table(usuario text, nombre text, rol text, permisos text[])
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v usuarios_sistema%rowtype;
begin
  select u.* into v
  from usuarios_sistema u
  where lower(u.usuario) = lower(p_usuario)
    and (u.pass = p_sha or (p_md5 <> '' and u.pass = p_md5))
  limit 1;

  if not found then
    return;
  end if;

  -- BLOQUEO por estado: si el usuario corresponde a un CAJERO inactivo, no se permite
  -- el login (el estado vive en la tabla cajeros; se enlaza por nombre). Los usuarios
  -- que no son cajeros (admin/supervisor sin fila en cajeros) no se ven afectados.
  if exists (
    select 1 from cajeros c
    where lower(c.nombre) = lower(v.nombre) and c.estado = 'inactivo'
  ) then
    return;  -- cajero inactivo -> login denegado
  end if;

  -- migra un hash viejo (md5) a sha-256 si aplica
  if p_md5 <> '' and v.pass = p_md5 and p_md5 is distinct from p_sha then
    update usuarios_sistema us set pass = p_sha where us.usuario = v.usuario;
  end if;

  return query select v.usuario, v.nombre, v.rol, v.permisos;
end;
$fn$;

grant execute on function fn_login(text, text, text) to anon, authenticated;
