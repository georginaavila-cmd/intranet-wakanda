// Intranet Wakanda Travel · avisos por correo del módulo Proyectos
//  - accion "asignada": la llama la intranet cuando la gerencia asigna una tarjeta a alguien con cuenta.
//  - accion "vencidas": la llama una tarea programada (pg_cron) cada mañana; avisa una sola vez por tarjeta vencida.
// Los avisos quedan marcados en la tarjeta (aviso_asignado_a, aviso_vencida), así nunca se repiten.
//
// Envío: con Resend (secreto RESEND_API_KEY) o con Gmail / Google Workspace (secretos SMTP_USUARIO y SMTP_CLAVE,
// esta última una "contraseña de aplicación"). Remitente: secreto CORREO_REMITENTE (por defecto, SMTP_USUARIO).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const INTRANET = "https://georginaavila-cmd.github.io/intranet-wakanda/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaLarga = (d?: string | null) => d ? `${Number(d.slice(8, 10))} de ${MESES[Number(d.slice(5, 7)) - 1]} de ${d.slice(0, 4)}` : "sin fecha";
const hoyBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

async function enviar(para: string, copia: string[], asunto: string, html: string) {
  const resend = Deno.env.get("RESEND_API_KEY");
  const usuario = Deno.env.get("SMTP_USUARIO"), clave = Deno.env.get("SMTP_CLAVE");
  const remitente = Deno.env.get("CORREO_REMITENTE") || usuario || "";
  if (resend) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Intranet Wakanda Travel <${remitente}>`, to: [para], cc: copia.length ? copia : undefined, subject: asunto, html }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    return;
  }
  if (usuario && clave) {
    const cliente = new SMTPClient({ connection: { hostname: Deno.env.get("SMTP_SERVIDOR") || "smtp.gmail.com", port: 465, tls: true, auth: { username: usuario, password: clave } } });
    try { await cliente.send({ from: `Intranet Wakanda Travel <${remitente}>`, to: para, cc: copia.length ? copia : undefined, subject: asunto, html, content: "auto" }); }
    finally { await cliente.close(); }
    return;
  }
  throw new Error("Falta configurar el envío de correos (RESEND_API_KEY, o SMTP_USUARIO y SMTP_CLAVE).");
}

// Plantilla sencilla, compatible con los clientes de correo (tablas y estilos en línea).
function plantilla(o: { alerta?: boolean; titulo: string; intro: string; tarea: Record<string, string>; boton: string }) {
  const filas = Object.entries(o.tarea).map(([k, v]) =>
    `<tr><td style="padding:6px 0;color:#6b7a90;font-size:13px;width:140px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#1d2b40;font-size:14px;font-weight:600">${v}</td></tr>`).join("");
  const banda = o.alerta
    ? `<tr><td style="background:#c62828;color:#ffffff;padding:16px 24px;font-size:16px;font-weight:700">&#9888; TAREA VENCIDA</td></tr>`
    : `<tr><td style="background:#00a39b;color:#ffffff;padding:16px 24px;font-size:16px;font-weight:700">Nueva tarea asignada</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f1f4f8;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f4f8;padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${o.alerta ? "#e57373" : "#dde5ef"}">
    ${banda}
    <tr><td style="padding:22px 24px 8px"><h1 style="margin:0 0 10px;font-size:20px;color:${o.alerta ? "#b71c1c" : "#1b3a63"}">${esc(o.titulo)}</h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#3d4b60">${o.intro}</p>
      ${o.alerta ? `<div style="background:#fdecea;border-left:4px solid #c62828;padding:10px 14px;border-radius:6px;color:#b71c1c;font-size:14px;margin-bottom:14px"><b>La fecha límite ya pasó.</b> Actualiza el avance o registra en el seguimiento qué falta y cuándo quedará lista.</div>` : ""}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6ecf3;border-bottom:1px solid #e6ecf3;margin-bottom:18px">${filas}</table>
      <a href="${INTRANET}" style="display:inline-block;background:${o.alerta ? "#c62828" : "#00a39b"};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;font-size:14px">${esc(o.boton)}</a>
    </td></tr>
    <tr><td style="padding:18px 24px 22px;font-size:12px;color:#8592a6">Aviso automático de la intranet de Wakanda Travel. Encuentras la tarjeta en la pestaña <b>Mis tareas</b>.</td></tr>
  </table></td></tr></table></body></html>`;
}

const PRIORIDAD: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, servicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, servicio, { auth: { persistSession: false } });
  let cuerpo: { accion?: string; tarea_id?: number } = {};
  try { cuerpo = await req.json(); } catch (_) { /* sin cuerpo */ }

  const datosTarea = async (t: any) => {
    const [{ data: p }, { data: proy }, { data: autor }] = await Promise.all([
      db.from("perfiles").select("nombre,correo,activo").eq("id", t.responsable_id).maybeSingle(),
      db.from("proyectos").select("nombre").eq("id", t.proyecto_id).maybeSingle(),
      t.creado_por ? db.from("perfiles").select("nombre,correo,activo").eq("id", t.creado_por).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { p, proy, autor };
  };

  if (cuerpo.accion === "asignada") {
    // Solo la gerencia asigna tarjetas.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const [{ data: ger }, { data: yo }] = await Promise.all([comoUsuario.rpc("es_gerencia"), comoUsuario.auth.getUser(token)]);
    if (!ger || !yo?.user) return responder({ error: "No tienes permiso." }, 403);
    const { data: t } = await db.from("tareas").select("*").eq("id", Number(cuerpo.tarea_id)).maybeSingle();
    if (!t || !t.responsable_id) return responder({ enviado: false, motivo: "sin responsable interno" });
    if (t.aviso_asignado_a === t.responsable_id) return responder({ enviado: false, motivo: "ya avisado" });
    if (t.responsable_id === yo.user.id) { await db.from("tareas").update({ aviso_asignado_a: t.responsable_id }).eq("id", t.id); return responder({ enviado: false, motivo: "asignada a sí mismo" }); }
    const { p, proy } = await datosTarea(t);
    if (!p || !p.activo || !p.correo) return responder({ enviado: false, motivo: "sin correo" });
    const { data: quien } = await db.from("perfiles").select("nombre").eq("id", yo.user.id).maybeSingle();
    try {
      await enviar(p.correo, [], `Nueva tarea asignada: ${t.titulo}`, plantilla({
        titulo: t.titulo,
        intro: `Hola ${esc(p.nombre.split(" ")[0])}, ${esc(quien?.nombre || "la gerencia")} te asignó una tarea en el proyecto <b>${esc(proy?.nombre || "")}</b>.`,
        tarea: { Proyecto: esc(proy?.nombre || ""), "Fecha límite": esc(fechaLarga(t.fecha_limite)), Prioridad: esc(PRIORIDAD[t.prioridad] || "Media"), ...(t.descripcion ? { Detalle: esc(t.descripcion).replace(/\n/g, "<br>") } : {}) },
        boton: "Ver mis tareas",
      }));
    } catch (e) { return responder({ error: String((e as Error).message || e) }, 502); }
    await db.from("tareas").update({ aviso_asignado_a: t.responsable_id }).eq("id", t.id);
    return responder({ enviado: true });
  }

  if (cuerpo.accion === "vencidas") {
    // Puede llamarse varias veces: solo avisa las tarjetas vencidas que aún no tienen aviso.
    const hoy = hoyBogota();
    const { data: lista, error } = await db.from("tareas").select("*")
      .lt("fecha_limite", hoy).neq("columna", "hecho").not("responsable_id", "is", null).is("aviso_vencida", null).limit(200);
    if (error) return responder({ error: error.message }, 500);
    const resultado = { avisadas: 0, fallidas: 0, errores: [] as string[] };
    for (const t of lista || []) {
      const { p, proy, autor } = await datosTarea(t);
      if (!p || !p.activo || !p.correo) { await db.from("tareas").update({ aviso_vencida: hoy }).eq("id", t.id); continue; }
      const copia = autor && autor.activo && autor.correo && autor.correo !== p.correo ? [autor.correo] : [];
      const dias = Math.round((Date.parse(hoy) - Date.parse(t.fecha_limite)) / 864e5);
      try {
        await enviar(p.correo, copia, `⚠ Tarea vencida: ${t.titulo}`, plantilla({
          alerta: true, titulo: t.titulo,
          intro: `Hola ${esc(p.nombre.split(" ")[0])}, esta tarea del proyecto <b>${esc(proy?.nombre || "")}</b> venció hace <b style="color:#c62828">${dias} día${dias === 1 ? "" : "s"}</b> y todavía no está en Hecho.`,
          tarea: { Proyecto: esc(proy?.nombre || ""), "Fecha límite": `<span style="color:#c62828">${esc(fechaLarga(t.fecha_limite))}</span>`, Avance: `${t.avance || 0} %`, Prioridad: esc(PRIORIDAD[t.prioridad] || "Media") },
          boton: "Actualizar la tarea",
        }));
        await db.from("tareas").update({ aviso_vencida: hoy }).eq("id", t.id);
        resultado.avisadas++;
      } catch (e) { resultado.fallidas++; resultado.errores.push(String((e as Error).message || e)); }
    }
    return responder(resultado);
  }

  return responder({ error: "Acción no válida." }, 400);
});
