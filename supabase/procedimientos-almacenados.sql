-- ============================================================================
-- InvenPro · Procedimientos almacenados + funciones (entregable académico)
-- ----------------------------------------------------------------------------
-- Arquitectura: la lógica vive UNA sola vez en cada FUNCTION; el PROCEDURE la
-- reutiliza llamándola (un PROCEDURE puede llamar a una FUNCTION, no al revés).
--   fn_*  (FUNCTION)  -> lógica. La llama la APP por rpc y el procedimiento. Devuelve valor.
--   sp_*  (PROCEDURE) -> entregable. Se invoca con CALL (DataGrip) y delega en la función.
-- Ejecutar en el SQL Editor de Supabase (o DataGrip) UN bloque a la vez (por los $$).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


-- ============================================================================
-- #1 · AJUSTE DE PRECIOS POR CATEGORÍA
-- ============================================================================
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
  IF p_porcentaje IS NULL OR p_porcentaje <= -100 THEN
    RAISE EXCEPTION 'Porcentaje inválido: % (debe ser mayor que -100).', p_porcentaje;
  END IF;
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
-- ----------------------------------------------------------------------------
-- Inserta cajero Y usuario de login de forma atómica. Valida rol, contraseña,
-- documento y usuario duplicados; genera id C-NN; permisos por rol; hash SHA-256.
-- El DOCUMENTO se NORMALIZA a solo dígitos, así "1.090.111.222" y "1090111222"
-- se tratan como el MISMO documento (evita duplicados por diferencia de formato).
-- ============================================================================
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
  v_doc      TEXT;
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

  -- Normaliza el documento a SOLO DÍGITOS (quita puntos/espacios/guiones)
  v_doc := regexp_replace(COALESCE(p_doc, ''), '\D', '', 'g');
  IF v_doc = '' THEN
    RAISE EXCEPTION 'El documento es obligatorio y debe contener dígitos.';
  END IF;

  -- Validación 3: documento no duplicado (comparando normalizado contra normalizado)
  IF EXISTS (SELECT 1 FROM cajeros WHERE regexp_replace(doc, '\D', '', 'g') = v_doc) THEN
    RAISE EXCEPTION 'Ya existe un cajero con el documento %.', v_doc;
  END IF;

  v_usuario := lower(trim(p_usuario));

  -- Validación 4: usuario de login obligatorio y no duplicado
  IF v_usuario IS NULL OR v_usuario = '' THEN
    RAISE EXCEPTION 'El usuario de login es obligatorio.';
  END IF;
  IF EXISTS (SELECT 1 FROM usuarios_sistema WHERE usuario = v_usuario) THEN
    RAISE EXCEPTION 'Ya existe el usuario "%".', v_usuario;
  END IF;

  v_nombre := trim(p_nombres) || ' ' || trim(p_apellidos);

  -- Siguiente id consecutivo C-NN
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

  -- INSERT 1: el cajero (doc normalizado)
  INSERT INTO cajeros (id, nombre, doc, rol, estado, turno_activo, ingreso, ventas_30d)
  VALUES (v_id, v_nombre, v_doc, p_rol, 'activo', false, current_date, 0);

  -- INSERT 2: su usuario de login (si falla, el INSERT 1 también se revierte)
  INSERT INTO usuarios_sistema (usuario, pass, nombre, rol, permisos)
  VALUES (v_usuario, v_hash, v_nombre, p_rol, v_permisos);

  RETURN v_id;
END;
$$;

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
--   CALL sp_ajustar_precios_categoria('Panadería', 10);          -- +10%
--   CALL sp_crear_cajero('Carolina','Mendoza','1.090.111.222',   -- se guarda 1090111222
--                        'Cajero','carolina.mendoza','temporal123');
--   SELECT fn_ajustar_precios_categoria('Panadería', 10);         -- devuelve nº de productos
--   SELECT fn_crear_cajero('Ana','Ruiz','1020304050','Cajero','ana.ruiz','clave123');
-- La app llama las FUNCTIONS por rpc:
--   window.db.rpc('fn_ajustar_precios_categoria', { p_categoria, p_porcentaje });
--   window.db.rpc('fn_crear_cajero', { p_nombres, ... });
-- ============================================================================
