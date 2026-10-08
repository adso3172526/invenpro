// ════════════════════════════════════════════════════════════════════════
//  ESTRATEGIA · PorHoraStrategy   (capa de agrupación)
//  Módulo Resumen Diario · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Agrupa las facturas del día por HORA (franja 0–23) y suma su total. Solo
//  recibe las facturas de HOY (el recorte lo hace el servicio), así que NO
//  es acumulado. Demuestra OCP + Polimorfismo: se agrega SIN modificar el
//  servicio ni PorCajeroStrategy — solo se crea esta clase y se registra en
//  la composición.
//  `factura.hora` se guarda como texto localizado ("04:31 p. m."), así que
//  se normaliza a hora 24h para agrupar bien (antes la vista ventas_hoy
//  agrupaba por el texto completo y el gráfico salía mal rotulado).
//  Principios: Polimorfismo · OCP · Herencia/LSP.
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IResumenStrategy } = window;

  class PorHoraStrategy extends IResumenStrategy {
    // "04:31 p. m." → 16 ; "9:05 a. m." → 9 ; "16:31" → 16
    _hora24(str) {
      const s = String(str || "");
      const m = s.match(/(\d{1,2}):(\d{2})\s*([ap])/i);
      if (m) {
        let h = parseInt(m[1], 10) % 12;
        if (/p/i.test(m[3])) h += 12;
        return h;
      }
      const m2 = s.match(/(\d{1,2}):(\d{2})/); // formato 24h de respaldo
      return m2 ? parseInt(m2[1], 10) : null;
    }

    agrupar(facturas) {
      const porHora = {};
      for (const f of facturas) {
        const h = this._hora24(f && f.hora);
        if (h == null || isNaN(h)) continue;
        if (!porHora[h]) porHora[h] = { hora: h, label: String(h).padStart(2, "0"), total: 0, transacciones: 0 };
        porHora[h].total += f.total || 0;
        porHora[h].transacciones += 1;
      }
      // De la hora más temprana a la más tardía
      return Object.values(porHora).sort((a, b) => a.hora - b.hora);
    }
  }

  window.PorHoraStrategy = PorHoraStrategy;
})();
