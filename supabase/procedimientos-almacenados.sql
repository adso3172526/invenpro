-- ============================================================================
-- InvenPro · Procedimientos almacenados + funciones (entregable académico)
-- ----------------------------------------------------------------------------
-- Arquitectura: la lógica vive UNA sola vez en cada FUNCTION; el PROCEDURE la
-- reutiliza llamándola (un PROCEDURE puede llamar a una FUNCTION, no al revés).
--
--   fn_*  (FUNCTION)  -> contiene la lógica. La llama la APP por rpc, y también
--                        el procedimiento. Devuelve un valor.
--   sp_*  (PROCEDURE) -> tu entregable. Se invoca con CALL (DataGrip) y delega
--                        en la función. NO duplica código.
--
-- Ninguno toca procesos críticos (facturación, turnos, stock vía RPC).
-- Orden: las funciones se crean ANTES que los procedimientos que las usan.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


-- ============================================================================
-- #1 · AJUSTE DE PRECIOS POR CATEGORÍA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION fn_ajustar_precios_categoria(categoria, porcentaje) -> int
--   Sube (+) o baja (-) el precio de todos los productos de una categoría.
--   precio es INTEGER -> redondea a la decena de 50 (ROUND al más cercano).
--   Devuelve cuántos productos se actualizaron.
--   La llama la app por rpc; también la usa el procedimiento de abajo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_ajustar_precios_categoria(
  p_categoria  TEXT,
  p_porcentaje NUMERIC
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_afectados INTEGER;
BEGIN
  -- Validación 1: porcentaje con sentido (no puede dejar el precio en <= 0)
  IF p_porcentaje IS NULL OR p_porcentaje <= -100 THEN
    RAISE EXCEPTION 'Porcentaje inválido: % (debe ser mayor que -100).', p_porcentaje;
  END IF;

  -- Validación 2: la categoría debe existir (tener al menos un producto)
  IF NOT EXISTS (SELECT 1 FROM productos WHERE categoria = p_categoria) THEN
    RAISE EXCEPTION 'La categoría "%" no tiene productos.', p_categoria;
  END IF;

  -- Ajuste + redondeo a la decena de 50:  round( precio*(1+%/100) / 50 ) * 50
  UPDATE productos
  SET precio = GREATEST(0, (ROUND( (precio * (1 + p_porcentaje / 100.0)) / 50.0 ) * 50)::int)
  WHERE categoria = p_categoria;

  GET DIAGNOSTICS v_afectados = ROW_COUNT;
  RETURN v_afectados;
END;
$$;

-- ----------------------------------------------------------------------------
-- PROCEDURE sp_ajustar_precios_categoria(categoria, porcentaje)
--   Entregable. Delega en la función (no duplica la lógica).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_ajustar_precios_categoria(
  p_categoria  TEXT,
  p_porcentaje NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_afectados INTEGER;
BEGIN
  v_afectados := fn_ajustar_precios_categoria(p_categoria, p_porcentaje);
  RAISE NOTICE 'Categoría "%": % producto(s) actualizados (ajuste % %%).',
    p_categoria, v_afectados, p_porcentaje;
END;
$$;


-- ============================================================================
-- #2 · ALTA DE CAJERO (+ usuario de login) EN UNA TRANSACCIÓN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION fn_crear_cajero(...) -> text (id del cajero creado)
--   Inserta el cajero Y su usuario de login de forma atómica (una función
--   corre en una sola transacción: si el 2º INSERT falla, se revierte el 1º).
--   Valida rol, documento y usuario duplicados; genera el id C-NN; asigna
--   permisos por rol; hashea la contraseña en SHA-256 (hex) para que calce
--   con el login de la app. La llama la app por rpc; también el procedimiento.
--
--   Si una validación falla, hace RAISE EXCEPTION -> la app lo recibe como
--   error de rpc y lo muestra en el modal.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_crear_cajero(
  p_nombres   TEXT,
  p_apellidos TEXT,
  p_doc       TEXT,
  p_rol       TEXT,
  p_usuario   TEXT,
  p_pass      TEXT
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_id       TEXT;
  v_num      INTEGER;
  v_nombre   TEXT;
  v_usuario  TEXT;
  v_permisos TEXT[];
  v_hash     TEXT;
BEGIN
  -- Validación 1: rol permitido
  IF p_rol NOT IN ('Cajero', 'Supervisor') THEN
    RAISE EXCEPTION 'Rol inválido: "%". Debe ser Cajero o Supervisor.', p_rol;
  END IF;

  -- Validación 2: contraseña mínima
  IF p_pass IS NULL OR length(p_pass) < 4 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 4 caracteres.';
  END IF;

  -- Validación 3: documento no duplicado
  IF EXISTS (SELECT 1 FROM cajeros WHERE doc = p_doc) THEN
    RAISE EXCEPTION 'Ya existe un cajero con el documento %.', p_doc;
  END IF;

  v_usuario := lower(trim(p_usuario));

  -- Validación 4: usuario de login obligatorio y no duplicado
  IF v_usuario IS NULL OR v_usuario = '' THEN
    RAISE EXCEPTION 'El usuario de login es obligatorio.';
  END IF;
  IF EXISTS (SELECT 1 FROM usuarios_sistema WHERE usuario = v_usuario) THEN
    RAISE EXCEPTION 'Ya existe el usuario "%".', v_usuario;
  END IF;

  -- Nombre completo
  v_nombre := trim(p_nombres) || ' ' || trim(p_apellidos);

  -- Siguiente id consecutivo con formato C-NN
  SELECT COALESCE(MAX( (regexp_replace(id, '\D', '', 'g'))::int ), 0) + 1
    INTO v_num
    FROM cajeros
   WHERE id ~ '^C-\d+$';
  v_id := 'C-' || lpad(v_num::text, 2, '0');

  -- Permisos según el rol
  IF p_rol = 'Supervisor' THEN
    v_permisos := ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER','REPORTE_VER','INGRESO_CREAR'];
  ELSE
    v_permisos := ARRAY['POS_FACTURAR','TURNO_ABRIR_CERRAR','INVENTARIO_VER'];
  END IF;

  -- Hash SHA-256 (hex) para que calce con el login de la app
  v_hash := encode(extensions.digest(p_pass, 'sha256'), 'hex');

  -- INSERT 1: el cajero
  INSERT INTO cajeros (id, nombre, doc, rol, estado, turno_activo, ingreso, ventas_30d)
  VALUES (v_id, v_nombre, p_doc, p_rol, 'activo', false, current_date, 0);

  -- INSERT 2: su usuario de login (si falla, el INSERT 1 también se revierte)
  INSERT INTO usuarios_sistema (usuario, pass, nombre, rol, permisos)
  VALUES (v_usuario, v_hash, v_nombre, p_rol, v_permisos);

  RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- PROCEDURE sp_crear_cajero(...)
--   Entregable. Delega en la función (no duplica la lógica).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_crear_cajero(
  p_nombres   TEXT,
  p_apellidos TEXT,
  p_doc       TEXT,
  p_rol       TEXT,
  p_usuario   TEXT,
  p_pass      TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := fn_crear_cajero(p_nombres, p_apellidos, p_doc, p_rol, p_usuario, p_pass);
  RAISE NOTICE 'Cajero % creado correctamente.', v_id;
END;
$$;


-- ============================================================================
-- EJEMPLOS DE USO
-- ----------------------------------------------------------------------------
-- Desde DataGrip (PROCEDURE, entregable):
--   CALL sp_ajustar_precios_categoria('Panadería', 10);
--   CALL sp_crear_cajero('Carolina','Mendoza','1.090.111.222','Cajero','carolina.mendoza','temporal123');
--
-- Desde DataGrip (FUNCTION, para probar lo mismo):
--   SELECT fn_ajustar_precios_categoria('Panadería', 10);   -- devuelve nº de productos
--   SELECT fn_crear_cajero('Carolina','Mendoza','1.090.111.222','Cajero','carolina.mendoza','temporal123');
--
-- Desde la app (data.js), la FUNCTION se llama por rpc:
--   window.db.rpc('fn_ajustar_precios_categoria', { p_categoria: 'Panadería', p_porcentaje: 10 });
--   window.db.rpc('fn_crear_cajero', { p_nombres:'Carolina', ... });
-- ============================================================================

-- Limpieza / rollback:
--   DROP PROCEDURE IF EXISTS sp_ajustar_precios_categoria(TEXT, NUMERIC);
--   DROP PROCEDURE IF EXISTS sp_crear_cajero(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
--   DROP FUNCTION  IF EXISTS fn_ajustar_precios_categoria(TEXT, NUMERIC);
--   DROP FUNCTION  IF EXISTS fn_crear_cajero(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
