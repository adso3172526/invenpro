// ════════════════════════════════════════════════════════════════════════
//  MÓDULO FACTURACIÓN · CAPA DE SERVICIO + RAÍZ DE COMPOSICIÓN
// ────────────────────────────────────────────────────────────────────────
//  FacturacionService coordina el flujo de una venta (emitir → guardar →
//  descontar stock). NO conoce Supabase ni la DIAN: solo los CONTRATOS.
//  Recibe las implementaciones concretas por el constructor (inyección de
//  dependencias).
//
//  Principios: DIP (depende de abstracciones; dependencias inyectadas, sin
//  `new` propio) · SRP (solo reglas del flujo) · Encapsulamiento (guarda sus
//  dependencias como estado interno this._repositorio / this._proveedor).
//
//  Se carga ÚLTIMO del módulo: necesita el repositorio y el proveedor, y
//  data.js (para sobrescribir window.DB.facturas).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  // Implementaciones concretas compartidas por window (ya cargadas).
  const { SupabaseFacturaRepositorio, ProveedorInterno } = window;

  class FacturacionService {
    /**
     * @param {IFacturaRepositorio} repositorio  cómo se persiste (inyectado)
     * @param {IProveedorFactura}   proveedor     cómo se emite   (inyectado)
     */
    constructor(repositorio, proveedor) {
      this._repositorio = repositorio;
      this._proveedor = proveedor;
    }

    /** Registra una venta completa. Misma firma que el servicio anterior. */
    async create(factura, items) {
      const emision = await this._proveedor.emitir(factura);   // 1) emitir (estrategia)
      await this._repositorio.guardar(factura, items);         // 2) persistir
      await this._repositorio.descontarStock(items);           // 3) descontar stock
      return emision;
    }

    /**
     * Genera el siguiente id de factura ÚNICO consultando el consecutivo más
     * alto "F-#####" DIRECTAMENTE en la BD (no en MOCK, que puede quedar
     * desactualizado si el realtime pierde un INSERT) y sumándole 1.
     */
    async generarId() {
      let max = 10309; // base: sin facturas, el primer id es "F-10310"
      try {
        const { data } = await window.db.from("facturas")
          .select("id").like("id", "F-%")
          .order("id", { ascending: false }).limit(1).maybeSingle();
        if (data && data.id) {
          const m = String(data.id).match(/^F-(\d+)$/);
          if (m) max = parseInt(m[1], 10);
        }
      } catch (e) { console.error("generarId:", e); }
      return "F-" + (max + 1);
    }
  }

  window.FacturacionService = FacturacionService;

  // ── RAÍZ DE COMPOSICIÓN ──────────────────────────────────────────────
  // El ÚNICO lugar con `new`: arma las implementaciones concretas y las
  // INYECTA en el servicio. Cambiar de proveedor/repositorio = una línea.
  // Sobrescribe window.DB.facturas (creado en data.js) con esta versión.
  if (window.DB) {
    window.DB.facturas = new FacturacionService(
      new SupabaseFacturaRepositorio(),
      new ProveedorInterno()
    );
  } else {
    console.error("[facturacion] window.DB no existe; ¿se cargó data.js antes?");
  }
})();
