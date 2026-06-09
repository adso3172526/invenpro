// InvenPro — Helpers y utilidades globales
// Cargado ANTES de models.js — exporta camelize, snakify, hashPass, fmtCOP, etc.
(function () {
  const today = new Date(2026, 4, 8); // 8 de mayo 2026

  // ---------- helpers ----------
  const fmt = (d) => d.toISOString().slice(0, 10);

  // snake_case → camelCase
  function camelize(obj) {
    if (Array.isArray(obj)) return obj.map(camelize);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const cc = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[cc] = camelize(v);
      }
      return out;
    }
    return obj;
  }

  // camelCase → snake_case
  function snakify(obj) {
    if (Array.isArray(obj)) return obj.map(snakify);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const sk = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
        out[sk] = v;
      }
      return out;
    }
    return obj;
  }

  // ---------- Hash de contraseñas (SHA-256) ----------
  const hashPass = async (plain) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // ---------- Exponer globalmente ----------
  window.camelize = camelize;
  window.snakify = snakify;
  window.hashPass = hashPass;

  window.fmtCOP = function (n) {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n).toLocaleString("es-CO");
  };
  window.daysFromNow = function (dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const ms = d - today;
    return Math.round(ms / (1000 * 60 * 60 * 24));
  };
  window.todayStr = fmt(today);
})();
