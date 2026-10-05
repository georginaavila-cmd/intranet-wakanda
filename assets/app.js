/* Intranet Wakanda Travel · aplicación
   Página estática (GitHub Pages) que habla con Supabase. Las reglas de seguridad viven en la base de datos (RLS):
   aquí solo se decide qué mostrar; lo que cada persona puede leer o cambiar lo decide Supabase. */
(() => {
'use strict';

const sb = window.supabase.createClient(window.WAKANDA_CONFIG.supabaseUrl, window.WAKANDA_CONFIG.supabaseKey);

/* ── Versión: si se publicó una nueva, recargar solo (el navegador guarda la página anterior hasta 10 minutos) ── */
const VERSION = (/[?&]v=([\w-]+)/.exec((document.currentScript || {}).src || '') || [])[1] || '';
async function revisarVersion() {
  if (!VERSION || location.protocol === 'file:') return;
  try {
    const html = await (await fetch('index.html?_=' + Date.now(), { cache: 'no-store' })).text();
    const nueva = (/assets\/app\.js\?v=([\w-]+)/.exec(html) || [])[1];
    if (nueva && nueva !== VERSION) {
      const clave = 'recarga-' + nueva;
      if (sessionStorage.getItem(clave)) return;          // evita recargar en bucle
      sessionStorage.setItem(clave, '1');
      location.replace(location.pathname + '?v=' + nueva);
    }
  } catch (_) {}
}
revisarVersion();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revisarVersion(); });

/* ── Íconos (Lucide, trazo 2px) ── */
const IC = {
  in: '<path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
  out: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
  lunch: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  back: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  clock: '<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
};
const ico = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || IC.file}</svg>`;
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ── Fechas y horas en la zona de cada sede ── */
const fechaEn = (tz, d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const horaEn = (tz, d = new Date()) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
const segEn = (tz, d = new Date()) => new Intl.DateTimeFormat('es-CO', { timeZone: tz, second: '2-digit' }).format(d).padStart(2, '0');
const toMin = hhmm => { if (!hhmm) return null; const [h, m] = hhmm.slice(0, 5).split(':').map(Number); return h * 60 + m; };
const hhmm = t => t ? t.slice(0, 5) : '';
const sumarDias = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const f = new Date(Date.UTC(y, m - 1, d + n)); return f.toISOString().slice(0, 10); };
const lunesDe = iso => { const [y, m, d] = iso.split('-').map(Number); const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return sumarDias(iso, dow === 0 ? -6 : 1 - dow); };
const fechaLarga = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }); };
const fechaCorta = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }); };
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ── Estado ── */
const S = {
  pantalla: 'cargando', error: '', aviso: '', usuario: null, perfil: null,
  sedes: [], areas: [], turnos: [], herramientas: [], personas: [], config: {},
  view: 'inicio', menu: false,
  hoy: { malla: null, marcas: [], semana: [] },
  malla: { lunes: null, sede: null, filas: [] },
  turnoSede: null,
  asistencia: { filas: [] },
  equipo: { claveNueva: null, filtro: '' },
  inf: { mes: null, sede: 0, area: 0, orden: 'minT', sel: null, datos: null },
  com: { lista: [], imgs: {}, lect: [], filtro: 'todos', q: '', borrador: [], hl: null },
  lb: null,
  sol: { lista: [], adj: {}, revisores: [], tipo: 'vacaciones', borrador: [], ausencias: [] }
};

const PASOS = [
  { k: 'entrada', code: 'ENT', lbl: 'Entrada', plan: 'entrada', ico: 'in', btn: 'Marcar entrada' },
  { k: 'salida_almuerzo', code: 'ALM', lbl: 'Salida a almuerzo', plan: 'salida_almuerzo', ico: 'lunch', btn: 'Salir a almorzar' },
  { k: 'regreso_almuerzo', code: 'REG', lbl: 'Regreso de almuerzo', plan: 'regreso_almuerzo', ico: 'back', btn: 'Marcar regreso' },
  { k: 'salida', code: 'SAL', lbl: 'Salida', plan: 'salida', ico: 'out', btn: 'Marcar salida' }
];

/* ── Permisos (solo para mostrar u ocultar; la base de datos decide de verdad) ── */
const P = () => S.perfil || {};
const esGerencia = () => P().rol === 'gerente' || P().es_admin;
const ROLES = { colaborador: 'Colaborador', supervisor: 'Supervisor', directora: 'Directora', gerente: 'Gerente' };
const gestionaCuentas = () => !!(P().es_admin || P().rol === 'supervisor');
// Quien gestiona cuentas sin ser administración solo toca colaboradores comunes, y nunca su propia cuenta.
const puedeTocarCuenta = x => x.id !== P().id && (P().es_admin || (x.rol === 'colaborador' && !x.es_admin));
// La malla la editan quienes lideran la sede y, además, los supervisores (en todas las sedes).
// Los supervisores también editan los horarios de los turnos, en todas las sedes.
const editaMalla = sedeId => lideraSede(sedeId) || P().rol === 'supervisor';
const esLider = () => esGerencia() || P().rol === 'directora';
const lideraSede = sedeId => esGerencia() || (P().rol === 'directora' && P().sede_id === sedeId);
const sede = id => S.sedes.find(s => s.id === id) || { nombre: '—', zona_horaria: 'America/Bogota' };
const area = id => S.areas.find(a => a.id === id) || { nombre: 'Sin área' };
const turno = id => S.turnos.find(t => t.id === id);
const persona = id => S.personas.find(p => p.id === id);
const miTz = () => sede(P().sede_id).zona_horaria;
const puedePublicar = () => esLider();
const tol = () => ({ entrada: 5, almuerzo: 5, ...(S.config.tolerancias ? { entrada: S.config.tolerancias.entrada_min, almuerzo: S.config.tolerancias.almuerzo_min } : {}) });
const claseTurno = t => !t ? 't-none' : ['M', 'T', 'S', 'D', 'V'].includes(t.codigo) ? `t-${t.codigo}` : (t.entrada ? 't-X' : 't-D');

/* ── Utilidades de interfaz ── */
let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 3200);
}
const errorTexto = e => {
  const m = (e && (e.message || e.error_description || e.error)) || String(e || '');
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/banned/i.test(m)) return 'Tu cuenta está desactivada. Habla con la administración.';
  if (/Password should be at least/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/same.*password|different from the old/i.test(m)) return 'La nueva contraseña debe ser distinta de la anterior.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  if (/row-level security/i.test(m)) return 'No tienes permiso para hacer este cambio.';
  return m.replace(/^.*?ERROR:\s*/, '');
};
async function q(promesa) { const { data, error } = await promesa; if (error) throw error; return data; }
// Trae todas las filas de una consulta, de 1.000 en 1.000 (Supabase entrega máximo 1.000 por vez).
async function todas(armar) { const out = []; for (let i = 0; ; i += 1000) { const d = await q(armar().range(i, i + 999)); out.push(...d); if (d.length < 1000) return out; } }
function render() { document.getElementById('app').innerHTML = vista(); }
function vista() {
  switch (S.pantalla) {
    case 'cargando': return '<div class="cargando">Cargando la intranet…</div>';
    case 'login': return loginView();
    case 'clave': return claveView(true);
    case 'datos': return datosView();
    case 'sinperfil': return sinPerfilView();
    default: return appView();
  }
}

/* ── Arranque y sesión ── */
async function iniciar() {
  const { data } = await sb.auth.getSession();
  if (!data.session) { S.pantalla = 'login'; render(); return; }
  await cargarUsuario(data.session.user);
}
async function cargarUsuario(user) {
  S.usuario = user; S.pantalla = 'cargando'; render();
  try {
    const [perfil, sedes, areas, turnos, herr, conf] = await Promise.all([
      q(sb.from('perfiles').select('*').eq('id', user.id).maybeSingle()),
      q(sb.from('sedes').select('id,nombre,zona_horaria').order('id')),
      q(sb.from('areas').select('id,nombre').order('id')),
      q(sb.from('turnos').select('*').order('sede_id').order('id')),
      q(sb.from('herramientas').select('*').eq('activo', true).order('orden')),
      q(sb.from('configuracion').select('clave,valor'))
    ]);
    S.perfil = perfil; S.sedes = sedes; S.areas = areas; S.turnos = turnos; S.herramientas = herr;
    S.config = Object.fromEntries(conf.map(c => [c.clave, c.valor]));
    if (!perfil || !perfil.activo) { S.pantalla = 'sinperfil'; render(); return; }
    if (user.user_metadata && user.user_metadata.debe_cambiar_contrasena) { S.pantalla = 'clave'; render(); return; }
    if (!perfil.acepto_datos) { S.pantalla = 'datos'; render(); return; }
    S.personas = await q(sb.from('perfiles').select('id,nombre,correo,sede_id,area_id,rol,es_admin,activo').order('nombre'));
    S.pantalla = 'app'; S.view = 'inicio';
    await cargarInicio(); render();
  } catch (e) { S.pantalla = 'login'; S.error = errorTexto(e); render(); }
}
async function salir() { await sb.auth.signOut(); Object.assign(S, { usuario: null, perfil: null, pantalla: 'login', menu: false, error: '' }); render(); }

/* ── Pantallas de acceso ── */
function marcoAcceso(contenido) {
  return `<div class="login">
    <section class="login-hero">
      <img src="assets/logo-wakanda.png" alt="Wakanda Travel">
      <div class="eyebrow">Intranet Wakanda Travel</div>
      <h1>Tu jornada empieza <em>aquí</em></h1>
      <p>Marca tu horario, abre tus herramientas y entérate de lo que pasa en la agencia, todo en un solo lugar.</p>
    </section>
    <section class="login-side">${contenido}</section></div>`;
}
function loginView() {
  return marcoAcceso(`<form id="fLogin" novalidate>
      <div><div class="eyebrow">Iniciar sesión</div><h2 style="font-size:28px;margin-top:8px">Hola de <em>nuevo</em></h2></div>
      ${S.error ? `<div class="err" role="alert">${esc(S.error)}</div>` : ''}
      <div class="field"><label for="lCorreo">Correo corporativo</label><input id="lCorreo" type="email" autocomplete="username" required placeholder="nombre@wakandatravel.com.co" value="${esc(S.correoLogin || '')}"></div>
      <div class="field"><label for="lClave">Contraseña</label><input id="lClave" type="password" autocomplete="current-password" required ${S.correoLogin ? 'autofocus' : ''}></div>
      <button class="btn teal" type="submit">${ico('in')} Entrar</button>
      <p class="hint" style="margin:0">¿Olvidaste tu contraseña? Pídele a la administración que la restablezca.</p>
    </form>`);
}
function claveView(obligatorio) {
  const form = `<form id="fClave" novalidate style="display:grid;gap:18px;width:100%;max-width:360px">
      <div><div class="eyebrow">${obligatorio ? 'Primer ingreso' : 'Tu cuenta'}</div><h2 style="font-size:28px;margin-top:8px">Crea tu <em>contraseña</em></h2>
        ${obligatorio ? '<p class="hint" style="margin:8px 0 0">Entraste con una contraseña temporal. Crea la tuya para seguir; solo tú la conocerás.</p>' : ''}</div>
      ${S.error ? `<div class="err" role="alert">${esc(S.error)}</div>` : ''}
      <div class="field"><label for="c1">Nueva contraseña</label><input id="c1" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="field"><label for="c2">Repítela</label><input id="c2" type="password" autocomplete="new-password" minlength="8" required></div>
      <p class="hint" style="margin:-6px 0 0">Mínimo 8 caracteres. Mejor si mezclas letras y números.</p>
      <button class="btn teal" type="submit">${ico('check')} Guardar contraseña</button>
      ${obligatorio ? '<button class="btn ghost" type="button" data-accion="salir">Salir</button>' : '<button class="btn ghost" type="button" data-accion="cerrarClave">Cancelar</button>'}
    </form>`;
  return obligatorio ? marcoAcceso(form) : `<div style="display:grid;place-items:center;padding:24px 0">${form}</div>`;
}
function datosView() {
  return marcoAcceso(`<div class="datos-legal">
      <div class="eyebrow">Antes de empezar</div>
      <h2>Autorización de <em>tratamiento de datos</em></h2>
      <p>Wakanda Travel S.A.S. (NIT 901516423-6) usará tu nombre, correo, área, sede y los registros de tu jornada (horas de entrada, almuerzo y salida, y la red desde la que marcas) para administrar la asistencia, la comunicación interna y las solicitudes de vacaciones, permisos e incapacidades.</p>
      <p>Estos datos solo los ven las personas autorizadas de la agencia. Puedes conocerlos, actualizarlos o pedir que se corrijan escribiendo a la administración, según la Ley 1581 de 2012.</p>
      ${S.error ? `<div class="err" role="alert">${esc(S.error)}</div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn teal" type="button" data-accion="aceptarDatos">${ico('check')} Acepto</button>
      <button class="btn ghost" type="button" data-accion="salir">Salir</button></div></div>`);
}
function sinPerfilView() {
  return marcoAcceso(`<div class="datos-legal"><h2>Tu cuenta aún no está <em>lista</em></h2>
    <p>Entraste bien, pero tu cuenta no tiene un perfil activo en la intranet. Pídele a la administración que lo revise.</p>
    <div><button class="btn ghost" type="button" data-accion="salir">Salir</button></div></div>`);
}

/* ── Marco de la aplicación ── */
function appView() {
  const p = P();
  const tabs = [['inicio', 'Inicio'], ['malla', 'Malla'], ['comunicados', 'Comunicados']];
  const pendCom = sinConfirmar().length;
  if (esLider()) tabs.push(['asistencia', 'Asistencia'], ['informes', 'Informes']);
  if (moduloSol() || esGerencia()) tabs.push(['solicitudes', 'Solicitudes']);
  if (gestionaCuentas()) tabs.push(['equipo', 'Equipo']);
  const pendSol = moduloSol() ? porRevisar().filter(x => puedeAprobar(x)).length : 0;
  const vistas = { informes: informesView, inicio: inicioView, malla: mallaView, comunicados: comunicadosView, solicitudes: solicitudesView, asistencia: asistenciaView, equipo: equipoView, guia: guiaView, clave: () => claveView(false) };
  const rol = ROLES[p.rol] + (p.es_admin ? ' · administración' : '');
  return `<header class="top"><div class="wrap">
      <div class="brand"><img src="assets/logo-wakanda.png" alt=""><span>Wakanda Travel</span></div>
      <nav class="tabs" aria-label="Secciones">${tabs.map(([k, l]) => `<button type="button" data-view="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${l}${k === 'comunicados' && pendCom ? `<span class="badge" aria-label="${pendCom} sin confirmar">${pendCom}</span>` : ''}${k === 'solicitudes' && pendSol ? `<span class="badge" aria-label="${pendSol} por revisar">${pendSol}</span>` : ''}</button>`).join('')}</nav>
      <div class="menu"><button type="button" data-accion="menu" aria-expanded="${S.menu}" aria-label="Menú de ${esc(p.nombre)}"><span class="avatar">${initials(p.nombre)}</span></button>
        ${S.menu ? `<div class="menu-pop"><div class="who"><b>${esc(p.nombre)}</b>${esc(rol)} · ${esc(sede(p.sede_id).nombre)}</div>
          <button type="button" data-view="guia">Guía de uso</button><button type="button" data-view="clave">Cambiar contraseña</button><button type="button" data-accion="salir">Cerrar sesión</button></div>` : ''}</div>
    </div></header>
    <main class="wrap">${(vistas[S.view] || inicioView)()}</main>
    <footer class="foot-site"><div class="wrap"><span><b>Wakanda Travel</b> — Diseñadores de viajes, diseñadores de sueños</span><span>Intranet · RNT 101438</span></div></footer>
    ${lightboxView()}`;
}

/* ── Guía de uso (cada persona ve las partes que le aplican) ── */
function guiaView() {
  const partes = [
    { id: 'g-entrar', t: 'Entrar la primera vez', html: `
      <ol><li>Abre la intranet y entra con tu correo corporativo y la contraseña temporal que te entregó la gerencia.</li>
      <li>La intranet te pedirá crear tu propia contraseña (mínimo 8 caracteres). Nadie más la conoce.</li>
      <li>Lee y acepta el tratamiento de datos. Solo se pide una vez.</li></ol>
      <p>Tu cuenta es personal: no la compartas. Para cambiar la contraseña, toca tu inicial arriba a la derecha y elige <b>Cambiar contraseña</b>.</p>` },
    { id: 'g-marcar', t: 'Marcar la jornada', html: `
      <p>En <b>Inicio</b> está el pase de jornada con cuatro marcas: <b>Entrada</b>, <b>Salida a almuerzo</b>, <b>Regreso de almuerzo</b> y <b>Salida</b>.</p>
      <ul><li>La hora la pone el sistema, no tu computador.</li>
      <li>Las marcas van en orden: el botón muestra siempre la siguiente.</li>
      <li>No se puede marcar dos veces lo mismo en el día.</li>
      <li>Tu turno sale de la malla. Si llegas más de <b>${tol().entrada} minutos</b> después de tu hora de entrada, cuenta como llegada tarde. El almuerzo cuenta como extendido si pasa <b>${tol().almuerzo} minutos</b> del tiempo permitido.</li>
      <li>Si tu turno de hoy no está en la malla, igual puedes marcar. Avísale a tu líder.</li>
      <li>Si tienes vacaciones, permiso o incapacidad aprobados, verás <b>Hoy no tienes que marcar</b> y el día queda justificado.</li></ul>
      <p><b>¿Se te olvidó marcar o marcaste mal?</b> Escríbele a tu líder el mismo día con la hora real.</p>` },
    { id: 'g-equipo', t: 'Malla, comunicados y herramientas', html: `
      <p><b>Malla.</b> En <b>Malla</b> ves los turnos de tu sede semana a semana. Solo las líderes y los supervisores la cambian, y cualquier cambio se refleja de inmediato.</p>
      <p><b>Comunicados.</b> El número rojo en <b>Comunicados</b> indica cuántos tienes sin confirmar. Léelos y toca <b>Confirmar lectura</b>: la gerencia ve quién ya los leyó. Las imágenes se abren en grande al tocarlas y el buscador encuentra comunicados por palabra.</p>
      <p><b>Herramientas.</b> Desde <b>Inicio</b> abres OMNIAXIS, Wakanda Documentos y KAM 360.</p>` },
    { id: 'g-sol', t: 'Vacaciones, permisos e incapacidades', si: moduloSol() || esGerencia(), html: `
      <p>En <b>Solicitudes</b> pides vacaciones o permisos y reportas incapacidades:</p>
      <ol><li>Elige el tipo y las fechas.</li><li>Escribe el motivo.</li><li>Si tienes soporte, adjunta una foto o un PDF (es opcional).</li></ol>
      <p>Verás si está <b>Pendiente</b>, <b>Aprobada</b> o <b>Rechazada</b>, con el comentario de quien la revisó. Mientras esté pendiente puedes cancelarla.</p>` },
    { id: 'g-lider', t: 'Para las líderes de sede', si: esLider(), html: `
      <p><b>Turnos.</b> Al final de la pestaña <b>Malla</b> están los turnos de tu sede. Ajusta los de ejemplo a los horarios reales (entrada, almuerzo y salida) o crea los que falten.</p>
      <p><b>Malla semanal.</b> Elige la semana y asigna a cada persona su turno por día. Si la semana se repite, usa <b>Copiar la semana anterior</b> y cambia solo lo distinto. Cada cambio queda registrado y los informes se recalculan solos.</p>
      <p><b>Asistencia.</b> Muestra el día: quién marcó, quién llegó tarde, quién falta y quién tiene una ausencia aprobada.</p>
      <p><b>Informes.</b> Elige el mes: puntualidad, quién llegó más tarde, detalle por persona y comunicados sin confirmar. Solo cuentan los días ya cerrados. Con <b>Exportar a Excel</b> descargas los datos.</p>
      <p><b>Comunicados.</b> Puedes publicar comunicados, con imágenes, y pedir confirmación de lectura.</p>` },
    { id: 'g-gerencia', t: 'Para la gerencia y administración', si: esGerencia(), html: `
      ${P().es_admin ? `<p><b>Cuentas</b> (pestaña <b>Equipo</b>).</p>
      <ul><li><b>Crear:</b> nombre, correo corporativo, sede, área y rol. La contraseña temporal se muestra <b>una sola vez</b>: cópiala y entrégala en privado. La persona la cambia al primer ingreso.</li>
      <li><b>Nueva contraseña:</b> para quien la olvidó.</li>
      <li><b>Desactivar:</b> cuando alguien sale de la empresa. Su historial se conserva y se puede reactivar.</li>
      <li><b>Rol Supervisor:</b> asígnalo a quien deba crear y administrar cuentas de colaboradores (por ejemplo, contabilidad). No le da acceso a informes, aprobaciones ni configuración.</li></ul>` : ''}
      <p><b>Solicitudes.</b> En <b>Solicitudes</b> activas o apagas el módulo para todo el equipo y asignas los <b>revisores</b>: quién puede ver, aprobar y rechazar, por sede y por tipo (por ejemplo, contabilidad para incapacidades). Las directoras solo revisan si las asignas. Nadie aprueba sus propias solicitudes.</p>
      <p><b>Informes.</b> Ves ambas sedes o una sola, con los indicadores del mes, la gráfica por día, el ranking de llegadas tarde y la confirmación de comunicados.</p>` },
    { id: 'g-cuentas', t: 'Para supervisores: cuentas y malla', si: P().rol === 'supervisor' && !P().es_admin, html: `
      <p>Como supervisor manejas las cuentas de los colaboradores desde la pestaña <b>Equipo</b>.</p>
      <ul><li><b>Crear:</b> nombre, correo corporativo, sede y área. La contraseña temporal se muestra <b>una sola vez</b>: cópiala y entrégala en privado. La persona la cambia al primer ingreso.</li>
      <li><b>Nueva contraseña:</b> para quien la olvidó.</li>
      <li><b>Desactivar:</b> cuando alguien sale de la empresa. Su historial se conserva y se puede reactivar.</li>
      <li>También puedes cambiar la sede y el área de los colaboradores.</li></ul>
      <p><b>Malla de horarios.</b> En <b>Malla</b> puedes asignar el turno de cada persona, en todas las sedes, y usar <b>Copiar la semana anterior</b>. Debajo de la malla, en <b>Turnos</b>, también puedes ajustar el nombre y los horarios de cada turno de cualquier sede.</p>
      <p>Las cuentas de directoras, gerentes, administración y la tuya propia solo las cambia la administración.</p>` },
    { id: 'g-faq', t: 'Preguntas frecuentes', html: `
      <p><b>Olvidé mi contraseña.</b> Pídele a la gerencia que la restablezca; recibirás una temporal.</p>
      <p><b>¿Puedo marcar desde el celular?</b> ${S.config.validar_ip && S.config.validar_ip.activo ? 'No. Solo se puede marcar desde la oficina.' : 'Pronto solo se podrá marcar desde la oficina y tu computador asignado. Acostúmbrate a marcar desde tu puesto.'}</p>
      <p><b>Mi turno no es el que aparece.</b> Habla con tu directora para que corrija la malla.</p>
      ${moduloSol() || esGerencia() ? '' : '<p><b>No veo Solicitudes.</b> El módulo está apagado; la gerencia decide cuándo activarlo.</p>'}
      <p><b>¿A quién acudo?</b> Turnos, malla y marcas: tu directora de operaciones. Cuentas y contraseñas: la gerencia. Solicitudes: quien las revisa o la gerencia.</p>` }
  ].filter(x => x.si !== false);
  return `<div class="hello"><div><div class="eyebrow">Ayuda</div><h1>Guía de <em>uso</em></h1>
      <p>Todo lo que necesitas para usar la intranet. Solo ves las partes que aplican a tu rol.</p></div></div>
    <div class="guia"><nav class="card guia-indice" aria-label="Contenido">${partes.map(x => `<button type="button" data-guia="${x.id}">${esc(x.t)}</button>`).join('')}</nav>
      <div class="guia-texto">${partes.map(x => `<section class="card" id="${x.id}"><h2>${esc(x.t)}</h2>${x.html}</section>`).join('')}</div></div>`;
}

/* ── Inicio: pase de jornada ── */
async function cargarInicio() {
  const tz = miTz(), hoy = fechaEn(tz), lunes = lunesDe(hoy);
  const [mallaHoy, marcas, semana] = await Promise.all([
    q(sb.from('malla').select('turno_id').eq('persona_id', P().id).eq('fecha', hoy).maybeSingle()),
    q(sb.from('marcas').select('tipo,hora').eq('persona_id', P().id).eq('fecha', hoy)),
    q(sb.from('malla').select('fecha,turno_id').eq('persona_id', P().id).gte('fecha', lunes).lte('fecha', sumarDias(lunes, 5)))
  ]);
  S.hoy = { fecha: hoy, malla: mallaHoy, marcas, semana, lunes };
  await Promise.all([cargarComunicados(), cargarSolicitudes()]);
}
function evaluar(paso, realMin, t, marcas) {
  if (!t || !t.entrada) return null;
  const T = tol();
  if (paso === 'entrada') { const d = realMin - toMin(t.entrada); return d > T.entrada ? ['warn', `Tarde ${d} min`] : ['ok', 'A tiempo']; }
  if (paso === 'salida_almuerzo') return ['mute', 'Registrado'];
  if (paso === 'regreso_almuerzo') {
    const sal = marcas.salida_almuerzo; if (sal == null) return null;
    const dur = realMin - sal, perm = toMin(t.regreso_almuerzo) - toMin(t.salida_almuerzo);
    return dur > perm + T.almuerzo ? ['warn', `Almuerzo ${dur} min`] : ['ok', `Almuerzo ${dur} min`];
  }
  const d = realMin - toMin(t.salida);
  if (d < 0) return ['warn', `Salió ${-d} min antes`];
  if (d > 30) return ['info', `${d} min extra`];
  return ['ok', 'A tiempo'];
}
function inicioView() {
  const p = P(), tz = miTz(), h = Number(horaEn(tz).slice(0, 2));
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return `<div class="hello"><div><div class="eyebrow">Intranet · ${esc(fechaLarga(S.hoy.fecha))}</div>
      <h1>${saludo}, <em>${esc(p.nombre.split(' ')[0])}</em></h1>
      <p>${esc(area(p.area_id).nombre)} · Sede ${esc(sede(p.sede_id).nombre)}. Marca tu jornada y abre tus herramientas desde aquí.</p></div><button class="btn ghost sm" type="button" data-view="guia">¿Dudas? Guía de uso</button></div>
    ${avisoLectura()}
    <div class="grid-home"><div class="col">${paseView()}
      <section><div class="sec-h"><h2>Herramientas</h2><span class="hint">Se abren en una pestaña nueva</span></div>${herramientasView()}</section></div>
      <div class="col">${comunicadosMini()}${moduloSol() ? misSolicitudesMini() : ''}${semanaView()}</div></div>`;
}
function paseView() {
  const p = P(), tz = miTz(), t = S.hoy.malla ? turno(S.hoy.malla.turno_id) : null;
  const m = Object.fromEntries(S.hoy.marcas.map(x => [x.tipo, toMin(horaEn(tz, new Date(x.hora)))]));
  const [hh, mm] = horaEn(tz).split(':');
  const stub = `<div class="stub"><div class="eyebrow">Pase de jornada</div><div class="who">${esc(p.nombre)}</div>
      <dl><dt>Turno</dt><dd>${t ? esc(t.nombre) : 'Sin asignar'}</dd>${t && t.entrada ? `<dt>Horario</dt><dd class="num">${hhmm(t.entrada)}–${hhmm(t.salida)}</dd>` : ''}
        <dt>Sede</dt><dd>${esc(sede(p.sede_id).nombre)}</dd><dt>Fecha</dt><dd class="num">${esc(fechaCorta(S.hoy.fecha))}</dd></dl>
      <div class="clock num" id="clock">${hh}:${mm}<small>:${segEn(tz)}</small></div></div>`;
  const aus = ausenciaHoy();
  if (aus) {
    const T = TIPOS[aus.tipo];
    return `<section class="card pass" aria-label="Pase de jornada">${stub}<div class="pass-body"><div class="away"><span class="sq">${ico(T.i)}</span><div>
      <span class="chip info">${T.estado}</span><h2 style="font-size:24px;margin-top:8px">Hoy no tienes que <em>marcar</em></h2>
      <p style="margin:6px 0 0;color:var(--ink-2)">${T.nombre} del ${esc(fechaCorta(aus.desde))} al ${esc(fechaCorta(aus.hasta))}${aus.revisado_por ? `, aprobada por ${esc((persona(aus.revisado_por) || {}).nombre || 'la gerencia')}` : ''}.</p></div></div></div></section>`;
  }
  if (t && !t.entrada) {
    return `<section class="card pass" aria-label="Pase de jornada">${stub}<div class="pass-body"><div><span class="chip mute">${esc(t.nombre)}</span></div>
      <h2 style="font-size:24px">Hoy no tienes jornada <em>programada</em></h2>
      <p style="margin:0;color:var(--ink-2)">Así está en la malla de horarios. Si es un error, avísale a tu líder para que la corrija.</p></div></section>`;
  }
  const pasos = t && !t.salida_almuerzo ? PASOS.filter(x => x.k === 'entrada' || x.k === 'salida') : PASOS;
  const sig = pasos.find(x => m[x.k] == null);
  const legs = pasos.map(x => {
    const real = m[x.k], ev = real != null ? evaluar(x.k, real, t, m) : null;
    const plan = t && t[x.plan] ? hhmm(t[x.plan]) : null;
    return `<div class="leg ${real != null ? 'done' : x === sig ? 'next' : ''}"><div class="dot">${ico(real != null ? 'check' : x.ico)}</div>
      <div class="code">${x.code}</div><div class="lbl">${x.lbl}</div>
      <div class="real num">${real != null ? `${String(Math.floor(real / 60)).padStart(2, '0')}:${String(real % 60).padStart(2, '0')}` : '—'}</div>
      ${plan ? `<div class="plan num">Programado ${plan}</div>` : ''}${ev ? `<span class="chip ${ev[0]}">${ev[1]}</span>` : ''}</div>`;
  }).join('');
  const accion = sig ? `<button class="mark-btn" type="button" data-marcar="${sig.k}">${ico(sig.ico)} ${sig.btn}</button>`
    : `<span class="chip ok" style="font-size:14px;padding:6px 14px">${ico('check')} Jornada completa</span>`;
  const sinMalla = !t ? `<div class="notice" style="margin:0">${ico('alert')}<div>Tu turno de hoy todavía no está en la malla. Puedes marcar igual; tu líder lo verá en la asistencia.</div></div>` : '';
  const ipOn = S.config.validar_ip && S.config.validar_ip.activo;
  return `<section class="card pass" aria-label="Pase de jornada">${stub}<div class="pass-body">${sinMalla}
      <div class="legs">${legs}</div>
      <div class="action">${accion}<div class="where">${ico('shield')} ${ipOn ? `Solo desde la oficina ${esc(sede(p.sede_id).nombre)}` : 'La hora la pone el servidor'}</div></div></div></section>`;
}
function herramientasView() {
  if (!S.herramientas.length) return '<div class="card vacio">Todavía no hay herramientas publicadas.</div>';
  return `<div class="tools">${S.herramientas.map(h => `<a class="tool" href="${esc(h.url)}" target="_blank" rel="noopener">
      <span class="sq">${ico(h.icono)}</span><h3>${esc(h.nombre)}</h3><p>${esc(h.descripcion || '')}</p>
      <span class="foot"><span>${esc(h.pie || 'Abrir')}</span>${ico('chev')}</span></a>`).join('')}</div>`;
}
function semanaView() {
  const dias = DIAS.map((d, i) => { const f = sumarDias(S.hoy.lunes, i), r = S.hoy.semana.find(x => x.fecha === f), t = r ? turno(r.turno_id) : null;
    return `<div class="day ${f === S.hoy.fecha ? 'today' : ''}"><b>${d}</b><span class="chip ${claseTurno(t)}">${t ? esc(t.nombre) : 'Sin turno'}</span>
      <span class="num hint" style="font-size:12px">${t && t.entrada ? `${hhmm(t.entrada)}–${hhmm(t.salida)}` : '—'}</span></div>`; }).join('');
  return `<section><div class="sec-h"><h2>Tu semana</h2><button type="button" class="link" data-view="malla">Ver malla</button></div><div class="card week">${dias}</div></section>`;
}

/* ── Malla de horarios ── */
async function cargarMalla() {
  if (!S.malla.lunes) S.malla.lunes = lunesDe(fechaEn(miTz()));
  if (S.malla.sede == null) S.malla.sede = esGerencia() || P().rol === 'supervisor' ? 0 : P().sede_id;
  S.malla.filas = await q(sb.from('malla').select('persona_id,fecha,turno_id').gte('fecha', S.malla.lunes).lte('fecha', sumarDias(S.malla.lunes, 5)));
  if ((esLider() || P().rol === 'supervisor') && !S.turnoSede) S.turnoSede = esGerencia() || P().rol === 'supervisor' ? S.sedes[0]?.id : P().sede_id;
}
function mallaView() {
  const lunes = S.malla.lunes, hoy = fechaEn(miTz());
  const gente = S.personas.filter(x => x.activo && (S.malla.sede === 0 || x.sede_id === S.malla.sede));
  const celda = (x, i) => {
    const f = sumarDias(lunes, i), r = S.malla.filas.find(y => y.persona_id === x.id && y.fecha === f), t = r ? turno(r.turno_id) : null;
    if (!editaMalla(x.sede_id)) return `<td class="${f === hoy ? 'today' : ''}"><span class="shift ${claseTurno(t)}">${t ? esc(t.nombre) : '—'}</span></td>`;
    const ops = S.turnos.filter(y => y.sede_id === x.sede_id && y.activo);
    return `<td class="${f === hoy ? 'today' : ''}"><select class="shift ${claseTurno(t)}" data-malla="${x.id}|${f}" aria-label="Turno de ${esc(x.nombre)} el ${DIAS[i]}">
      <option value="">—</option>${ops.map(o => `<option value="${o.id}" ${t && t.id === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select></td>`;
  };
  const filas = gente.map(x => `<tr><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>${esc(area(x.area_id).nombre)} · ${esc(sede(x.sede_id).nombre)}</small></div></div></td>${DIAS.map((_, i) => celda(x, i)).join('')}</tr>`).join('');
  const ayuda = P().rol === 'supervisor' ? 'Como supervisor puedes cambiar la malla y los turnos de todas las sedes. Cada cambio queda guardado en el historial.'
    : !esLider() ? 'La malla es pública: todo el equipo la ve. Solo la directora de cada sede, la gerencia y los supervisores pueden cambiarla.'
    : esGerencia() ? 'Puedes cambiar los turnos de las dos sedes. Cada cambio queda guardado en el historial.' : `Puedes cambiar los turnos de la sede ${esc(sede(P().sede_id).nombre)}. Cada cambio queda guardado en el historial.`;
  return `<div class="hello"><div><div class="eyebrow">Intranet · semana del ${esc(fechaCorta(lunes))}</div><h1>Malla de <em>horarios</em></h1><p>${ayuda}</p></div></div>
    <div class="toolbar"><div class="weeknav"><button class="btn ghost sm" type="button" data-semana="-7">Semana anterior</button><b>${esc(fechaCorta(lunes))} – ${esc(fechaCorta(sumarDias(lunes, 5)))}</b><button class="btn ghost sm" type="button" data-semana="7">Semana siguiente</button></div>
      <span style="display:flex;gap:8px;flex-wrap:wrap">${S.sedes.length > 1 ? `<select id="mSede" aria-label="Sede"><option value="0" ${S.malla.sede === 0 ? 'selected' : ''}>Las dos sedes</option>${S.sedes.map(s => `<option value="${s.id}" ${S.malla.sede === s.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>` : ''}
      ${esLider() || P().rol === 'supervisor' ? `<button class="btn ghost sm" type="button" data-accion="copiarSemana">Copiar la semana anterior</button>` : ''}</span></div>
    <div class="card tablewrap"><table><thead><tr><th>Persona</th>${DIAS.map((d, i) => { const f = sumarDias(lunes, i); return `<th class="${f === hoy ? 'today' : ''}">${d} ${f.slice(8)}${f === hoy ? ' · hoy' : ''}</th>`; }).join('')}</tr></thead>
      <tbody>${filas || '<tr><td colspan="7" class="vacio">No hay personas en esta sede todavía.</td></tr>'}</tbody></table></div>
    ${esLider() || P().rol === 'supervisor' ? turnosView() : ''}`;
}
function turnosView() {
  const sedesEd = S.sedes.filter(s => editaMalla(s.id));
  const sid = S.turnoSede, lista = S.turnos.filter(t => t.sede_id === sid);
  const inp = (t, f, lbl) => t.entrada == null && f !== 'nombre' ? '<span class="hint">—</span>'
    : f === 'nombre' ? `<input type="text" class="tname" data-turno="${t.id}|nombre" value="${esc(t.nombre)}" aria-label="Nombre del turno ${esc(t.codigo)}">`
    : (f.includes('almuerzo') && t.salida_almuerzo == null) ? '<span class="hint">Sin almuerzo</span>'
    : `<input type="time" data-turno="${t.id}|${f}" value="${hhmm(t[f])}" aria-label="${lbl} del turno ${esc(t.nombre)}">`;
  return `<section style="margin-top:32px"><div class="sec-h"><h2>Turnos</h2>
      ${sedesEd.length > 1 ? `<select id="tSede" aria-label="Sede de los turnos">${sedesEd.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>` : ''}</div>
    <div class="notice">${ico('alert')}<div><b>Los turnos iniciales son de ejemplo.</b> Ajusta los nombres y las horas a los horarios reales de la sede ${esc(sede(sid).nombre)}. La malla, el pase de jornada y la asistencia usan estos horarios.</div></div>
    <div class="card tablewrap"><table class="turnos"><thead><tr><th>Código</th><th>Nombre</th><th>Entrada</th><th>Sale a almorzar</th><th>Regresa</th><th>Salida</th></tr></thead><tbody>
      ${lista.map(t => `<tr><td><span class="chip ${claseTurno(t)}">${esc(t.codigo)}</span></td><td>${inp(t, 'nombre')}</td>
        ${t.entrada == null ? '<td colspan="4" class="hint">Sin horario: no se marca asistencia</td>' : `<td>${inp(t, 'entrada', 'Entrada')}</td><td>${inp(t, 'salida_almuerzo', 'Salida a almuerzo')}</td><td>${inp(t, 'regreso_almuerzo', 'Regreso de almuerzo')}</td><td>${inp(t, 'salida', 'Salida')}</td>`}</tr>`).join('')}
    </tbody></table></div></section>`;
}

/* ── Asistencia de hoy (líderes) ── */
async function cargarAsistencia() {
  const fechas = [...new Set(S.sedes.map(s => fechaEn(s.zona_horaria)))];
  const [malla, marcas] = await Promise.all([
    q(sb.from('malla').select('persona_id,fecha,turno_id').in('fecha', fechas)),
    q(sb.from('marcas').select('persona_id,fecha,tipo,hora').in('fecha', fechas))
  ]);
  const desde = fechas.slice().sort()[0], hasta = fechas.slice().sort().pop();
  const { data: aus } = await sb.rpc('ausencias_aprobadas', { p_desde: desde, p_hasta: hasta });
  S.asistencia = { malla, marcas, ausencias: aus || [] };
}
function estadoPersona(x) {
  const tz = sede(x.sede_id).zona_horaria, hoy = fechaEn(tz), ahora = toMin(horaEn(tz));
  const r = S.asistencia.malla.find(y => y.persona_id === x.id && y.fecha === hoy), t = r ? turno(r.turno_id) : null;
  const m = Object.fromEntries(S.asistencia.marcas.filter(y => y.persona_id === x.id && y.fecha === hoy).map(y => [y.tipo, toMin(horaEn(tz, new Date(y.hora)))]));
  let est;
  const aus = (S.asistencia.ausencias || []).find(a => a.persona_id === x.id && a.desde <= hoy && hoy <= a.hasta);
  if (aus) est = ['info', TIPOS[aus.tipo].estado];
  else if (t && !t.entrada) est = ['mute', t.nombre];
  else if (m.entrada == null) est = !t ? (ahora > 12 * 60 ? ['bad', 'Sin turno ni marca'] : ['mute', 'Sin turno']) : ahora < toMin(t.entrada) ? ['mute', 'Aún no inicia'] : ahora > toMin(t.entrada) + 15 ? ['bad', 'Sin marcar entrada'] : ['info', 'Por llegar'];
  else { est = ['ok', 'Al día']; for (const p of PASOS) if (m[p.k] != null) { const ev = evaluar(p.k, m[p.k], t, m); if (ev && ev[0] === 'warn') est = ev; } }
  return { t, m, est };
}
function asistenciaView() {
  const gente = S.personas.filter(x => x.activo && lideraSede(x.sede_id));
  const filas = gente.map(x => ({ x, ...estadoPersona(x) }));
  const cnt = k => filas.filter(f => f.est[0] === k).length;
  const fmt = v => v == null ? '' : `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  const celda = (f, p) => { if (f.t && f.t.entrada && p.plan && !f.t[p.plan]) return '<td class="hint">—</td>'; const v = f.m[p.k];
    if (v == null) return `<td><span class="hint num">${f.t && f.t[p.plan] ? hhmm(f.t[p.plan]) : ''}</span></td>`;
    const ev = evaluar(p.k, v, f.t, f.m); return `<td><b class="num" style="color:var(--navy)">${fmt(v)}</b>${ev && (ev[0] === 'warn' || ev[0] === 'info') ? ` <span class="chip ${ev[0]}">${ev[1]}</span>` : ''}</td>`; };
  const kpi = (c, n, l, i) => `<div class="card kpi"><span class="sq ${c}">${ico(i)}</span><div><b class="num">${n}</b><br><span>${l}</span></div></div>`;
  return `<div class="hello"><div><div class="eyebrow">Intranet · hoy</div><h1>¿Quién está <em>trabajando hoy?</em></h1>
      <p>${esGerencia() ? 'Las dos sedes' : `Sede ${esc(sede(P().sede_id).nombre)}`}, comparado con la malla de hoy.</p></div>
      <button class="btn ghost" type="button" data-accion="recargarAsistencia">Actualizar</button></div>
    <div class="kpis">${kpi('ok', cnt('ok'), 'Al día', 'check')}${kpi('warn', cnt('warn'), 'Con novedad', 'alert')}${kpi('bad', cnt('bad'), 'Sin marcar entrada', 'x')}${kpi('mute', cnt('mute') + cnt('info'), 'Descanso o por llegar', 'moon')}</div>
    <div class="card tablewrap"><table><thead><tr><th>Persona</th><th>Turno</th><th>Entrada</th><th>Sale a almorzar</th><th>Regresa</th><th>Salida</th><th>Estado</th></tr></thead><tbody>
      ${filas.map(f => `<tr><td><div class="person"><div class="avatar soft">${initials(f.x.nombre)}</div><div><b>${esc(f.x.nombre)}</b><small>${esc(area(f.x.area_id).nombre)} · ${esc(sede(f.x.sede_id).nombre)}</small></div></div></td>
        <td><span class="chip ${claseTurno(f.t)}">${f.t ? esc(f.t.nombre) : 'Sin turno'}</span>${f.t && f.t.entrada ? `<div class="hint num">${hhmm(f.t.entrada)}–${hhmm(f.t.salida)}</div>` : ''}</td>
        ${PASOS.map(p => celda(f, p)).join('')}<td><span class="chip ${f.est[0]}">${esc(f.est[1])}</span></td></tr>`).join('') || '<tr><td colspan="7" class="vacio">No hay personas en tu sede todavía.</td></tr>'}
    </tbody></table></div>`;
}

/* ── Comunicados ── */
const DESTINOS = () => [['todos', null, 'Todo el equipo'], ...S.areas.map(a => ['area', a.id, a.nombre]), ...S.sedes.map(x => ['sede', x.id, `Sede ${x.nombre}`])];
const paraTexto = c => c.destino === 'todos' ? 'Todo el equipo' : c.destino === 'area' ? area(c.destino_id).nombre : `Sede ${sede(c.destino_id).nombre}`;
// Destinatarios: personas activas a quienes va el comunicado, sin contar a quien lo escribió.
const destinatarios = c => S.personas.filter(x => x.activo && x.id !== c.autor_id &&
  (c.destino === 'todos' || (c.destino === 'area' && x.area_id === c.destino_id) || (c.destino === 'sede' && x.sede_id === c.destino_id)));
const leyo = (c, pid) => S.com.lect.some(l => l.comunicado_id === c.id && l.persona_id === pid);
const sinConfirmar = () => (S.com.lista || []).filter(c => c.requiere_confirmacion && c.autor_id !== P().id && destinatarios(c).some(x => x.id === P().id) && !leyo(c, P().id));
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cuando = ts => { const d = new Date(ts); return d.toLocaleDateString('es-CO', { timeZone: miTz(), day: 'numeric', month: 'short' }) + ', ' + horaEn(miTz(), d); };

async function cargarComunicados() {
  const lista = await q(sb.from('comunicados').select('id,autor_id,titulo,cuerpo,destino,destino_id,requiere_confirmacion,fijado,creado')
    .order('fijado', { ascending: false }).order('creado', { ascending: false }).limit(100));
  const ids = lista.map(c => c.id);
  let imgs = [], lect = [];
  if (ids.length) {
    [imgs, lect] = await Promise.all([
      q(sb.from('comunicado_imagenes').select('id,comunicado_id,ruta,nombre,orden').in('comunicado_id', ids).order('orden')),
      q(sb.from('comunicado_lecturas').select('comunicado_id,persona_id,leido_en').in('comunicado_id', ids))
    ]);
  }
  const porCom = {};
  if (imgs.length) {
    const { data: firmadas } = await sb.storage.from('comunicados').createSignedUrls(imgs.map(i => i.ruta), 3600);
    const url = Object.fromEntries((firmadas || []).map(f => [f.path, f.signedUrl]));
    for (const i of imgs) (porCom[i.comunicado_id] = porCom[i.comunicado_id] || []).push({ ...i, url: url[i.ruta] });
  }
  Object.assign(S.com, { lista, imgs: porCom, lect });
}
function avisoLectura() {
  const n = sinConfirmar().length; if (!n) return '';
  return `<div class="alerta" role="status"><span class="sq">${ico('mega')}</span><div><b>Tienes ${n} ${n === 1 ? 'comunicado' : 'comunicados'} sin confirmar</b>
    <span>Léelos y toca <b>Confirmar lectura</b>. La gerencia ve quién ya los leyó.</span></div>
    <button type="button" class="btn sm teal" data-comf="pend">Ver ${n === 1 ? 'comunicado' : 'comunicados'}</button></div>`;
}
function notaView(c, compacto) {
  const autor = persona(c.autor_id), imgs = S.com.imgs[c.id] || [], dest = destinatarios(c);
  const conf = dest.filter(x => leyo(c, x.id)), faltan = dest.filter(x => !leyo(c, x.id));
  const soyDest = dest.some(x => x.id === P().id), yaLei = leyo(c, P().id), esAutor = c.autor_id === P().id;
  const veSeguimiento = c.requiere_confirmacion && (esGerencia() || esAutor || puedePublicar());
  const pendiente = c.requiere_confirmacion && soyDest && !yaLei;
  let pie = '';
  if (c.requiere_confirmacion && soyDest) pie += `<div class="note-foot">${yaLei ? `<span class="chip ok">${ico('check')} Leído</span>`
      : `<span class="chip warn">Requiere confirmación</span><button type="button" class="btn sm teal" data-leer="${c.id}">Confirmar lectura</button>`}</div>`;
  if (veSeguimiento && !compacto) {
    const pct = dest.length ? Math.round(conf.length / dest.length * 100) : 100;
    pie += `<div class="note-foot"><span class="hint num">Confirmado por ${conf.length} de ${dest.length}</span><div class="bar"><span style="width:${pct}%"></span></div></div>
      ${faltan.length ? `<div class="hint">Faltan: ${faltan.map(x => esc(x.nombre)).join(', ')}</div>` : ''}`;
  }
  const qtxt = compacto ? '' : S.com.q;
  const resaltar = t => { if (!qtxt.trim()) return esc(t); const i = norm(t).indexOf(norm(qtxt.trim())); if (i < 0) return esc(t); const L = qtxt.trim().length;
    return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + L)) + '</mark>' + esc(t.slice(i + L)); };
  const galeria = imgs.length ? `<div class="thumbs">${(compacto ? imgs.slice(0, 3) : imgs).map((im, i) =>
    `<button type="button" class="thumb ${compacto ? 'sm' : ''}" data-lb="${c.id}|${i}" aria-label="Ver imagen ${esc(im.nombre)}">${im.url ? `<img src="${esc(im.url)}" alt="" loading="lazy">` : ''}</button>`).join('')}</div>` : '';
  const borrar = !compacto && (esAutor || esGerencia()) ? `<button type="button" class="link" data-borrarcom="${c.id}" style="font-size:13px;color:var(--bad)">${ico('trash')} Eliminar</button>` : '';
  return `<article class="card note ${c.fijado ? 'pin' : ''} ${pendiente ? 'unread' : ''} ${S.com.hl === c.id ? 'hl' : ''}" id="com-${c.id}">
    <div class="note-meta">${c.fijado ? `<span class="chip info">${ico('pin')} Fijado</span>` : ''}<span>${esc(autor ? autor.nombre : 'Alguien del equipo')}</span><span>·</span><span>${esc(cuando(c.creado))}</span>
      ${imgs.length ? `<span>·</span><span class="imgcount">${ico('image')} ${imgs.length}</span>` : ''}${borrar ? `<span style="margin-left:auto">${borrar}</span>` : ''}</div>
    <h3>${resaltar(c.titulo)}</h3>${compacto ? '' : `<p style="white-space:pre-line">${resaltar(c.cuerpo)}</p><div class="hint">Para: ${esc(paraTexto(c))}</div>`}${galeria}${pie}</article>`;
}
function comunicadosMini() {
  const pend = sinConfirmar(), resto = S.com.lista.filter(c => !pend.includes(c));
  const lista = [...pend, ...resto].slice(0, 3);
  return `<section><div class="sec-h"><h2>Comunicados</h2><button type="button" class="link" data-view="comunicados">Ver todos</button></div>
    <div class="news">${lista.length ? lista.map(c => notaView(c, true)).join('') : '<div class="card vacio">Todavía no hay comunicados.</div>'}</div></section>`;
}
function listaComunicados() {
  const pend = sinConfirmar();
  const lista = S.com.lista.filter(c => (S.com.filtro !== 'pend' || pend.includes(c)) && (!S.com.q.trim() || norm(`${c.titulo} ${c.cuerpo}`).includes(norm(S.com.q.trim()))));
  if (lista.length) return lista.map(c => notaView(c, false)).join('');
  if (S.com.filtro === 'pend' && !S.com.q.trim()) return `<div class="card vacio">${ico('check')} Estás al día: no tienes comunicados por confirmar.</div>`;
  return S.com.q.trim() ? `<div class="card vacio">No hay comunicados que digan "${esc(S.com.q)}". Prueba con otra palabra.</div>` : '<div class="card vacio">Todavía no hay comunicados.</div>';
}
function borradorView() {
  return S.com.borrador.map((im, i) => `<span class="thumb sm"><img src="${esc(im.vista)}" alt="${esc(im.file.name)}"><button type="button" class="x" data-quitarimg="${i}" aria-label="Quitar ${esc(im.file.name)}">×</button></span>`).join('');
}
function comunicadosView() {
  const n = sinConfirmar().length;
  const form = puedePublicar() ? `<section><div class="sec-h"><h2>Nuevo comunicado</h2></div>
    <form class="card compose" id="fCom" novalidate>
      <div class="field"><label for="cTit">Título</label><input id="cTit" maxlength="140" placeholder="Ej.: Cierre de mes de facturación"></div>
      <div class="field"><label for="cTxt">Mensaje</label><textarea id="cTxt" rows="5" placeholder="Escribe el comunicado"></textarea></div>
      <div class="row2"><div class="field"><label for="cPara">Para</label><select id="cPara">${DESTINOS().map(([d, id, l]) => `<option value="${d}|${id ?? ''}">${esc(l)}</option>`).join('')}</select></div>
        <div class="field" style="align-content:end;gap:10px"><label class="check"><input type="checkbox" id="cReq" checked> Pedir confirmación de lectura</label>
          <label class="check"><input type="checkbox" id="cPin"> Fijar arriba</label></div></div>
      <div class="field"><span style="font-size:14px;font-weight:600;color:var(--navy)">Imágenes <span class="hint">(opcional, JPG o PNG)</span></span>
        <div class="drop"><label class="btn ghost sm" for="cImg">${ico('image')} Agregar imágenes</label><input id="cImg" type="file" accept="image/jpeg,image/png,image/webp" multiple>
          <span>Se guardan en una carpeta privada; solo las ve quien recibe el comunicado.</span></div>
        <div class="thumbs" id="borrador">${borradorView()}</div></div>
      <div><button class="btn" type="submit">${ico('mega')} Publicar</button></div></form></section>`
    : `<section><div class="sec-h"><h2>¿Cómo funciona?</h2></div><div class="card vacio">Cuando un comunicado pide confirmación, léelo y toca <b>Confirmar lectura</b>. La gerencia ve quién ya lo leyó.</div></section>`;
  return `<div class="hello"><div><div class="eyebrow">Intranet · comunicación interna</div><h1>¿Qué hay de <em>nuevo</em>?</h1>
      <p>${puedePublicar() ? 'Publica para todo el equipo, un área o una sede, y mira quién ya leyó.' : 'Lo que la agencia necesita que sepas.'}</p></div></div>
    <div class="grid-home"><div class="col"><section>
      <div class="sec-h"><h2>Comunicados</h2><div class="seg" role="group" aria-label="Filtrar comunicados">
        <button type="button" data-comf="todos" aria-pressed="${S.com.filtro !== 'pend'}">Todos</button><button type="button" data-comf="pend" aria-pressed="${S.com.filtro === 'pend'}">Sin confirmar (${n})</button></div></div>
      <div class="search" style="max-width:none;margin-bottom:14px">${ico('search')}<input id="qCom" type="search" placeholder="Buscar en comunicados" aria-label="Buscar en comunicados" value="${esc(S.com.q)}" autocomplete="off"></div>
      <div class="news" id="listaCom">${listaComunicados()}</div></section></div>
      <div class="col">${form}</div></div>`;
}
function lightboxView() {
  const lb = S.lb; if (!lb) return '';
  const imgs = lb.items, im = imgs[lb.i]; if (!im) return '';
  return `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Imagen">
    <div class="lb-top"><div><b>${esc(lb.titulo)}</b><div style="font-size:13px;opacity:.8">${esc(im.nombre)} · ${lb.i + 1} de ${imgs.length}</div></div>
      <button type="button" class="btn ghost sm" data-accion="lbCerrar">Cerrar</button></div>
    <div class="lb-img"><img src="${esc(im.url)}" alt="${esc(im.nombre)}"></div>
    <div class="lb-nav">${imgs.length > 1 ? '<button type="button" class="btn ghost sm" data-lbmover="-1">Anterior</button><button type="button" class="btn ghost sm" data-lbmover="1">Siguiente</button>' : ''}
      <a class="btn ghost sm" href="${esc(im.url)}" target="_blank" rel="noopener">Abrir en tamaño completo</a></div></div>`;
}
// Reduce fotos grandes antes de subirlas (máx. 1920 px, JPG), para que carguen rápido y quepan en el límite de 10 MB.
async function prepararImagen(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`"${file.name}" no es JPG, PNG ni WEBP.`);
  let bmp; try { bmp = await createImageBitmap(file); } catch (_) { return file; }
  const max = 1920, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 1.5e6) return file;
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85));
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}
const slug = t => norm(t).replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'imagen';
async function publicarComunicado(f) {
  const titulo = f.querySelector('#cTit').value.trim(), cuerpo = f.querySelector('#cTxt').value.trim();
  if (!titulo || !cuerpo) { toast('Escribe un título y un mensaje para publicar.'); return false; }
  const [destino, did] = f.querySelector('#cPara').value.split('|');
  const nuevo = await q(sb.from('comunicados').insert({ autor_id: P().id, titulo, cuerpo, destino, destino_id: did ? Number(did) : null,
    requiere_confirmacion: f.querySelector('#cReq').checked, fijado: f.querySelector('#cPin').checked }).select('id').single());
  const fallidas = [];
  for (const [i, b] of S.com.borrador.entries()) {
    try {
      const archivo = await prepararImagen(b.file), ruta = `${nuevo.id}/${Date.now()}-${i}-${slug(archivo.name)}`;
      const { error } = await sb.storage.from('comunicados').upload(ruta, archivo, { contentType: archivo.type, upsert: false });
      if (error) throw error;
      await q(sb.from('comunicado_imagenes').insert({ comunicado_id: nuevo.id, ruta, nombre: b.file.name, orden: i }));
    } catch (e) { fallidas.push(b.file.name); }
  }
  S.com.borrador = [];
  await cargarComunicados(); render();
  toast(fallidas.length ? `Comunicado publicado, pero no se pudieron subir: ${fallidas.join(', ')}.` : 'Comunicado publicado. El equipo lo verá en su inicio.');
  return true;
}

/* ── Solicitudes: vacaciones, permisos e incapacidades ── */
const TIPOS = {
  vacaciones: { nombre: 'Vacaciones', estado: 'Vacaciones', i: 'plane', ayuda: 'Días de descanso' },
  permiso: { nombre: 'Permiso', estado: 'Ausencia con permiso', i: 'clock', ayuda: 'Un día, unas horas o una cita' },
  incapacidad: { nombre: 'Incapacidad', estado: 'Incapacidad', i: 'heart', ayuda: 'Sube la foto de la incapacidad' }
};
const TODOS_TIPOS = ['vacaciones', 'permiso', 'incapacidad'];
const ESTADOS = { pendiente: ['warn', 'Pendiente'], aprobada: ['ok', 'Aprobada'], rechazada: ['bad', 'Rechazada'] };
const moduloSol = () => !!(S.config.modulo_solicitudes && S.config.modulo_solicitudes.activo);
const miAcceso = () => esGerencia() ? { sede_id: null, tipos: TODOS_TIPOS, nivel: 'aprobar' } : S.sol.revisores.find(r => r.persona_id === P().id) || null;
const puedeVerSol = x => { const a = miAcceso(), quien = persona(x.persona_id); if (!a || x.persona_id === P().id || !quien) return false;
  return (a.sede_id == null || quien.sede_id === a.sede_id) && a.tipos.includes(x.tipo); };
const puedeAprobar = x => puedeVerSol(x) && miAcceso().nivel === 'aprobar';
const porRevisar = () => S.sol.lista.filter(x => x.estado === 'pendiente' && puedeVerSol(x));
const ausenciaHoy = () => S.sol.lista.find(x => x.persona_id === P().id && x.estado === 'aprobada' && !x.hora_desde && x.desde <= S.hoy.fecha && S.hoy.fecha <= x.hasta);
function diasHabiles(a, b) { let n = 0; for (let f = a; f <= b; f = sumarDias(f, 1)) { const [y, m, d] = f.split('-').map(Number); if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() !== 0) n++; } return n; }
const listaTipos = ts => { const n = ts.map(t => ({ vacaciones: 'vacaciones', permiso: 'permisos', incapacidad: 'incapacidades' }[t])); const u = n.pop(); return n.length ? `${n.join(', ')} ${/^i/.test(u) ? 'e' : 'y'} ${u}` : u; };

async function cargarSolicitudes() {
  const [lista, revisores] = await Promise.all([
    q(sb.from('solicitudes').select('*').order('creado', { ascending: false }).limit(300)),
    q(sb.from('revisores').select('*'))
  ]);
  const ids = lista.map(x => x.id), adj = {};
  if (ids.length) {
    const filas = await q(sb.from('solicitud_adjuntos').select('*').in('solicitud_id', ids));
    if (filas.length) {
      const { data: firmadas } = await sb.storage.from('soportes').createSignedUrls(filas.map(f => f.ruta), 3600);
      const url = Object.fromEntries((firmadas || []).map(f => [f.path, f.signedUrl]));
      for (const f of filas) (adj[f.solicitud_id] = adj[f.solicitud_id] || []).push({ ...f, url: url[f.ruta] });
    }
  }
  Object.assign(S.sol, { lista, revisores, adj });
}
function solTarjeta(x, conAcciones) {
  const quien = persona(x.persona_id) || { nombre: 'Alguien del equipo' }, T = TIPOS[x.tipo], [cls, est] = ESTADOS[x.estado], mia = x.persona_id === P().id;
  const rango = x.desde === x.hasta ? fechaCorta(x.desde) : `${fechaCorta(x.desde)} al ${fechaCorta(x.hasta)}`;
  const dias = diasHabiles(x.desde, x.hasta), dur = x.hora_desde ? `${hhmm(x.hora_desde)}–${hhmm(x.hora_hasta)}` : `${dias} ${dias === 1 ? 'día' : 'días'}`;
  const adj = S.sol.adj[x.id] || [];
  const soportes = adj.length ? `<div class="thumbs">${adj.map((a, i) => /^image\//.test(a.tipo_mime || '')
      ? `<button type="button" class="thumb sm" data-lbsol="${x.id}|${i}" aria-label="Ver ${esc(a.nombre)}">${a.url ? `<img src="${esc(a.url)}" alt="" loading="lazy">` : ''}</button>`
      : `<a class="file" href="${esc(a.url || '#')}" target="_blank" rel="noopener">${ico('file')} ${esc(a.nombre)}</a>`).join('')}</div>` : '';
  const revisor = x.revisado_por ? (persona(x.revisado_por) || {}).nombre || 'la gerencia' : '';
  return `<article class="card sol" id="sol-${x.id}">
    <div class="sol-h"><div style="display:flex;gap:12px;align-items:center"><span class="sq">${ico(T.i)}</span><div>
      <h3>${T.nombre}${mia ? '' : ` · ${esc(quien.nombre)}`}</h3>
      <div class="meta">${esc(rango)} · ${dur}${mia ? '' : ` · ${esc(area(quien.area_id).nombre)} · ${esc(sede(quien.sede_id).nombre)}`}</div></div></div>
      <span class="chip ${cls}">${est}</span></div>
    ${x.motivo ? `<p style="white-space:pre-line">${esc(x.motivo)}</p>` : ''}${soportes}
    ${x.estado !== 'pendiente' ? `<div class="meta">${est} por ${esc(revisor)}${x.comentario ? ` · "${esc(x.comentario)}"` : ''}</div>`
      : `<div class="meta">Enviada ${esc(cuando(x.creado))}${adj.length ? '' : ' · sin soporte adjunto'}</div>`}
    ${conAcciones ? `<div class="acts"><input id="cm-${x.id}" placeholder="Comentario (opcional)" aria-label="Comentario para ${esc(quien.nombre)}">
      <button type="button" class="btn sm teal" data-revisar="${x.id}|1">${ico('check')} Aprobar</button>
      <button type="button" class="btn sm danger" data-revisar="${x.id}|0">Rechazar</button></div>` : ''}
    ${mia && x.estado === 'pendiente' ? `<div><button type="button" class="link" data-cancelarsol="${x.id}" style="font-size:13px;color:var(--bad)">Cancelar solicitud</button></div>` : ''}
  </article>`;
}
function misSolicitudesMini() {
  const mias = S.sol.lista.filter(x => x.persona_id === P().id).slice(0, 2);
  return `<section><div class="sec-h"><h2>Mis solicitudes</h2><button type="button" class="link" data-view="solicitudes">Nueva solicitud</button></div>
    <div class="news">${mias.length ? mias.map(x => solTarjeta(x, false)).join('') : '<div class="card vacio">Aquí verás tus vacaciones, permisos e incapacidades. Toca <b>Nueva solicitud</b> para pedir una.</div>'}</div></section>`;
}
function solBorradorView() {
  return S.sol.borrador.map((a, i) => a.vista
    ? `<span class="thumb sm"><img src="${esc(a.vista)}" alt="${esc(a.file.name)}"><button type="button" class="x" data-quitarsop="${i}" aria-label="Quitar ${esc(a.file.name)}">×</button></span>`
    : `<span class="file">${ico('file')} ${esc(a.file.name)} <button type="button" class="link" data-quitarsop="${i}" aria-label="Quitar ${esc(a.file.name)}">×</button></span>`).join('');
}
function solFormView() {
  const tipo = S.sol.tipo, hoy = fechaEn(miTz());
  return `<section><div class="sec-h"><h2>Nueva solicitud</h2></div>
    <form class="card compose" id="fSol" novalidate>
      <fieldset style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:600;color:var(--navy);margin-bottom:6px">¿Qué necesitas?</legend>
        <div class="tipos">${Object.entries(TIPOS).map(([k, t]) => `<label><input type="radio" name="sTipo" value="${k}" ${k === tipo ? 'checked' : ''}><span class="sq" style="width:36px;height:36px">${ico(t.i)}</span><b>${t.nombre}</b>${t.ayuda}</label>`).join('')}</div></fieldset>
      <div class="row2"><div class="field"><label for="sDesde">Desde</label><input id="sDesde" type="date" value="${hoy}"></div>
        <div class="field"><label for="sHasta">Hasta</label><input id="sHasta" type="date" value="${hoy}"></div></div>
      ${tipo === 'permiso' ? `<div class="row2"><div class="field"><label for="sHd">Hora desde (opcional)</label><input id="sHd" type="time"></div>
        <div class="field"><label for="sHh">Hora hasta (opcional)</label><input id="sHh" type="time"></div></div>
        <p class="hint" style="margin:-6px 0 0">Déjalas vacías si el permiso es por el día completo.</p>` : ''}
      <div class="field"><label for="sMot">${tipo === 'incapacidad' ? 'Diagnóstico o comentario' : 'Motivo'}</label>
        <textarea id="sMot" rows="3" placeholder="${tipo === 'vacaciones' ? 'Ej.: vacaciones de fin de año' : tipo === 'permiso' ? 'Ej.: cita médica, diligencia personal' : 'Ej.: incapacidad por gripe, 2 días'}"></textarea></div>
      <div class="field"><span style="font-size:14px;font-weight:600;color:var(--navy)">Soporte <span class="hint">(opcional)</span></span>
        <div class="drop"><label class="btn ghost sm" for="sFile">${ico('clip')} Adjuntar foto o PDF</label><input id="sFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple>
          <span>${tipo === 'incapacidad' ? 'Toma una foto clara de la incapacidad.' : 'Por ejemplo, la cita médica o el soporte del permiso.'}</span></div>
        <div class="thumbs" id="solBorrador">${solBorradorView()}</div></div>
      <div><button class="btn teal" type="submit">${ico('check')} Enviar solicitud</button></div></form></section>`;
}
function revisoresView() {
  const gerentes = S.personas.filter(x => x.rol === 'gerente' || x.es_admin);
  const libres = S.personas.filter(x => x.activo && !gerentes.includes(x) && !S.sol.revisores.some(r => r.persona_id === x.id));
  const filas = S.sol.revisores.map(r => { const x = persona(r.persona_id); if (!x) return '';
    return `<tr><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>${esc(area(x.area_id).nombre)} · ${esc(sede(x.sede_id).nombre)}</small></div></div></td>
      <td><select data-rev="${r.persona_id}|sede_id" aria-label="Sede que revisa ${esc(x.nombre)}"><option value="">Las dos sedes</option>${S.sedes.map(s2 => `<option value="${s2.id}" ${r.sede_id === s2.id ? 'selected' : ''}>${esc(s2.nombre)}</option>`).join('')}</select></td>
      <td><div class="chk">${TODOS_TIPOS.map(t => `<label><input type="checkbox" data-revtipo="${r.persona_id}|${t}" ${r.tipos.includes(t) ? 'checked' : ''}> ${TIPOS[t].nombre}</label>`).join('')}</div></td>
      <td><select data-rev="${r.persona_id}|nivel" aria-label="Permiso de ${esc(x.nombre)}"><option value="aprobar" ${r.nivel === 'aprobar' ? 'selected' : ''}>Ver, aprobar y rechazar</option><option value="ver" ${r.nivel === 'ver' ? 'selected' : ''}>Solo ver</option></select></td>
      <td><button type="button" class="btn sm danger" data-revquitar="${r.persona_id}">Quitar</button></td></tr>`; }).join('');
  return `<section style="margin-bottom:28px"><div class="sec-h"><h2>¿Quién revisa las solicitudes?</h2><span class="hint">Solo la gerencia cambia estos permisos</span></div>
    <div class="card"><div class="tablewrap"><table class="perm"><thead><tr><th>Persona</th><th>Sede</th><th>Tipos de solicitud</th><th>Permiso</th><th></th></tr></thead><tbody>
      ${gerentes.map(x => `<tr><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>Gerencia</small></div></div></td><td>Las dos sedes</td><td>Todas</td><td>Ver, aprobar y rechazar</td><td><span class="hint">Siempre</span></td></tr>`).join('')}${filas}</tbody></table></div>
      <div class="addrow"><label for="revNuevo" class="hint">Dar acceso a</label><select id="revNuevo"><option value="">Elige una persona…</option>${libres.map(x => `<option value="${x.id}">${esc(x.nombre)} · ${esc(area(x.area_id).nombre)}</option>`).join('')}</select>
        <button type="button" class="btn sm" data-accion="revAgregar">${ico('plus')} Dar acceso</button></div></div></section>`;
}
function solicitudesView() {
  const ger = esGerencia(), acc = miAcceso(), activo = moduloSol();
  const sub = ger ? 'Tú decides quién revisa cada tipo de solicitud. La gerencia siempre puede ver, aprobar y rechazar todas.'
    : acc ? `La gerencia te dio acceso para ${acc.nivel === 'aprobar' ? 'ver, aprobar y rechazar' : 'ver'} ${listaTipos(acc.tipos.slice())} de ${acc.sede_id == null ? 'las dos sedes' : `la sede ${esc(sede(acc.sede_id).nombre)}`}. Tus propias solicitudes las revisa otra persona.`
    : 'Pide vacaciones o un permiso, o sube tu incapacidad. Te avisamos aquí cuando la revisen.';
  const head = `<div class="hello"><div><div class="eyebrow">Intranet · solicitudes</div><h1>${acc ? 'Vacaciones, permisos e <em>incapacidades</em>' : '¿Necesitas un <em>permiso?</em>'}</h1><p>${sub}</p></div></div>`;
  const modulo = ger ? `<div class="card modcard"><div><b style="color:var(--navy);font-family:var(--f-display);font-size:17px">Módulo de solicitudes</b>
      <p>${activo ? 'Activo: el equipo ve "Solicitudes" en su menú y en su inicio, y puede pedir vacaciones, permisos e incapacidades.' : 'Apagado: el equipo no ve la opción de solicitudes. Lo ya aprobado se conserva.'}</p></div>
      <label class="switch"><input type="checkbox" id="modSol" ${activo ? 'checked' : ''}><span class="tr"></span>${activo ? 'Activo' : 'Apagado'}</label></div>` : '';
  if (!activo && !ger) return head + '<div class="card vacio">La gerencia aún no ha activado las solicitudes.</div>';
  const mias = S.sol.lista.filter(x => x.persona_id === P().id);
  const misSol = `<section><div class="sec-h"><h2>Mis solicitudes</h2></div><div class="news">${mias.length ? mias.map(x => solTarjeta(x, false)).join('') : '<div class="card vacio">Todavía no has enviado solicitudes.</div>'}</div></section>`;
  if (!acc) return head + `<div class="grid-home"><div class="col">${solFormView()}</div><div class="col">${misSol}</div></div>`;
  const pend = porRevisar(), hist = S.sol.lista.filter(x => x.estado !== 'pendiente' && puedeVerSol(x));
  return head + modulo + (ger ? revisoresView() : '') + `<div class="grid-home"><div class="col">
      <section><div class="sec-h"><h2>${acc.nivel === 'aprobar' ? 'Por aprobar' : 'Pendientes'} <span class="hint num">(${pend.length})</span></h2></div>
        <div class="news">${pend.length ? pend.map(x => solTarjeta(x, puedeAprobar(x))).join('') : '<div class="card vacio">No hay solicitudes pendientes.</div>'}</div></section>
      <section><div class="sec-h"><h2>Historial</h2></div><div class="news">${hist.length ? hist.map(x => solTarjeta(x, false)).join('') : '<div class="card vacio">Sin historial todavía.</div>'}</div></section></div>
    <div class="col">${activo ? solFormView() + misSol : '<div class="card vacio">Activa el módulo para que el equipo pueda enviar solicitudes.</div>'}</div></div>`;
}
async function enviarSolicitud(f) {
  const desde = f.querySelector('#sDesde').value, hasta = f.querySelector('#sHasta').value;
  if (!desde || !hasta) { toast('Elige las fechas de la solicitud.'); return; }
  if (hasta < desde) { toast('La fecha "hasta" no puede ser antes de "desde".'); return; }
  const hd = f.querySelector('#sHd')?.value || '', hh = f.querySelector('#sHh')?.value || '';
  if ((hd && !hh) || (!hd && hh)) { toast('Completa las dos horas del permiso o deja ambas vacías.'); return; }
  const nueva = await q(sb.from('solicitudes').insert({ persona_id: P().id, tipo: S.sol.tipo, desde, hasta, hora_desde: hd || null, hora_hasta: hh || null,
    motivo: f.querySelector('#sMot').value.trim() || null }).select('id').single());
  const fallidos = [];
  for (const [i, b] of S.sol.borrador.entries()) {
    try {
      const archivo = /^image\/(jpeg|png|webp)$/.test(b.file.type) ? await prepararImagen(b.file) : b.file;
      const ruta = `${nueva.id}/${Date.now()}-${i}-${slug(archivo.name)}`;
      const { error } = await sb.storage.from('soportes').upload(ruta, archivo, { contentType: archivo.type, upsert: false });
      if (error) throw error;
      await q(sb.from('solicitud_adjuntos').insert({ solicitud_id: nueva.id, ruta, nombre: b.file.name, tipo_mime: archivo.type }));
    } catch (e) { fallidos.push(b.file.name); }
  }
  S.sol.borrador.forEach(b => b.vista && URL.revokeObjectURL(b.vista)); S.sol.borrador = [];
  await cargarSolicitudes(); render();
  toast(fallidos.length ? `Solicitud enviada, pero no se pudieron subir: ${fallidos.join(', ')}.` : 'Solicitud enviada. Te avisaremos aquí cuando la revisen.');
}

/* ── Informes mensuales (líderes) ── */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mesesDisponibles = () => { const [y, m] = fechaEn(miTz()).split('-').map(Number); return Array.from({ length: 12 }, (_, i) => { const d = new Date(Date.UTC(y, m - 1 - i, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }); };
const nombreMes = k => { const [y, m] = k.split('-').map(Number); return `${MESES[m - 1]} ${y}`; };
const fmtHM = v => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
const horasTxt = m => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
const meta = () => (S.config.meta_puntualidad && S.config.meta_puntualidad.porcentaje) || 95;

async function cargarInforme() {
  if (!S.inf.mes) { const ms = mesesDisponibles(); S.inf.mes = Number(fechaEn(miTz()).slice(8)) <= 5 ? ms[1] : ms[0]; }
  if (!esGerencia()) S.inf.sede = P().sede_id;
  const [y, m] = S.inf.mes.split('-').map(Number), desde = `${S.inf.mes}-01`, hasta = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const [malla, marcas, ausR] = await Promise.all([
    todas(() => sb.from('malla').select('persona_id,fecha,turno_id').gte('fecha', desde).lte('fecha', hasta).order('fecha')),
    todas(() => sb.from('marcas').select('persona_id,fecha,tipo,hora').gte('fecha', desde).lte('fecha', hasta).order('fecha')),
    sb.rpc('ausencias_aprobadas', { p_desde: desde, p_hasta: hasta })
  ]);
  if (!S.com.lista.length) await cargarComunicados();
  S.inf.datos = { desde, hasta, malla, marcas, ausencias: ausR.data || [] };
}
function calcularInforme() {
  const D = S.inf.datos, T = tol();
  const gente = S.personas.filter(x => lideraSede(x.sede_id) && (!S.inf.sede || x.sede_id === S.inf.sede) && (!S.inf.area || x.area_id === S.inf.area) && D.malla.some(r => r.persona_id === x.id));
  const ids = new Set(gente.map(x => x.id));
  const st = Object.fromEntries(gente.map(x => [x.id, { p: x, dias: 0, tardes: 0, minT: 0, almL: 0, temp: 0, extra: 0, aus: 0, just: 0, sinConf: 0, detalle: [] }]));
  const marcasDe = {};
  for (const r of D.marcas) if (ids.has(r.persona_id)) { const k = r.persona_id + '|' + r.fecha; (marcasDe[k] = marcasDe[k] || {})[r.tipo] = toMin(horaEn(sede(persona(r.persona_id).sede_id).zona_horaria, new Date(r.hora))); }
  const porDia = {};
  for (const r of D.malla) {
    if (!ids.has(r.persona_id)) continue;
    const x = persona(r.persona_id), t = turno(r.turno_id), hoy = fechaEn(sede(x.sede_id).zona_horaria);
    if (!t || !t.entrada || r.fecha >= hoy) continue;              // solo días cerrados con horario
    const s2 = st[x.id], dia = Number(r.fecha.slice(8)); porDia[dia] = porDia[dia] || [];
    const aus = D.ausencias.find(a => a.persona_id === x.id && a.desde <= r.fecha && r.fecha <= a.hasta);
    if (aus) { s2.just++; s2.detalle.push({ f: r.fecha, txt: TIPOS[aus.tipo].estado, cls: 'info' }); continue; }
    const mk = marcasDe[x.id + '|' + r.fecha] || {};
    if (mk.entrada == null) { s2.aus++; s2.detalle.push({ f: r.fecha, txt: 'Sin marcar', cls: 'bad' }); continue; }
    s2.dias++;
    const tarde = mk.entrada - toMin(t.entrada);
    if (tarde > T.entrada) { s2.tardes++; s2.minT += tarde; porDia[dia].push({ n: x.nombre, min: tarde }); s2.detalle.push({ f: r.fecha, txt: `Tarde ${tarde} min`, cls: 'warn' }); }
    if (t.salida_almuerzo && mk.salida_almuerzo != null && mk.regreso_almuerzo != null) {
      const dur = mk.regreso_almuerzo - mk.salida_almuerzo, perm = toMin(t.regreso_almuerzo) - toMin(t.salida_almuerzo);
      if (dur > perm + T.almuerzo) { s2.almL++; s2.detalle.push({ f: r.fecha, txt: `Almuerzo ${dur} min`, cls: 'warn' }); }
    }
    if (mk.salida != null) { const d = mk.salida - toMin(t.salida); if (d < 0) { s2.temp++; s2.detalle.push({ f: r.fecha, txt: `Salió ${-d} min antes`, cls: 'warn' }); } else if (d > 30) s2.extra += d; }
  }
  const coms = S.com.lista.filter(c => c.requiere_confirmacion && c.creado.slice(0, 7) === S.inf.mes).map(c => {
    const dest = destinatarios(c).filter(x => ids.has(x.id));
    return { c, dest, conf: dest.filter(x => leyo(c, x.id)), faltan: dest.filter(x => !leyo(c, x.id)) };
  }).filter(x => x.dest.length);
  for (const x of coms) for (const p of x.faltan) st[p.id].sinConf++;
  const lista = Object.values(st), tot = k => lista.reduce((a, b) => a + b[k], 0);
  const dias = Object.keys(porDia).map(Number).sort((a, b) => a - b);
  return { lista, tot, porDia, dias, coms };
}
function graficaDias(I) {
  const W = 720, H = 220, L = 30, R = 8, Tp = 12, B = 26, iw = W - L - R, ih = H - Tp - B, ds = I.dias, n = ds.length || 1, bw = iw / n;
  const vals = ds.map(d => I.porDia[d].length), max = Math.max(4, ...vals), paso = max <= 6 ? 1 : max <= 12 ? 2 : 5, top = Math.ceil(max / paso) * paso;
  const yv = v => Tp + ih - (v / top) * ih;
  let g = '<g class="grid">'; for (let v = 0; v <= top; v += paso) g += `<line x1="${L}" x2="${W - R}" y1="${yv(v)}" y2="${yv(v)}"/><text x="${L - 8}" y="${yv(v) + 4}" text-anchor="end">${v}</text>`; g += '</g>';
  const [y, m] = S.inf.mes.split('-').map(Number);
  const barras = ds.map((d, i) => {
    const v = vals[i], x = L + i * bw, w = Math.max(2, bw - 2), h = ih * v / top, yy = Tp + ih - h, r = Math.min(4, h, w / 2);
    const path = v ? `M${x + 1},${Tp + ih} V${yy + r} Q${x + 1},${yy} ${x + 1 + r},${yy} H${x + 1 + w - r} Q${x + 1 + w},${yy} ${x + 1 + w},${yy + r} V${Tp + ih} Z` : '';
    const lbl = new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 1 || i === 0;
    return `<g data-dia="${d}"><rect class="hit" x="${x}" y="${Tp}" width="${bw}" height="${ih}"/>${v ? `<path class="bar" d="${path}"/>` : ''}${lbl ? `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${d}</text>` : ''}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Llegadas tarde por día del mes">${g}<line x1="${L}" x2="${W - R}" y1="${Tp + ih}" y2="${Tp + ih}" stroke="var(--blue-200)"/>${barras}</svg>`;
}
function informesView() {
  const D = S.inf.datos; if (!D) return '<div class="cargando">Cargando el informe…</div>';
  const I = calcularInforme(), L = I.lista, mes = nombreMes(S.inf.mes);
  const dias = I.tot('dias'), tardes = I.tot('tardes'), punt = dias ? Math.round((1 - tardes / dias) * 1000) / 10 : 0;
  const pc = x => x.dias ? Math.round((1 - x.tardes / x.dias) * 100) : 0, pcCls = v => v >= meta() ? 'ok' : v >= meta() - 10 ? 'warn' : 'bad';
  const opt = (arr, v) => arr.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const filtros = `<div class="filters">
    <div class="field"><label for="iMes">Mes</label><select id="iMes">${opt(mesesDisponibles().map(k => [k, nombreMes(k).replace(/^./, c => c.toUpperCase())]), S.inf.mes)}</select></div>
    ${esGerencia() ? `<div class="field"><label for="iSede">Sede</label><select id="iSede">${opt([[0, 'Las dos sedes'], ...S.sedes.map(x => [x.id, x.nombre])], S.inf.sede)}</select></div>`
      : `<div class="field"><label>Sede</label><select disabled><option>${esc(sede(P().sede_id).nombre)}</option></select></div>`}
    <div class="field"><label for="iArea">Área</label><select id="iArea">${opt([[0, 'Todas'], ...S.areas.map(a => [a.id, a.nombre])], S.inf.area)}</select></div>
    <span style="flex:1"></span><button class="btn ghost" type="button" data-accion="exportar" ${L.length ? '' : 'disabled'}>${ico('file')} Exportar a Excel</button></div>`;
  const head = `<div class="hello"><div><div class="eyebrow">Intranet · informes de asistencia</div><h1>Asistencia de <em>${esc(mes)}</em></h1>
    <p>${S.inf.sede ? `Sede ${esc(sede(S.inf.sede).nombre)}` : 'Las dos sedes'}${S.inf.area ? ` · ${esc(area(S.inf.area).nombre)}` : ''}, comparado con la malla de cada día. Solo cuentan los días ya cerrados.</p></div></div>`;
  if (!I.dias.length && !I.coms.length) return head + filtros + `<div class="card vacio">No hay jornadas programadas en la malla para ${esc(mes)} todavía. El informe se llena a medida que las directoras publican la malla y el equipo marca.</div>`;
  const kpi = (c, v, l, sub, i) => `<div class="card kpi"><span class="sq ${c}">${ico(i)}</span><div><b class="num">${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  const rk = L.filter(x => x.tardes).sort((a, b) => b.minT - a.minT || b.tardes - a.tardes).slice(0, 8), maxR = rk.length ? rk[0].minT : 1;
  const sel = L.find(x => x.p.id === S.inf.sel);
  const orden = L.slice().sort((a, b) => S.inf.orden === 'punt' ? pc(a) - pc(b) : b[S.inf.orden] - a[S.inf.orden]);
  const th = (k, l) => `<th class="n sortable" data-orden="${k}" aria-sort="${S.inf.orden === k ? 'descending' : 'none'}">${l}${S.inf.orden === k ? ' ↓' : ''}</th>`;
  const totD = I.coms.reduce((a, x) => a + x.dest.length, 0), totC = I.coms.reduce((a, x) => a + x.conf.length, 0);
  return head + filtros + `
    <div class="kpis six">
      <div class="card kpi hero"><div style="display:flex;gap:14px;align-items:center"><span class="sq ${pcCls(punt)}">${ico('check')}</span><span class="lbl">Puntualidad del equipo</span></div>
        <div><b class="num">${punt} %</b><small>${dias - tardes} de ${dias} jornadas marcadas empezaron a tiempo</small></div>
        <div class="meter" aria-hidden="true"><div class="track2"><i style="width:${punt}%;background:var(--${pcCls(punt) === 'ok' ? 'ok' : pcCls(punt) === 'warn' ? 'teal' : 'bad'})"></i></div><div class="scale"><span>0 %</span><span>Meta ${meta()} %</span><span>100 %</span></div></div></div>
      ${kpi('warn', tardes, 'Llegadas tarde', `${I.tot('minT')} min de retraso en total`, 'clock')}
      ${kpi('warn', I.tot('almL'), 'Almuerzos largos', `Más de ${tol().almuerzo} min sobre lo permitido`, 'lunch')}
      ${kpi('warn', I.tot('temp'), 'Salidas antes de hora', '', 'out')}
      ${kpi('bad', I.tot('aus'), 'Jornadas sin marcar', 'Programadas en la malla', 'x')}
      ${kpi('mute', I.tot('just'), 'Ausencias con permiso', 'Vacaciones, permisos e incapacidades aprobadas', 'plane')}
      ${kpi('mute', horasTxt(I.tot('extra')), 'Horas extra', 'Salidas 30 min o más después', 'moon')}
    </div>
    <div class="grid-rep">
      <section class="card chartbox"><h3>Llegadas tarde por día</h3><div class="sub">Pasa el cursor sobre un día para ver quién llegó tarde.</div>
        <div class="chart" id="chartDias">${I.dias.length ? graficaDias(I) : '<p class="hint">Sin días cerrados con horario.</p>'}</div><div class="tip" id="tip" hidden></div></section>
      <section class="card rankbox"><h3>¿Quién llegó más tarde?</h3><div class="sub">Minutos de retraso acumulados en el mes. Toca un nombre para ver el detalle.</div>
        <div class="rank">${rk.length ? rk.map((x, i) => `<button type="button" data-selinf="${x.p.id}" class="${S.inf.sel === x.p.id ? 'sel' : ''}"><span class="pos">${i + 1}</span><span class="nm">${esc(x.p.nombre)}</span>
          <span class="track"><span class="fill" style="display:block;width:${Math.max(3, x.minT / maxR * 100)}%"></span></span><span class="val">${x.minT} min · ${x.tardes} ${x.tardes === 1 ? 'vez' : 'veces'}</span></button>`).join('')
          : '<p class="hint">Nadie llegó tarde este mes.</p>'}</div></section></div>
    ${sel ? `<section class="card detail"><div class="sec-h" style="margin:0"><h3 style="font-size:18px">${esc(sel.p.nombre)} · ${esc(mes)}</h3><button type="button" class="link" data-selinf="">Cerrar detalle</button></div>
      <div class="hint">${sel.dias} jornadas · ${sel.tardes} llegadas tarde · ${sel.almL} almuerzos largos · ${sel.temp} salidas antes · ${sel.aus} sin marcar · ${sel.just} con permiso · ${sel.sinConf} comunicados sin confirmar</div>
      <div class="days">${sel.detalle.length ? sel.detalle.sort((a, b) => a.f < b.f ? -1 : 1).map(d => `<span class="chip ${d.cls}">${esc(fechaCorta(d.f))} · ${esc(d.txt)}</span>`).join('') : '<span class="chip ok">Sin novedades en el mes</span>'}</div></section>` : ''}
    <section style="margin-top:28px"><div class="sec-h"><h2>Confirmación de comunicados</h2><span class="hint">${I.coms.length ? `${totD ? Math.round(totC / totD * 100) : 100} % confirmados · ${totD - totC} pendientes en ${esc(mes)}` : ''}</span></div>
      ${I.coms.length ? `<div class="card tablewrap"><table class="lect"><thead><tr><th>Comunicado</th><th>Confirmaron</th><th>Faltan por confirmar</th></tr></thead><tbody>
        ${I.coms.map(x => `<tr><td class="tit"><b>${esc(x.c.titulo)}</b><span class="hint">${esc(cuando(x.c.creado))} · Para: ${esc(paraTexto(x.c))}</span></td>
          <td><span class="num" style="font-weight:600;color:var(--navy)">${x.conf.length} de ${x.dest.length}</span><div class="bar" style="margin-top:6px"><span style="width:${Math.round(x.conf.length / x.dest.length * 100)}%"></span></div></td>
          <td>${x.faltan.length ? `<div class="falt">${x.faltan.map(p => `<span class="chip warn">${esc(p.nombre)}</span>`).join('')}</div>` : '<span class="chip ok">Todos confirmaron</span>'}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="card vacio">En ${esc(mes)} no hubo comunicados con confirmación de lectura para este grupo.</div>`}</section>
    <section style="margin-top:28px"><div class="sec-h"><h2>Detalle por persona</h2><span class="hint">Solo aparecen quienes tienen turnos en la malla del mes · toca una columna para ordenar o una fila para ver sus días</span></div>
      <div class="card tablewrap"><table><thead><tr><th>Persona</th><th class="n">Jornadas</th>${th('tardes', 'Llegadas tarde')}${th('minT', 'Min. tarde')}<th class="n">Promedio</th>${th('almL', 'Almuerzos largos')}${th('temp', 'Salidas antes')}${th('extra', 'Horas extra')}${th('aus', 'Sin marcar')}${th('just', 'Con permiso')}${th('sinConf', 'Comunicados sin confirmar')}${th('punt', 'Puntualidad')}</tr></thead><tbody>
        ${orden.map(x => `<tr class="clickable ${S.inf.sel === x.p.id ? 'hl' : ''}" data-selinf="${x.p.id}"><td><div class="person"><div class="avatar soft">${initials(x.p.nombre)}</div><div><b>${esc(x.p.nombre)}</b><small>${esc(area(x.p.area_id).nombre)} · ${esc(sede(x.p.sede_id).nombre)}</small></div></div></td>
          <td class="n">${x.dias}</td><td class="n">${x.tardes}</td><td class="n">${x.minT}</td><td class="n">${x.tardes ? Math.round(x.minT / x.tardes) : 0}</td><td class="n">${x.almL}</td><td class="n">${x.temp}</td>
          <td class="n">${horasTxt(x.extra)}</td><td class="n">${x.aus}</td><td class="n">${x.just}</td><td class="n">${x.sinConf ? `<span class="chip warn">${x.sinConf}</span>` : '0'}</td>
          <td class="n"><span class="chip ${x.dias ? pcCls(pc(x)) : 'mute'}">${x.dias ? pc(x) + ' %' : '—'}</span></td></tr>`).join('') || '<tr><td colspan="12" class="vacio">No hay personas en este grupo.</td></tr>'}
      </tbody></table></div></section>`;
}
function exportarInforme() {
  const I = calcularInforme(), pc = x => x.dias ? Math.round((1 - x.tardes / x.dias) * 100) : '';
  const filas = [['Persona', 'Correo', 'Sede', 'Área', 'Jornadas', 'Llegadas tarde', 'Minutos tarde', 'Promedio tarde (min)', 'Almuerzos largos', 'Salidas antes', 'Horas extra (min)', 'Sin marcar', 'Con permiso', 'Comunicados sin confirmar', 'Puntualidad %'],
    ...I.lista.map(x => [x.p.nombre, x.p.correo, sede(x.p.sede_id).nombre, area(x.p.area_id).nombre, x.dias, x.tardes, x.minT, x.tardes ? Math.round(x.minT / x.tardes) : 0, x.almL, x.temp, x.extra, x.aus, x.just, x.sinConf, pc(x)])];
  const csv = '﻿' + filas.map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `asistencia-${S.inf.mes}${S.inf.sede ? '-' + slug(sede(S.inf.sede).nombre) : ''}.csv`; document.body.appendChild(a); a.click(); a.remove();
  toast('Informe descargado. Ábrelo con Excel.');
}

/* ── Equipo: cuentas (administración) ── */
function claveTemporal() {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint32Array(10); crypto.getRandomValues(r);
  return Array.from(r, n => a[n % a.length]).join('');
}
function equipoView() {
  const nueva = S.equipo.claveNueva;
  const filtro = S.equipo.filtro.trim().toLowerCase();
  const lista = S.personas.filter(x => !filtro || `${x.nombre} ${x.correo}`.toLowerCase().includes(filtro));
  const opt = (arr, v) => arr.map(o => `<option value="${o.id}" ${o.id === v ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('');
  return `<div class="hello"><div><div class="eyebrow">Intranet · administración</div><h1>Cuentas del <em>equipo</em></h1>
      <p>Crea las cuentas con el correo corporativo de cada persona. Le entregas una contraseña temporal y, al entrar por primera vez, la intranet le pide crear la suya.</p></div></div>
    ${nueva ? `<div class="card" style="padding:18px 20px;margin-bottom:24px;display:grid;gap:10px;border-color:var(--teal)">
      <b style="color:var(--navy);font-family:var(--f-display);font-size:17px">${esc(nueva.titulo)}</b>
      <span style="font-size:14px;color:var(--ink-2)">Entrégale estos datos a <b>${esc(nueva.nombre)}</b> en persona o por un canal privado. Esta contraseña no se vuelve a mostrar.</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="hint">Usuario</span><span class="clave">${esc(nueva.correo)}</span><span class="hint">Contraseña temporal</span><span class="clave">${esc(nueva.clave)}</span>
      <button class="btn ghost sm" type="button" data-copiar="${esc(`Intranet Wakanda\nUsuario: ${nueva.correo}\nContraseña temporal: ${nueva.clave}`)}">${ico('copy')} Copiar</button>
      <button class="btn ghost sm" type="button" data-accion="ocultarClave">Listo</button></div></div>` : ''}
    <section style="margin-bottom:28px"><div class="sec-h"><h2>Crear cuenta</h2></div>
      <form class="card compose" id="fCuenta" novalidate><div class="form-grid">
        <div class="field"><label for="nNombre">Nombre completo</label><input id="nNombre" required placeholder="Ej.: Laura Méndez"></div>
        <div class="field"><label for="nCorreo">Correo corporativo</label><input id="nCorreo" type="email" required placeholder="nombre@wakandatravel.com.co"></div>
        <div class="field"><label for="nSede">Sede</label><select id="nSede">${opt(S.sedes, P().sede_id)}</select></div>
        <div class="field"><label for="nArea">Área</label><select id="nArea">${opt(S.areas, null)}</select></div>
        <div class="field"><label for="nRol">Rol</label><select id="nRol" ${P().es_admin ? '' : 'disabled'}><option value="colaborador">Colaborador</option>${P().es_admin ? '<option value="supervisor">Supervisor (crea cuentas)</option><option value="directora">Directora de operaciones</option><option value="gerente">Gerente</option>' : ''}</select>${P().es_admin ? '' : '<span class="hint">Las cuentas de supervisores, directoras y gerentes las crea la administración.</span>'}</div>
      </div><div><button class="btn teal" type="submit">${ico('plus')} Crear cuenta</button></div></form></section>
    <section><div class="sec-h"><h2>Personas <span class="hint num">(${S.personas.filter(x => x.activo).length} activas)</span></h2>
      <div class="search" style="flex:0 1 260px"><input id="eFiltro" type="search" placeholder="Buscar por nombre o correo" value="${esc(S.equipo.filtro)}" aria-label="Buscar personas" style="padding-left:14px"></div></div>
      <div class="card tablewrap"><table class="perm"><thead><tr><th>Persona</th><th>Sede</th><th>Área</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>
      ${lista.map(x => { const yo = x.id === P().id, ed = puedeTocarCuenta(x); return `<tr class="${x.activo ? '' : 'inactivo'}"><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>${esc(x.correo)}</small></div></div></td>
        <td><select data-perfil="${x.id}|sede_id" aria-label="Sede de ${esc(x.nombre)}" ${ed ? '' : 'disabled'}>${opt(S.sedes, x.sede_id)}</select></td>
        <td><select data-perfil="${x.id}|area_id" aria-label="Área de ${esc(x.nombre)}" ${ed || (yo && P().es_admin) ? '' : 'disabled'}>${opt(S.areas, x.area_id)}</select></td>
        <td><select data-perfil="${x.id}|rol" aria-label="Rol de ${esc(x.nombre)}" ${!yo && P().es_admin ? '' : 'disabled'}>${Object.entries(ROLES).map(([r, l]) => `<option value="${r}" ${x.rol === r ? 'selected' : ''}>${l}</option>`).join('')}</select>${x.es_admin ? '<div class="hint">Administración</div>' : x.rol === 'supervisor' ? '<div class="hint">Crea cuentas</div>' : ''}</td>
        <td><span class="chip ${x.activo ? 'ok' : 'mute'}">${x.activo ? 'Activa' : 'Desactivada'}</span></td>
        <td class="acc">${yo ? '<span class="hint">Tu cuenta</span>' : !ed ? '<span class="hint">Solo administración</span>' : `<button class="btn ghost sm" type="button" data-restablecer="${x.id}">Nueva contraseña</button>
          <button class="btn sm ${x.activo ? 'danger' : 'ghost'}" type="button" data-activar="${x.id}|${x.activo ? 'desactivar' : 'reactivar'}">${x.activo ? 'Desactivar' : 'Reactivar'}</button>`}</td></tr>`; }).join('')}
      </tbody></table></div></section>`;
}
async function funcionCuentas(cuerpo) {
  const { data, error } = await sb.functions.invoke('crear-usuario', { body: cuerpo });
  if (error) { let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (_) {} throw new Error(m); }
  if (data && data.error) throw new Error(data.error);
  return data;
}
async function recargarPersonas() { S.personas = await q(sb.from('perfiles').select('id,nombre,correo,sede_id,area_id,rol,es_admin,activo').order('nombre')); }

/* ── Navegación ── */
async function ir(view) {
  S.view = view; S.menu = false; S.error = '';
  try {
    if (view === 'inicio') await cargarInicio();
    if (view === 'malla') await cargarMalla();
    if (view === 'comunicados') await cargarComunicados();
    if (view === 'solicitudes') await cargarSolicitudes();
    if (view === 'asistencia') await cargarAsistencia();
    if (view === 'informes') await cargarInforme();
    if (view === 'equipo') await recargarPersonas();
  } catch (e) { toast(errorTexto(e)); }
  render(); window.scrollTo(0, 0);
}
function ocupado(el, si) { if (el) el.classList.toggle('spin', si); }

/* ── Eventos ── */
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]');
  if (f.id === 'fLogin') {
    const correo = f.querySelector('#lCorreo').value.trim(), clave = f.querySelector('#lClave').value;
    S.correoLogin = correo;
    if (!correo || !clave) { S.error = 'Escribe tu correo y tu contraseña.'; render(); return; }
    ocupado(btn, true);
    const { data, error } = await sb.auth.signInWithPassword({ email: correo.toLowerCase(), password: clave });
    if (error) { S.error = errorTexto(error); render(); return; }
    S.error = ''; await cargarUsuario(data.user);
  }
  if (f.id === 'fClave') {
    const c1 = f.querySelector('#c1').value, c2 = f.querySelector('#c2').value;
    if (c1.length < 8) { S.error = 'La contraseña debe tener al menos 8 caracteres.'; render(); return; }
    if (c1 !== c2) { S.error = 'Las dos contraseñas no coinciden.'; render(); return; }
    ocupado(btn, true);
    const { data, error } = await sb.auth.updateUser({ password: c1, data: { debe_cambiar_contrasena: false } });
    if (error) { S.error = errorTexto(error); render(); return; }
    S.error = ''; toast('Contraseña guardada.');
    if (S.pantalla === 'clave') await cargarUsuario(data.user); else ir('inicio');
  }
  if (f.id === 'fSol') {
    ocupado(btn, true);
    try { await enviarSolicitud(f); } catch (err) { toast(errorTexto(err)); } finally { ocupado(btn, false); }
    return;
  }
  if (f.id === 'fCom') {
    ocupado(btn, true);
    try { await publicarComunicado(f); } catch (err) { toast(errorTexto(err)); } finally { ocupado(btn, false); }
    return;
  }
  if (f.id === 'fCuenta') {
    const nombre = f.querySelector('#nNombre').value.trim(), correo = f.querySelector('#nCorreo').value.trim().toLowerCase();
    if (!nombre || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { toast('Escribe el nombre y un correo válido.'); return; }
    const clave = claveTemporal();
    ocupado(btn, true);
    try {
      await funcionCuentas({ accion: 'crear', nombre, correo, sede_id: Number(f.querySelector('#nSede').value), area_id: Number(f.querySelector('#nArea').value), rol: f.querySelector('#nRol').value, contrasena: clave });
      S.equipo.claveNueva = { titulo: 'Cuenta creada', nombre, correo, clave };
      await recargarPersonas(); render(); toast(`Cuenta de ${nombre} creada.`);
    } catch (err) { ocupado(btn, false); toast(errorTexto(err)); }
  }
});

document.addEventListener('click', async e => {
  const fila = e.target.closest('tr[data-selinf], th[data-orden]');
  if (fila && !e.target.closest('button')) {
    if (fila.dataset.orden) S.inf.orden = fila.dataset.orden; else S.inf.sel = S.inf.sel === fila.dataset.selinf ? null : fila.dataset.selinf;
    render(); return;
  }
  const b = e.target.closest('button'); if (!b) { if (S.menu && !e.target.closest('.menu')) { S.menu = false; render(); } return; }
  if (b.dataset.guia) { document.getElementById(b.dataset.guia)?.scrollIntoView({ behavior: 'smooth' }); return; }
  if (b.dataset.selinf !== undefined) { S.inf.sel = b.dataset.selinf && S.inf.sel !== b.dataset.selinf ? b.dataset.selinf : null; render(); return; }
  const a = b.dataset.accion;
  if (b.dataset.view) { ir(b.dataset.view); return; }
  if (a === 'menu') { S.menu = !S.menu; render(); return; }
  if (a === 'exportar') { exportarInforme(); return; }
  if (b.dataset.comf) {
    S.com.filtro = b.dataset.comf;
    if (S.view !== 'comunicados') { await ir('comunicados'); return; }
    document.querySelectorAll('[data-comf]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.comf === S.com.filtro)));
    document.getElementById('listaCom').innerHTML = listaComunicados(); return;
  }
  if (b.dataset.leer) {
    ocupado(b, true);
    try { await q(sb.from('comunicado_lecturas').insert({ comunicado_id: Number(b.dataset.leer), persona_id: P().id })); await cargarComunicados(); render(); toast('Lectura confirmada.'); }
    catch (err) { ocupado(b, false); toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.borrarcom) {
    const c = S.com.lista.find(x => x.id === Number(b.dataset.borrarcom));
    if (!confirm(`¿Eliminar el comunicado "${c.titulo}"? No se puede deshacer.`)) return;
    try {
      const rutas = (S.com.imgs[c.id] || []).map(i => i.ruta);
      if (rutas.length) await sb.storage.from('comunicados').remove(rutas);
      await q(sb.from('comunicados').delete().eq('id', c.id)); await cargarComunicados(); render(); toast('Comunicado eliminado.');
    } catch (err) { toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.lbsol) { const [sid, i] = b.dataset.lbsol.split('|').map(Number); const x = S.sol.lista.find(y => y.id === sid), imgs = (S.sol.adj[sid] || []).filter(a => /^image\//.test(a.tipo_mime || ''));
    S.lb = { titulo: `${TIPOS[x.tipo].nombre} · ${(persona(x.persona_id) || {}).nombre || ''}`, items: imgs, i: Math.max(0, imgs.indexOf((S.sol.adj[sid] || [])[i])) }; render(); return; }
  if (b.dataset.revisar) {
    const [id, ap] = b.dataset.revisar.split('|'), coment = document.getElementById(`cm-${id}`)?.value.trim() || null;
    ocupado(b, true);
    const { error } = await sb.rpc('revisar_solicitud', { p_id: Number(id), p_aprobar: ap === '1', p_comentario: coment });
    if (error) { ocupado(b, false); toast(errorTexto(error)); return; }
    await cargarSolicitudes(); render(); toast(ap === '1' ? 'Solicitud aprobada. Ya cuenta en la asistencia como ausencia justificada.' : 'Solicitud rechazada.'); return;
  }
  if (b.dataset.cancelarsol) {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    const id = Number(b.dataset.cancelarsol), rutas = (S.sol.adj[id] || []).map(a => a.ruta);
    try { if (rutas.length) await sb.storage.from('soportes').remove(rutas); await q(sb.from('solicitudes').delete().eq('id', id)); await cargarSolicitudes(); render(); toast('Solicitud cancelada.'); }
    catch (err) { toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.quitarsop) { const [x] = S.sol.borrador.splice(Number(b.dataset.quitarsop), 1); if (x.vista) URL.revokeObjectURL(x.vista); document.getElementById('solBorrador').innerHTML = solBorradorView(); return; }
  if (a === 'revAgregar') {
    const id = document.getElementById('revNuevo').value; if (!id) { toast('Elige primero a la persona.'); return; }
    try { await q(sb.from('revisores').insert({ persona_id: id, sede_id: null, tipos: TODOS_TIPOS, nivel: 'ver' })); await cargarSolicitudes(); render();
      toast(`${persona(id).nombre} ahora puede ver las solicitudes. Ajusta la sede, los tipos y el permiso.`); } catch (err) { toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.revquitar) {
    try { await q(sb.from('revisores').delete().eq('persona_id', b.dataset.revquitar)); await cargarSolicitudes(); render(); toast(`${persona(b.dataset.revquitar).nombre} ya no revisa solicitudes.`); }
    catch (err) { toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.lb) { const [cid, i] = b.dataset.lb.split('|').map(Number); const c = S.com.lista.find(x => x.id === cid); S.lb = { titulo: c.titulo, items: S.com.imgs[cid] || [], i }; render(); return; }
  if (a === 'lbCerrar') { S.lb = null; render(); return; }
  if (b.dataset.lbmover) { const n = S.lb.items.length; S.lb.i = (S.lb.i + Number(b.dataset.lbmover) + n) % n; render(); return; }
  if (b.dataset.quitarimg) { const [x] = S.com.borrador.splice(Number(b.dataset.quitarimg), 1); URL.revokeObjectURL(x.vista); document.getElementById('borrador').innerHTML = borradorView(); return; }
  if (a === 'salir') { salir(); return; }
  if (a === 'cerrarClave') { ir('inicio'); return; }
  if (a === 'aceptarDatos') {
    ocupado(b, true);
    const { error } = await sb.rpc('aceptar_datos');
    if (error) { S.error = errorTexto(error); render(); return; }
    await cargarUsuario(S.usuario); return;
  }
  if (b.dataset.marcar) {
    ocupado(b, true);
    const { error } = await sb.rpc('marcar', { p_tipo: b.dataset.marcar });
    if (error) { ocupado(b, false); toast(errorTexto(error)); return; }
    await cargarInicio(); render(); toast(`${PASOS.find(p => p.k === b.dataset.marcar).lbl} registrada a las ${horaEn(miTz())}.`); return;
  }
  if (b.dataset.semana) { S.malla.lunes = sumarDias(S.malla.lunes, Number(b.dataset.semana)); await cargarMalla(); render(); return; }
  if (a === 'copiarSemana') {
    const ant = sumarDias(S.malla.lunes, -7);
    try {
      const prev = await q(sb.from('malla').select('persona_id,fecha,turno_id').gte('fecha', ant).lte('fecha', sumarDias(ant, 5)));
      const filas = prev.filter(r => { const x = persona(r.persona_id); return x && x.activo && editaMalla(x.sede_id) && (S.malla.sede === 0 || x.sede_id === S.malla.sede); })
        .map(r => ({ persona_id: r.persona_id, fecha: sumarDias(r.fecha, 7), turno_id: r.turno_id }));
      if (!filas.length) { toast('La semana anterior no tiene turnos para copiar.'); return; }
      await q(sb.from('malla').upsert(filas, { onConflict: 'persona_id,fecha' }));
      await cargarMalla(); render(); toast(`Copiados ${filas.length} turnos de la semana anterior.`);
    } catch (err) { toast(errorTexto(err)); }
    return;
  }
  if (a === 'recargarAsistencia') { await cargarAsistencia(); render(); return; }
  if (a === 'ocultarClave') { S.equipo.claveNueva = null; render(); return; }
  if (b.dataset.copiar) {
    try { await navigator.clipboard.writeText(b.dataset.copiar); toast('Copiado. Pégalo en un mensaje privado.'); } catch (_) { toast('No se pudo copiar; selecciona el texto y cópialo a mano.'); }
    return;
  }
  if (b.dataset.restablecer) {
    const x = persona(b.dataset.restablecer), clave = claveTemporal();
    ocupado(b, true);
    try { await funcionCuentas({ accion: 'restablecer', id: x.id, contrasena: clave }); S.equipo.claveNueva = { titulo: 'Contraseña restablecida', nombre: x.nombre, correo: x.correo, clave }; render(); window.scrollTo(0, 0); }
    catch (err) { ocupado(b, false); toast(errorTexto(err)); }
    return;
  }
  if (b.dataset.activar) {
    const [id, accion] = b.dataset.activar.split('|'), x = persona(id);
    ocupado(b, true);
    try { await funcionCuentas({ accion, id }); await recargarPersonas(); render(); toast(accion === 'desactivar' ? `${x.nombre} ya no puede entrar a la intranet.` : `${x.nombre} puede volver a entrar.`); }
    catch (err) { ocupado(b, false); toast(errorTexto(err)); }
  }
});

document.addEventListener('change', async e => {
  const el = e.target;
  try {
    if (el.dataset.malla) {
      const [pid, fecha] = el.dataset.malla.split('|');
      if (el.value) await q(sb.from('malla').upsert({ persona_id: pid, fecha, turno_id: Number(el.value) }, { onConflict: 'persona_id,fecha' }));
      else await q(sb.from('malla').delete().eq('persona_id', pid).eq('fecha', fecha));
      await cargarMalla(); render(); toast('Turno guardado.'); return;
    }
    if (el.id === 'modSol') {
      await q(sb.from('configuracion').update({ valor: { activo: el.checked }, actualizado: new Date().toISOString() }).eq('clave', 'modulo_solicitudes'));
      S.config.modulo_solicitudes = { activo: el.checked }; render();
      toast(el.checked ? 'Solicitudes activadas para todo el equipo.' : 'Solicitudes apagadas. El equipo ya no ve la opción.'); return;
    }
    if (el.name === 'sTipo') { S.sol.tipo = el.value; render(); return; }
    if (el.id === 'sFile') {
      for (const file of el.files) {
        if (!/^(image\/(jpeg|png|webp|heic)|application\/pdf)$/.test(file.type)) { toast(`"${file.name}" no es una foto ni un PDF.`); continue; }
        if (file.size > 10 * 1024 * 1024 && !/^image\/(jpeg|png|webp)$/.test(file.type)) { toast(`"${file.name}" pesa más de 10 MB.`); continue; }
        S.sol.borrador.push({ file, vista: /^image\/(jpeg|png|webp)$/.test(file.type) ? URL.createObjectURL(file) : null });
      }
      el.value = ''; document.getElementById('solBorrador').innerHTML = solBorradorView(); return;
    }
    if (el.dataset.rev) {
      const [pid, campo] = el.dataset.rev.split('|'), v = campo === 'sede_id' ? (el.value ? Number(el.value) : null) : el.value;
      await q(sb.from('revisores').update({ [campo]: v }).eq('persona_id', pid)); await cargarSolicitudes(); render(); toast(`Permisos de ${persona(pid).nombre} actualizados.`); return;
    }
    if (el.dataset.revtipo) {
      const [pid, t] = el.dataset.revtipo.split('|'), r = S.sol.revisores.find(x => x.persona_id === pid);
      const tipos = el.checked ? TODOS_TIPOS.filter(x => r.tipos.includes(x) || x === t) : r.tipos.filter(x => x !== t);
      if (!tipos.length) { toast('Cada persona debe revisar al menos un tipo de solicitud. Si no, quítale el acceso.'); render(); return; }
      await q(sb.from('revisores').update({ tipos }).eq('persona_id', pid)); await cargarSolicitudes(); render(); toast(`Permisos de ${persona(pid).nombre} actualizados.`); return;
    }
    if (el.id === 'cImg') {
      for (const file of el.files) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast(`"${file.name}" no es JPG, PNG ni WEBP.`); continue; }
        S.com.borrador.push({ file, vista: URL.createObjectURL(file) });
      }
      el.value = ''; document.getElementById('borrador').innerHTML = borradorView(); return;
    }
    if (el.id === 'iMes' || el.id === 'iSede' || el.id === 'iArea') {
      if (el.id === 'iMes') { S.inf.mes = el.value; S.inf.datos = null; render(); await cargarInforme(); }
      if (el.id === 'iSede') S.inf.sede = Number(el.value);
      if (el.id === 'iArea') S.inf.area = Number(el.value);
      S.inf.sel = null; render(); return;
    }
    if (el.id === 'mSede') { S.malla.sede = Number(el.value); render(); return; }
    if (el.id === 'tSede') { S.turnoSede = Number(el.value); render(); return; }
    if (el.dataset.turno) {
      const [id, campo] = el.dataset.turno.split('|'), v = el.value.trim();
      if (!v) { render(); return; }
      await q(sb.from('turnos').update({ [campo]: v }).eq('id', Number(id)));
      S.turnos = await q(sb.from('turnos').select('*').order('sede_id').order('id'));
      render(); toast('Turno actualizado. La malla y la asistencia ya usan el nuevo horario.'); return;
    }
    if (el.dataset.perfil) {
      const [id, campo] = el.dataset.perfil.split('|'), v = campo === 'rol' ? el.value : Number(el.value);
      await q(sb.from('perfiles').update({ [campo]: v }).eq('id', id));
      await recargarPersonas(); render(); toast('Cambio guardado.'); return;
    }
  } catch (err) { toast(errorTexto(err)); render(); }
});

document.addEventListener('input', e => {
  if (e.target.id === 'qCom') { S.com.q = e.target.value; document.getElementById('listaCom').innerHTML = listaComunicados(); return; }
  if (e.target.id === 'eFiltro') { S.equipo.filtro = e.target.value; const pos = e.target.selectionStart; render(); const n = document.getElementById('eFiltro'); n.focus(); n.setSelectionRange(pos, pos); }
});
document.addEventListener('mousemove', e => {
  const tip = document.getElementById('tip'); if (!tip || !S.inf.datos) return;
  const g = e.target.closest && e.target.closest('#chartDias g[data-dia]');
  document.querySelectorAll('#chartDias g.on').forEach(x => x !== g && x.classList.remove('on'));
  if (!g) { tip.hidden = true; return; }
  g.classList.add('on');
  const d = Number(g.dataset.dia), lst = (calcularInforme().porDia[d] || []).slice().sort((a, b) => b.min - a.min);
  tip.innerHTML = `<b>${esc(fechaLarga(`${S.inf.mes}-${String(d).padStart(2, '0')}`))}</b><br>${lst.length ? `${lst.length} ${lst.length === 1 ? 'llegada tarde' : 'llegadas tarde'}<br>${lst.map(x => `${esc(x.n)} · ${x.min} min`).join('<br>')}` : 'Nadie llegó tarde'}`;
  tip.hidden = false;
  const box = g.closest('.chartbox').getBoundingClientRect();
  let x = e.clientX - box.left + 14; if (x + 240 > box.width) x = e.clientX - box.left - 250;
  tip.style.left = x + 'px'; tip.style.top = (e.clientY - box.top + 14) + 'px';
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && (S.menu || S.lb)) { S.menu = false; S.lb = null; render(); }
  if (S.lb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const n = S.lb.items.length; S.lb.i = (S.lb.i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; render(); }
});

setInterval(() => {
  const c = document.getElementById('clock'); if (!c || !S.perfil) return;
  const tz = miTz(); c.innerHTML = `${horaEn(tz)}<small>:${segEn(tz)}</small>`;
}, 1000);

sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && S.pantalla !== 'login') { S.pantalla = 'login'; render(); } });
iniciar();
})();
