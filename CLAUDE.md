# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es esto

InvenPro es un prototipo de punto de venta + gestión de inventario para un contexto de
comercio colombiano (moneda COP, interfaz en español). Es una **aplicación de una sola
página sin build**: React 18 + JSX transpilado **en el navegador** por Babel standalone,
con todas las dependencias cargadas desde CDNs y Supabase como backend. No hay bundler, no
hay `package.json`, no hay `node_modules` y no hay suite de pruebas.

## Ejecutar / compilar / desplegar

- **Ejecutar localmente:** sirve la raíz del repo como archivos estáticos y abre
  `index.html` — por ejemplo `npx serve` o `python -m http.server`. **No** lo abras con
  `file://` (Babel/CDN + Supabase necesitan `http://`). No hay paso de compilación; los
  cambios en `.jsx`/`.js` se toman al recargar el navegador.
- **No existen comandos de build / lint / test.** La verificación es manual en el
  navegador. Revisa la consola de devtools: una declaración duplicada de nivel superior
  (ver abajo) aparece ahí como error "already declared" y deja la app en blanco.
- **Desplegar:** Vercel sirve los archivos estáticos. `vercel.json` reescribe cualquier
  ruta a `/index.html` (fallback de SPA). Hacer push a la rama por defecto dispara el
  despliegue.

## La única regla arquitectónica que gobierna todo: scope global compartido

Cada archivo `.jsx`/`.js` se carga como **script clásico** (`<script type="text/babel">`),
no como módulo ES. Todos comparten **un único scope léxico global**. Consecuencias:

- Un `const`/`let`/`function`/`class` de nivel superior en *cualquier* archivo es visible
  para *todos* los demás. Cada nombre debe declararse **exactamente una vez en todo el
  código**, o la segunda declaración lanza "already declared" y rompe la carga entera de
  la app.
- Por eso los alias de hooks de React se declaran una sola vez por consumidor con nombres
  distintos (`useStateA`/`useMemoA` en `admin-utils.js`, `useStateApp` en `app.jsx`,
  `useState` en `cashier.jsx`). Nunca redeclares un alias que ya existe en otro archivo.
- Los componentes se referencian entre sí como globales pelados (`<Sidebar/>`,
  `<Dashboard/>`), no con imports. Los helpers compartidos entre archivos se exponen
  asignándolos a `window` (ver `data.js` y el `Object.assign(window, {...})` al final de
  `admin-utils.js`).

**El orden de carga en `index.html` es significativo y debe conservarse.** En el head cargan,
en orden: `supabase.lib.js` → `supabase.js` → **toda la capa SOLID `src/invenpro/`** (en orden
de dependencias: `core/` → `domain/` → `repositories/` → `factory/` → `services/` → `store/` →
`application/`, cada una con su `index.js` barrel) → el módulo **`resumen/`** (contrato →
estrategias → servicio → `composition.js`) → y por último el shim **`data.js`**, que cablea todo
con inyección de dependencias y crea `window.db`, `window.DB`, `window.MOCK` y `window.EventBus`.
Los scripts del body (`.jsx` de vista) deben cargar `admin-utils.js` **antes** de los
`admin-*.jsx`, estos **antes** de `admin.jsx`, y este **antes** de `app.jsx` (que monta el root).
`app.jsx` llama a `window.hydrateData()` cuando el shim ya existe.

## Capa de datos — arquitectura SOLID (`src/invenpro/`) + shim (`data.js`)

La lógica de datos NO vive en `data.js` (eso era el monolito viejo, ya obsoleto). Ahora está
en la capa **SOLID** bajo `src/invenpro/`, en capas por responsabilidad:

- **`core/`** — `BaseEntity`, `BaseService` (template methods `_findAll/_insert/_update/_rpc`…),
  `BaseRepository`, `EventBus`, `ServiceContainer`, `Sanitizer`, `HelperUtils`, `interfaces`.
- **`domain/`** — las 6 entidades (`Producto`, `Usuario`, `Cajero`, `Proveedor`, `Turno`,
  `Factura`) con **campos privados `#`** y getters/setters. `Factura` incluye `pagos` (desglose
  del pago mixto).
- **`repositories/`** — un repositorio por tabla + `RepositoryFactory`. `FacturaRepository`
  trae items y pagos (`select "*, factura_items(*), factura_pagos(*)"`).
- **`services/`** — `AuthService`, `ProductoService`, `FacturaService`, `TurnoService`,
  `CajeroService`, `ProveedorService`, `IngresoService`, `ConfigService`, `CierreService`.
- **`store/`** — `DataStore` (estado + `hydrate()`), `RealtimeManager`, `ViewRefresher`,
  `DetalleRefetcher`, `handlers/GenericHandler`.
- **`application/`** — use cases + controllers por módulo.

Módulos de dominio aparte con su propia composición (DI): **`facturacion/`** (ProveedorDIAN /
ProveedorInterno, patrón Estrategia) y **`resumen/`** (`IResumenStrategy` + `PorCajeroStrategy`
+ `PorHoraStrategy` + `ResumenDiarioService` → expone `window.Resumenes.porCajero`/`porHora`
para el Dashboard; el "corte del día" es diario y automático).

**`data.js` es un *shim* delgado (composition root):** instancia repos/servicios con inyección
de dependencias y expone la superficie de compatibilidad que consumen los `.jsx`:

- **`window.DB`** — servicios con namespace. Llama siempre por el namespace: `DB.auth.login`,
  `DB.productos.create/update/incrementStock/ajustarPreciosCategoria`, `DB.facturas.create`
  (persiste factura + items + `factura_pagos`), `DB.turnos.create/close`, `DB.cajeros.update/
  updateUsuario/create`, `DB.cierres.create/getAll`, `DB.proveedores.*`, `DB.ingresos.*`,
  `DB.config.*`. **No** existe un `DB.login` plano. Los servicios hablan con Supabase vía `window.db`.
- **`window.MOCK`** = la instancia de `DataStore`. `MOCK.productos`/`facturas`/`cierres`… son
  arreglos de **instancias de entidad** (no filas planas). `window.hydrateData()` llama a
  `DataStore.hydrate()` (carga todas las tablas) y arranca el realtime.
- Los **helpers** (`camelize`, `snakify`, `hashPass`, `fmtCOP`, `daysFromNow`…) se exponen en
  `window` desde el shim para compat con los `.jsx`.
- **camelCase ↔ snake_case:** las columnas de la BD son snake_case; el JS usa camelCase.
  `camelize()` en lecturas, `snakify()` en escrituras. Tenlo presente al agregar campos.
- **Realtime:** `EventBus` + `RealtimeManager` suscriben un único canal de Supabase a
  `postgres_changes` (lista `REALTIME_TABLES` en `RealtimeManager.js`: productos, cajeros,
  usuarios_sistema, proveedores, turnos, facturas, factura_items, **factura_pagos**, ingresos,
  ingreso_detalle, configuracion), mutan `window.MOCK` y emiten `realtime:<tabla>`. Los
  componentes usan el hook `useRealtimeSync(tablas)`.
  - **Protege los modales del re-render de realtime:** un re-render a mitad de edición nunca
    debe resetear el formulario a vacío y persistir vacíos sobre datos reales. Inicializa el
    estado desde la BD y conserva lo existente (`v => v || nuevoValor`); realtime solo rellena
    campos vacíos, nunca sobrescribe ediciones del usuario.

**Para agregar lógica de datos nueva:** ponla en la capa SOLID (nuevo método en el `*Service`,
o una entidad/estrategia nueva), expónla en `data.js` (window.DB.x) si un `.jsx` la necesita.
No vuelvas a meter lógica monolítica en `data.js`.

## Flujo de datos por rol

`app.jsx` es el root: lee/escribe la sesión en `localStorage` (`invenpro-session`) y
alterna `stage` entre `login` → (`shift-open` → `pos` → `shift-closed`) para cajeros, o
`admin` para administradores/supervisores. El rol + los permisos (no una selección manual)
deciden la vista. El shell de admin renderiza un componente de funcionalidad por cada
`adminPage`.

- `login.jsx` — pantalla de autenticación.
- `cashier.jsx` — el flujo POS (`ShiftOpen`, `POS`, `ShiftClosed`). Persiste ventas con
  `DB.facturas.create` y los totales del turno con `DB.turnos.close`.
- El panel admin está **partido** (antes era un `admin.jsx` monolítico): `admin-utils.js`
  contiene todos los helpers admin compartidos + la única declaración del alias
  `useStateA`/`useMemoA`; cada `admin-*.jsx` es dueño de una funcionalidad (sidebar,
  dashboard, inventario, ingreso, vencimientos, proveedores, cajeros); `admin.jsx` ahora
  solo contiene `Reportes` + `Ajustes`.
- `ui.jsx` — primitivos compartidos (`Icon`, `Modal`, `Toast`, `ChartCanvas`, paginación).

## Reglas de negocio a preservar

- **Un turno abierto por cajero.** Garantizado en `ShiftOpen.handleOpen` (bloquea + ofrece
  "reanudar") *y* por un índice único parcial en Supabase (vive solo en la BD, no en el
  repo). `ShiftOpen` (`DB.turnos.create`) es el único punto que crea turnos.
- **El logout no cierra el turno** (el botón "Salir sin cerrar turno" es intencional); el
  turno queda `abierto` y el login lo reanuda. Solo "Cerrar turno" (`DB.turnos.close`) lo
  cierra.
- **Las categorías de producto no tienen tabla.** Son una lista JSON en `configuracion`
  (clave `categorias`), sincronizada por realtime. Usa `getCategorias()` (en
  `admin-ingreso.jsx`) para cualquier select de categoría — hace merge de la lista de
  config con las categorías que ya usan los productos. "General" es el fallback fijo.
- **Pago mixto.** El cobro en el POS (`PaymentModal` en `cashier.jsx`) reparte el total entre
  medios (Efectivo/Transferencia/Nequi/Daviplata). La factura se guarda con `metodo="Mixto"`
  (o el único medio) y su desglose en `factura_pagos` (1 fila por medio). Reportes
  (`admin.jsx` → `byMetodo`) distribuye por el **medio real** desde `factura_pagos`; una factura
  "Mixto" sin `pagos` cargados se omite (llegan por hidratación/realtime).
- **Cierre de caja (arqueo).** "Cerrar turno" (`CloseShiftModal` + `closeShift`) marca el turno
  `cerrado`, acumula el desglose por medio en `turnos.por_metodo` (JSONB) y registra el arqueo en
  `cierres_caja` (base, ventas por medio, esperado/contado, diferencia, observaciones) vía
  `DB.cierres.create`. Admin lo consulta en Cajeros → Turnos → botón "Detalle"
  (`CierreDetalleModal`). Tablas: `factura_pagos`, `cierres_caja`, columna `turnos.por_metodo`
  (ya existen en la BD; sin DDL pendiente).
- **Sesión persistente.** `app.jsx` guarda y **restaura** `stage`/`user`/`shift` desde
  `localStorage` (`invenpro-session`): recargar durante un turno mantiene el POS. `onLogout`
  limpia la sesión (`_ssClear`).

## Estilos: tokens CSS + prefijo Tailwind `tw-`

- `styles.css` es dueño de los tokens (CSS custom properties), la estructura de
  componentes (`.card`, `.btn`, `.modal`, `.tbl`), animaciones y el tema claro/oscuro vía
  `[data-theme="dark"]`.
- Tailwind (CDN) está configurado con el **prefijo `tw-`** y **preflight desactivado**,
  para que coexista sin pisar el reset CSS existente ni los nombres de clase. Sus colores
  de tema mapean a las CSS custom properties, así que el modo oscuro funciona automático:
  **nunca uses la variante `dark:` de Tailwind**.
- **Haz el trabajo responsive con utilidades `tw-` en el JSX, no con media queries a
  mano.** Patrones estándar: colapsar columnas `tw-grid-cols-1 sm:tw-grid-cols-2`;
  mostrar/ocultar `tw-hidden md:tw-block`; las tablas usan el patrón dual `<table>` de
  escritorio + lista de tarjetas en móvil. **No** agregues Bootstrap — sus nombres de
  clase colisionan con los propios de la app. Breakpoints: sm=640, md=768, lg=1024.

## Sistema de tema / "tweaks"

`tweaks.jsx` + `tweaks-panel.jsx` implementan un panel de tema en vivo (paleta vibe,
densidad, acabado) que escribe variables CSS inline que sobrescriben los tokens de
`styles.css`. Los valores por defecto se guardan entre los marcadores
`/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` — un host externo edita esos marcadores, así que
mantén los marcadores intactos y mantén los defaults de tweaks sincronizados con los
tokens del "Tema v2" en `styles.css`.

## Artefactos auxiliares sin seguimiento

`gen_*.py` (generadores de PPTX), `models.js` y `gen_uml_pptx.py` son artefactos de
documentación/UML. **No** los carga `index.html`. En particular, **no** agregues `models.js`
a la página — sus clases chocarían (bajo la regla del scope global) con las de la capa SOLID
(`src/invenpro/domain/`). Las clases de dominio reales son las de `src/invenpro/domain/`,
no las de `models.js`.
