// ════════════════════════════════════════════════════════════════════════
//  SERVICIO · FacturacionService   (capa de reglas de negocio)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Coordina el flujo de una venta (emitir → guardar → descontar). NO conoce
//  Supabase ni la DIAN: solo los contratos. Recibe sus dependencias por el
//  constructor (inyección de dependencias) y las guarda como estado interno.
//  Principios: DIP (depende de abstracciones, sin `new` propio) · SRP · Encaps.
//  La instancia se arma e inyecta en composition.js (raíz de composición).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

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
})();
