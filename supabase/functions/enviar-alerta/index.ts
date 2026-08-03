// Edge Function: enviar-alerta
// Envía por correo (Gmail SMTP) las alertas de vencimiento de InvenPro.
//
// Dos modos:
//  1) MANUAL (desde el navegador): el body trae { tier, lbl, negocio,
//     destinatarios, productos } y se envía ese único tramo.
//  2) AUTOMÁTICO (desde el cron): el body es { auto: true }. La función lee de
//     la BD los productos, umbrales, destinatarios y criterios activos, calcula
//     los tramos y envía un correo por cada tramo activo que tenga productos.
//
// - Las credenciales de Gmail NO viajan desde el navegador: se leen aquí, en el
//   servidor, desde la tabla `configuracion` (claves correo_gmail_user y
//   correo_gmail_app_password) con el service role.
//
// Despliegue:
//   supabase functions deploy enviar-alerta
//
// La función usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, que Supabase inyecta
// automáticamente en el entorno de las Edge Functions (no hay que configurarlas).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

interface Producto {
  nombre?: string;
  sku?: string;
  vence?: string;
  dias?: number;
  stock?: number;
}
interface Destinatario {
  email: string;
  nombre?: string;
}
interface Negocio {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
}
interface Payload {
  auto?: boolean;
  tier?: string;
  lbl?: string;
  negocio?: string;
  destinatarios?: Destinatario[];
  productos?: Producto[];
}

// Días entre hoy (UTC) y una fecha YYYY-MM-DD. Negativo = ya vencido.
const diasHasta = (vence: string): number => {
  const hoy = new Date();
  const h = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const [y, m, d] = String(vence).split("-").map(Number);
  if (!y || !m || !d) return NaN;
  const v = Date.UTC(y, m - 1, d);
  return Math.round((v - h) / 86400000);
};

// Color de acento según el tramo (encabezado + borde de cada tarjeta).
const colorDe = (tier?: string) =>
  tier === "critico" ? "#dc2626" : tier === "atencion" ? "#d97706" : tier === "preventivo" ? "#2563eb" : "#4f46e5";

// Correo HTML responsive (mobile-first). Se usa layout de TABLAS anidadas —lo
// único que todos los clientes de correo respetan— con una TARJETA por producto,
// para que en móvil no haya desbordamiento ni scroll horizontal. La media query
// (contenedor 100%) es mejora progresiva sobre un layout que ya funciona a 320px.
const buildHtml = (negocio: Negocio, lbl: string, productos: Producto[], accent = "#4f46e5") => {
  // Línea de contacto del pie: solo los datos que existan, separados por " · "
  const contacto = [
    negocio.nit ? `NIT ${esc(negocio.nit)}` : "",
    negocio.direccion ? esc(negocio.direccion) : "",
    negocio.telefono ? `Tel. ${esc(negocio.telefono)}` : "",
    negocio.correo ? esc(negocio.correo) : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
  const cards = productos
    .map((p) => {
      const dias = typeof p.dias === "number"
        ? (p.dias < 0 ? `Vencido hace ${Math.abs(p.dias)} d` : `Restan ${p.dias} d`)
        : "";
      return `
      <tr><td style="padding:0 0 10px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #eaeaea;border-left:4px solid ${accent};border-radius:8px">
          <tr><td style="padding:12px 14px">
            <div style="font-size:15px;font-weight:600;color:#1a1a1a;line-height:1.3">${esc(p.nombre)}</div>
            ${p.sku ? `<div style="font-size:12px;color:#888;font-family:monospace;margin-top:2px">${esc(p.sku)}</div>` : ""}
            <div style="margin-top:8px;font-size:13px;color:#444;line-height:1.9">
              <span style="display:inline-block;margin-right:16px"><span style="color:#999">Vence:</span> ${esc(p.vence ?? "—")}</span>
              <span style="display:inline-block;margin-right:16px"><span style="color:#999">Stock:</span> ${esc(p.stock ?? "—")}</span>
              ${dias ? `<span style="display:inline-block;font-weight:600;color:${accent}">${dias}</span>` : ""}
            </div>
          </td></tr>
        </table>
      </td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f3f4f6}
  @media only screen and (max-width:600px){
    .container{width:100% !important}
    .px{padding-left:16px !important;padding-right:16px !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6">
    <tr><td align="center" style="padding:20px 10px">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
        <tr><td class="px" style="background:${accent};padding:18px 24px">
          <div style="color:#ffffff;font-size:18px;font-weight:700">🔔 Alerta de vencimiento</div>
          <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:2px">${esc(negocio.nombre)}</div>
        </td></tr>
        <tr><td class="px" style="padding:20px 24px">
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.5">
            ${productos.length} producto(s) en el tramo <b style="color:#1a1a1a">${esc(lbl)}</b>.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
        </td></tr>
        <tr><td class="px" style="padding:16px 24px;border-top:1px solid #eee">
          <div style="font-size:13px;font-weight:600;color:#444">${esc(negocio.nombre)}</div>
          ${contacto ? `<div style="font-size:12px;color:#888;margin-top:3px;line-height:1.6">${contacto}</div>` : ""}
          <div style="font-size:11px;color:#bbb;margin-top:8px">Enviado automáticamente por InvenPro</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "JSON inválido" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Credenciales de Gmail + datos del negocio (siempre desde la BD, lado servidor)
  const { data: credRows, error: credErr } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .in("clave", [
      "correo_gmail_user", "correo_gmail_app_password",
      "tienda_nombre", "tienda_nit", "tienda_direccion", "tienda_telefono", "tienda_correo",
    ]);
  if (credErr) return json({ ok: false, error: "No se pudo leer la configuración: " + credErr.message });

  const cfg: Record<string, string> = {};
  for (const r of credRows ?? []) cfg[r.clave] = r.valor;
  const user = (cfg["correo_gmail_user"] || "").trim();
  const pass = (cfg["correo_gmail_app_password"] || "").replace(/\s+/g, ""); // Google la muestra con espacios
  if (!user || !pass) {
    return json({ ok: false, error: "Configura el correo de alertas (usuario y contraseña de aplicación) en Ajustes." });
  }

  // Datos del negocio para encabezado y pie del correo
  const negocio: Negocio = {
    nombre: cfg["tienda_nombre"] || "InvenPro",
    nit: cfg["tienda_nit"] || "",
    direccion: cfg["tienda_direccion"] || "",
    telefono: cfg["tienda_telefono"] || "",
    correo: cfg["tienda_correo"] || "",
  };

  // Un cliente SMTP reutilizable para todos los envíos de esta invocación
  const client = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: user, password: pass } },
  });
  const enviarTramo = async (tier: string | undefined, neg: Negocio, lbl: string, productos: Producto[], destinatarios: Destinatario[]) => {
    await client.send({
      from: `InvenPro Alertas <${user}>`,
      to: destinatarios.map((d) => d.email),
      subject: `🔔 ${neg.nombre}: ${productos.length} producto(s) — ${lbl}`,
      content: "Tu cliente de correo no soporta HTML.",
      html: buildHtml(neg, lbl, productos, colorDe(tier)),
    });
  };

  // ─────────────── Modo AUTOMÁTICO (cron) ───────────────
  if (payload.auto === true) {
    const { data: allCfg, error: cErr } = await supabase
      .from("configuracion")
      .select("clave, valor")
      .in("clave", ["alerta_destinatarios", "alerta_umbrales", "alerta_tiers_correo"]);
    if (cErr) return json({ ok: false, error: "No se pudo leer la configuración de alertas: " + cErr.message });

    const conf: Record<string, string> = {};
    for (const r of allCfg ?? []) conf[r.clave] = r.valor;
    const parse = <T,>(s: string | undefined, def: T): T => { try { return s ? JSON.parse(s) as T : def; } catch { return def; } };

    const destinatarios = parse<Destinatario[]>(conf["alerta_destinatarios"], []).filter((d) => d?.email);
    const umbrales = parse(conf["alerta_umbrales"], { critico: 8, atencion: 15, preventivo: 30 });
    const tiersCorreo = parse(conf["alerta_tiers_correo"], { critico: true, atencion: true, preventivo: true });

    if (destinatarios.length === 0) return json({ ok: true, enviados: 0, nota: "Sin destinatarios configurados" });

    const { data: prods, error: pErr } = await supabase
      .from("productos")
      .select("sku, nombre, vence, stock")
      .not("vence", "is", null);
    if (pErr) return json({ ok: false, error: "No se pudieron leer los productos: " + pErr.message });

    const conDias = (prods ?? [])
      .map((p) => ({ ...p, dias: diasHasta(p.vence) }))
      .filter((p) => Number.isFinite(p.dias));

    const bucketDe = (t: string) => conDias.filter((p) => {
      const d = p.dias as number;
      if (t === "critico") return d >= 0 && d <= umbrales.critico;
      if (t === "atencion") return d > umbrales.critico && d <= umbrales.atencion;
      if (t === "preventivo") return d > umbrales.atencion && d <= umbrales.preventivo;
      return false;
    });
    const lblDe: Record<string, string> = {
      critico: `${umbrales.critico} días`,
      atencion: `${umbrales.atencion} días`,
      preventivo: `${umbrales.preventivo} días`,
    };

    const resumen: { tier: string; productos: number }[] = [];
    try {
      for (const t of ["critico", "atencion", "preventivo"]) {
        if (!(tiersCorreo as Record<string, boolean>)[t]) continue;
        const items = bucketDe(t);
        if (items.length === 0) continue;
        await enviarTramo(t, negocio, lblDe[t], items, destinatarios);
        resumen.push({ tier: t, productos: items.length });
      }
      await client.close();
    } catch (e) {
      try { await client.close(); } catch { /* ignore */ }
      return json({ ok: false, error: "Fallo al enviar: " + (e instanceof Error ? e.message : String(e)) });
    }
    return json({ ok: true, tramos: resumen, destinatarios: destinatarios.length });
  }

  // ─────────────── Modo MANUAL (navegador) ───────────────
  const destinatarios = (payload.destinatarios ?? []).filter((d) => d?.email);
  const productos = payload.productos ?? [];
  const lbl = payload.lbl ?? "vencimiento";
  // El navegador puede sobrescribir el nombre; el resto de datos salen de la BD.
  const negManual: Negocio = payload.negocio ? { ...negocio, nombre: payload.negocio } : negocio;

  if (destinatarios.length === 0) return json({ ok: false, error: "Sin destinatarios" });
  if (productos.length === 0) return json({ ok: false, error: "Sin productos en el tramo" });

  try {
    await enviarTramo(payload.tier, negManual, lbl, productos, destinatarios);
    await client.close();
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    return json({ ok: false, error: "Fallo al enviar: " + (e instanceof Error ? e.message : String(e)) });
  }
  return json({ ok: true, enviados: destinatarios.length });
});
