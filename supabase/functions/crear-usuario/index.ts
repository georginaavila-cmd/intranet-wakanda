// Intranet Wakanda Travel · administración de cuentas
// Crea cuentas, restablece contraseñas y desactiva personas. Solo la puede usar quien tenga es_admin.
// Corre en Supabase (Edge Functions) porque necesita la llave de servicio, que nunca va en la página.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const servicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1. ¿Quién llama? Debe ser administradora.
  const comoUsuario = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: esAdmin, error: errAdmin } = await comoUsuario.rpc("es_admin");
  if (errAdmin || !esAdmin) return responder({ error: "Solo la administración puede gestionar cuentas." }, 403);

  const admin = createClient(url, servicio, { auth: { persistSession: false } });
  let datos: Record<string, unknown>;
  try { datos = await req.json(); } catch { return responder({ error: "Datos inválidos." }, 400); }

  const contrasenaValida = (c: unknown) => typeof c === "string" && c.length >= 8;

  switch (datos.accion) {
    case "crear": {
      const { correo, nombre, sede_id, area_id, rol, contrasena } = datos as Record<string, string>;
      if (!correo || !nombre || !sede_id) return responder({ error: "Faltan correo, nombre o sede." }, 400);
      if (!contrasenaValida(contrasena)) return responder({ error: "La contraseña temporal debe tener al menos 8 caracteres." }, 400);
      const { data: u, error } = await admin.auth.admin.createUser({
        email: String(correo).trim().toLowerCase(),
        password: contrasena,
        email_confirm: true,                       // no se envía correo de confirmación
        user_metadata: { debe_cambiar_contrasena: true },
      });
      if (error) return responder({ error: error.message.includes("already") ? "Ya existe una cuenta con ese correo." : error.message }, 400);
      const { error: errPerfil } = await admin.from("perfiles").insert({
        id: u.user.id, nombre, correo: String(correo).trim().toLowerCase(),
        sede_id: Number(sede_id), area_id: area_id ? Number(area_id) : null, rol: rol ?? "colaborador",
      });
      if (errPerfil) {
        await admin.auth.admin.deleteUser(u.user.id);   // no dejar cuentas a medias
        return responder({ error: errPerfil.message }, 400);
      }
      return responder({ ok: true, id: u.user.id });
    }
    case "restablecer": {
      const { id, contrasena } = datos as Record<string, string>;
      if (!id || !contrasenaValida(contrasena)) return responder({ error: "Falta la persona o la contraseña tiene menos de 8 caracteres." }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password: contrasena, user_metadata: { debe_cambiar_contrasena: true } });
      return error ? responder({ error: error.message }, 400) : responder({ ok: true });
    }
    case "desactivar":
    case "reactivar": {
      const { id } = datos as Record<string, string>;
      const activo = datos.accion === "reactivar";
      const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: activo ? "none" : "876000h" });
      if (error) return responder({ error: error.message }, 400);
      await admin.from("perfiles").update({ activo }).eq("id", id);
      return responder({ ok: true });
    }
    default:
      return responder({ error: "Acción desconocida." }, 400);
  }
});
