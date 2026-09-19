// ════════════════════════════════════════════════════════════════════════
//  SERVICIO · ResumenDiarioService   (capa de reglas de negocio · lectura)
//  Módulo Resumen Diario · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Encapsula el CORTE DEL DÍA (fecha real de hoy) y delega el agrupado a la
//  estrategia inyectada. El corte es diario y automático: al cambiar de día,
//  las facturas de ayer ya no coinciden, así que el total arranca de cero.
//  NO sabe CÓMO se agrupa (eso es la estrategia) → SRP + DIP.
//  Recibe su estrategia por el constructor (inyección de dependencias).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  class ResumenDiarioService {
    /** @param {IResumenStrategy} strategy  cómo se agrupa (inyectado) */
    constructor(strategy) {
      this._strategy = strategy;
    }

    /** Fecha real de hoy en formato YYYY-MM-DD (igual que factura.fecha). */
    hoy() {
      const d = new Date();
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
    }

    /**
     * Resume las ventas de un día: recorta al día indicado (hoy por defecto)
     * y delega el agrupado a la estrategia.
     * @returns {{ fecha:string, total:number, transacciones:number, grupos:Array }}
     */
    resumen(facturas, fecha) {
      const dia = fecha || this.hoy();
      const delDia = (facturas || []).filter(f => f && f.fecha === dia);
      return {
        fecha: dia,
        total: delDia.reduce((s, f) => s + (f.total || 0), 0),
        transacciones: delDia.length,
        grupos: this._strategy.agrupar(delDia),
      };
    }
  }

  window.ResumenDiarioService = ResumenDiarioService;
})();
