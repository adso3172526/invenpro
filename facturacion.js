// ════════════════════════════════════════════════════════════════════════
//  MÓDULO FACTURACIÓN — Refactor POO + SOLID
//  Taller de Arquitectura Backend · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Este archivo aísla el módulo "core" de facturación en capas:
//
//    Entidad  →  Servicio  →  Repositorio  →  (base de datos)
//                    ↓
//               Proveedor (estrategia de emisión)
//
//  Se carga DESPUÉS de data.js en index.html. Solo lee globals que ya
//  existen (window.db, camelize, snakify, window.Factura) y al final
//  reasigna window.DB.facturas, sobrescribiendo el servicio antiguo.
//  Así data.js queda prácticamente intacto (bajo riesgo).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════
  //  ABSTRACCIÓN — "Interfaces" (contratos)
  // ──────────────────────────────────────────────────────────────────────
  //  JavaScript no tiene la palabra `interface` como Java o C#. La forma
  //  idiomática de simular un contrato es una CLASE ABSTRACTA cuyos métodos
  //  lanzan un Error: obligan a las clases hijas a implementarlos.
  //
  //  Principios demostrados:
  //   · Abstracción → el resto del sistema depende de estos contratos,
  //                   no de una implementación concreta.
  //   · ISP         → contratos pequeños y específicos (una sola misión
  //                   cada uno), nada de "clases Dios".
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Contrato de PERSISTENCIA de facturas.
   * Cualquier repositorio de facturas (Supabase, memoria, otra BD…) debe
   * saber guardar la factura y descontar el stock vendido.
   */
  class IFacturaRepositorio {
    /**
     * Persiste el encabezado de la factura y sus ítems.
     * @param {object} factura  datos del encabezado
     * @param {Array}  items    líneas del carrito
     */
    async guardar(factura, items) {
      throw new Error("IFacturaRepositorio.guardar() debe ser implementado por una subclase");
    }

    /**
     * Descuenta del inventario las cantidades vendidas.
     * @param {Array} items  líneas vendidas
     */
    async descontarStock(items) {
      throw new Error("IFacturaRepositorio.descontarStock() debe ser implementado por una subclase");
    }
  }

  /**
   * Contrato de EMISIÓN de facturas.
   * Cada proveedor de facturación (interno, DIAN, un tercero…) decide CÓMO
   * se emite una factura. Es un punto de extensión (patrón Estrategia).
   */
  class IProveedorFactura {
    /**
     * Emite la factura según la estrategia concreta y devuelve el resultado
     * de la emisión (estado, folio, CUFE si aplica, etc.).
     * @param {object} factura
     * @returns {Promise<object>} resultado de la emisión
     */
    async emitir(factura) {
      throw new Error("IProveedorFactura.emitir() debe ser implementado por una subclase");
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  REPOSITORIO — Implementación concreta sobre Supabase
  // ──────────────────────────────────────────────────────────────────────
  //  El ÚNICO lugar de este módulo que conoce Supabase (window.db). Aísla
  //  toda la "plomería" de acceso a datos. Si mañana se migra de base de
  //  datos, solo se reescribe esta clase; el servicio queda intacto.
  //
  //  Principios demostrados:
  //   · Herencia   → `extends IFacturaRepositorio` (relación "es-un").
  //   · LSP        → puede reemplazar a su contrato sin romper al servicio.
  //   · SRP        → su única responsabilidad es hablar con la base de datos.
  // ══════════════════════════════════════════════════════════════════════

  class SupabaseFacturaRepositorio extends IFacturaRepositorio {
    /**
     * Persiste el encabezado en `facturas` y las líneas en `factura_items`.
     * (Misma lógica que el FacturaService original, ahora encapsulada aquí.)
     */
    async guardar(factura, items) {
      const { error: fErr } = await window.db.from("facturas").insert({
        id: factura.id, fecha: factura.fecha, hora: factura.hora,
        cajero: factura.cajero, metodo: factura.metodo, total: factura.total,
      });
      if (fErr) console.error("createFactura header:", fErr);

      const rows = items.map((it) => ({
        factura_id: factura.id, sku: it.sku, nombre: it.nombre, q: it.q, precio: it.precio,
      }));
      const { error: iErr } = await window.db.from("factura_items").insert(rows);
      if (iErr) console.error("createFactura items:", iErr);
    }

    /**
     * Descuenta el stock vendido llamando al RPC `decrement_stock` por ítem.
     */
    async descontarStock(items) {
      for (const it of items) {
        await window.db.rpc("decrement_stock", { p_sku: it.sku, p_qty: it.q });
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  ESTRATEGIAS — Proveedores de facturación (patrón Estrategia)
  // ──────────────────────────────────────────────────────────────────────
  //  Cada proveedor implementa `emitir()` a su manera. El servicio recibe
  //  UNA estrategia y la usa sin saber cuál es (polimorfismo).
  //
  //  Principios demostrados:
  //   · Polimorfismo → mismo método `emitir()`, comportamiento distinto
  //                    según la clase concreta.
  //   · OCP          → agregar un proveedor nuevo (Siigo, Alegra, otro
  //                    operador DIAN…) = crear una clase nueva aquí,
  //                    SIN modificar las estrategias existentes.
  //   · Herencia/LSP → ambas `extends IProveedorFactura`.
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Facturación INTERNA: la venta solo se registra en el sistema, sin
   * emisión electrónica. Es el comportamiento actual de InvenPro.
   */
  class ProveedorInterno extends IProveedorFactura {
    async emitir(factura) {
      // No hay trámite externo: la factura queda "emitida" internamente.
      return { estado: "EMITIDA_INTERNA", folio: factura.id, cufe: null };
    }
  }

  /**
   * Facturación electrónica ante la DIAN (SIMULADA).
   * Placeholder para una integración real futura. Demuestra que agregar un
   * proveedor nuevo NO obliga a tocar `ProveedorInterno` ni el servicio:
   * basta crear esta clase e inyectarla en la raíz de composición (OCP).
   */
  class ProveedorDIAN extends IProveedorFactura {
    async emitir(factura) {
      // Aquí iría la llamada real al operador tecnológico / API de la DIAN.
      // Por ahora simulamos la respuesta (un CUFE ficticio) para ilustrar
      // el polimorfismo: mismo método, resultado distinto al interno.
      const cufeSimulado = "CUFE-SIM-" + factura.id;
      return { estado: "EMITIDA_DIAN", folio: factura.id, cufe: cufeSimulado };
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  SERVICIO — Orquestador de la facturación (reglas de negocio)
  // ──────────────────────────────────────────────────────────────────────
  //  Coordina el flujo de una venta: emitir → guardar → descontar stock.
  //  NO sabe qué es Supabase ni qué es la DIAN: solo conoce los CONTRATOS
  //  (IFacturaRepositorio, IProveedorFactura). Recibe las implementaciones
  //  concretas por el constructor (inyección de dependencias).
  //
  //  Principios demostrados:
  //   · DIP            → depende de abstracciones, no de implementaciones.
  //                      Las dependencias se INYECTAN por constructor; el
  //                      servicio nunca hace `new` de un repo o proveedor.
  //   · SRP            → su única misión son las reglas del flujo de venta;
  //                      delega los datos al repo y la emisión al proveedor.
  //   · Encapsulamiento→ guarda sus dependencias como estado interno
  //                      (this._repositorio / this._proveedor).
  // ══════════════════════════════════════════════════════════════════════

  class FacturacionService {
    /**
     * @param {IFacturaRepositorio} repositorio  cómo se persiste (inyectado)
     * @param {IProveedorFactura}   proveedor     cómo se emite   (inyectado)
     */
    constructor(repositorio, proveedor) {
      this._repositorio = repositorio;
      this._proveedor = proveedor;
    }

    /**
     * Registra una venta completa. Misma firma que el servicio anterior
     * (factura, items) para que cashier.jsx no cambie.
     * @returns {Promise<object>} resultado de la emisión
     */
    async create(factura, items) {
      // 1) Emitir según la estrategia inyectada (interno, DIAN, …)
      const emision = await this._proveedor.emitir(factura);
      // 2) Persistir encabezado + líneas
      await this._repositorio.guardar(factura, items);
      // 3) Descontar del inventario lo vendido
      await this._repositorio.descontarStock(items);
      return emision;
    }
  }

  // ── Exponer contratos e implementaciones en window (instanceof / UML) ──
  Object.assign(window, {
    IFacturaRepositorio,
    IProveedorFactura,
    SupabaseFacturaRepositorio,
    ProveedorInterno,
    ProveedorDIAN,
    FacturacionService,
  });

  // ══════════════════════════════════════════════════════════════════════
  //  RAÍZ DE COMPOSICIÓN (Composition Root)
  // ──────────────────────────────────────────────────────────────────────
  //  El ÚNICO lugar del módulo donde se hace `new`. Aquí se "arman" las
  //  implementaciones concretas y se INYECTAN en el servicio. Cambiar de
  //  proveedor (p. ej. `new ProveedorDIAN()`) o de repositorio es un cambio
  //  de UNA sola línea, sin tocar ninguna otra clase (DIP + OCP).
  //
  //  Sobrescribe window.DB.facturas (creado en data.js) con la versión
  //  refactorizada. La firma pública `create(factura, items)` es idéntica,
  //  así que cashier.jsx sigue funcionando sin cambios.
  //
  //  El guard `if (window.DB)` es defensivo: si por algún motivo data.js no
  //  cargó antes, dejamos el servicio anterior en pie en vez de romper la
  //  app entera.
  // ══════════════════════════════════════════════════════════════════════
  if (window.DB) {
    window.DB.facturas = new FacturacionService(
      new SupabaseFacturaRepositorio(),
      new ProveedorInterno()
    );
  } else {
    console.error("[facturacion] window.DB no existe; ¿se cargó data.js antes?");
  }
})();
