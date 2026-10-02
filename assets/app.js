/* Intranet Wakanda Travel · aplicación
   Página estática (GitHub Pages) que habla con Supabase. Las reglas de seguridad viven en la base de datos (RLS):
   aquí solo se decide qué mostrar; lo que cada persona puede leer o cambiar lo decide Supabase. */
(() => {
'use strict';

const sb = window.supabase.createClient(window.WAKANDA_CONFIG.supabaseUrl, window.WAKANDA_CONFIG.supabaseKey);

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
  com: { lista: [], imgs: {}, lect: [], filtro: 'todos', q: '', borrador: [], lb: null, hl: null }
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
  if (esLider()) tabs.push(['asistencia', 'Asistencia']);
  if (p.es_admin) tabs.push(['equipo', 'Equipo']);
  const vistas = { inicio: inicioView, malla: mallaView, comunicados: comunicadosView, asistencia: asistenciaView, equipo: equipoView, clave: () => claveView(false) };
  const rol = { gerente: 'Gerente', directora: 'Directora', colaborador: 'Colaborador' }[p.rol] + (p.es_admin ? ' · administración' : '');
  return `<header class="top"><div class="wrap">
      <div class="brand"><img src="assets/logo-wakanda.png" alt=""><span>Wakanda Travel</span></div>
      <nav class="tabs" aria-label="Secciones">${tabs.map(([k, l]) => `<button type="button" data-view="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${l}${k === 'comunicados' && pendCom ? `<span class="badge" aria-label="${pendCom} sin confirmar">${pendCom}</span>` : ''}</button>`).join('')}</nav>
      <div class="menu"><button type="button" data-accion="menu" aria-expanded="${S.menu}" aria-label="Menú de ${esc(p.nombre)}"><span class="avatar">${initials(p.nombre)}</span></button>
        ${S.menu ? `<div class="menu-pop"><div class="who"><b>${esc(p.nombre)}</b>${esc(rol)} · ${esc(sede(p.sede_id).nombre)}</div>
          <button type="button" data-view="clave">Cambiar contraseña</button><button type="button" data-accion="salir">Cerrar sesión</button></div>` : ''}</div>
    </div></header>
    <main class="wrap">${(vistas[S.view] || inicioView)()}</main>
    <footer class="foot-site"><div class="wrap"><span><b>Wakanda Travel</b> — Diseñadores de viajes, diseñadores de sueños</span><span>Intranet · RNT 101438</span></div></footer>
    ${lightboxView()}`;
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
  await cargarComunicados();
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
      <p>${esc(area(p.area_id).nombre)} · Sede ${esc(sede(p.sede_id).nombre)}. Marca tu jornada y abre tus herramientas desde aquí.</p></div></div>
    ${avisoLectura()}
    <div class="grid-home"><div class="col">${paseView()}
      <section><div class="sec-h"><h2>Herramientas</h2><span class="hint">Se abren en una pestaña nueva</span></div>${herramientasView()}</section></div>
      <div class="col">${comunicadosMini()}${semanaView()}</div></div>`;
}
function paseView() {
  const p = P(), tz = miTz(), t = S.hoy.malla ? turno(S.hoy.malla.turno_id) : null;
  const m = Object.fromEntries(S.hoy.marcas.map(x => [x.tipo, toMin(horaEn(tz, new Date(x.hora)))]));
  const [hh, mm] = horaEn(tz).split(':');
  const stub = `<div class="stub"><div class="eyebrow">Pase de jornada</div><div class="who">${esc(p.nombre)}</div>
      <dl><dt>Turno</dt><dd>${t ? esc(t.nombre) : 'Sin asignar'}</dd>${t && t.entrada ? `<dt>Horario</dt><dd class="num">${hhmm(t.entrada)}–${hhmm(t.salida)}</dd>` : ''}
        <dt>Sede</dt><dd>${esc(sede(p.sede_id).nombre)}</dd><dt>Fecha</dt><dd class="num">${esc(fechaCorta(S.hoy.fecha))}</dd></dl>
      <div class="clock num" id="clock">${hh}:${mm}<small>:${segEn(tz)}</small></div></div>`;
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
  if (S.malla.sede == null) S.malla.sede = esGerencia() ? 0 : P().sede_id;
  S.malla.filas = await q(sb.from('malla').select('persona_id,fecha,turno_id').gte('fecha', S.malla.lunes).lte('fecha', sumarDias(S.malla.lunes, 5)));
  if (esLider() && !S.turnoSede) S.turnoSede = esGerencia() ? S.sedes[0]?.id : P().sede_id;
}
function mallaView() {
  const lunes = S.malla.lunes, hoy = fechaEn(miTz());
  const gente = S.personas.filter(x => x.activo && (S.malla.sede === 0 || x.sede_id === S.malla.sede));
  const celda = (x, i) => {
    const f = sumarDias(lunes, i), r = S.malla.filas.find(y => y.persona_id === x.id && y.fecha === f), t = r ? turno(r.turno_id) : null;
    if (!lideraSede(x.sede_id)) return `<td class="${f === hoy ? 'today' : ''}"><span class="shift ${claseTurno(t)}">${t ? esc(t.nombre) : '—'}</span></td>`;
    const ops = S.turnos.filter(y => y.sede_id === x.sede_id && y.activo);
    return `<td class="${f === hoy ? 'today' : ''}"><select class="shift ${claseTurno(t)}" data-malla="${x.id}|${f}" aria-label="Turno de ${esc(x.nombre)} el ${DIAS[i]}">
      <option value="">—</option>${ops.map(o => `<option value="${o.id}" ${t && t.id === o.id ? 'selected' : ''}>${esc(o.nombre)}</option>`).join('')}</select></td>`;
  };
  const filas = gente.map(x => `<tr><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>${esc(area(x.area_id).nombre)} · ${esc(sede(x.sede_id).nombre)}</small></div></div></td>${DIAS.map((_, i) => celda(x, i)).join('')}</tr>`).join('');
  const ayuda = !esLider() ? 'La malla es pública: todo el equipo la ve. Solo la directora de cada sede y la gerencia pueden cambiarla.'
    : esGerencia() ? 'Puedes cambiar los turnos de las dos sedes. Cada cambio queda guardado en el historial.' : `Puedes cambiar los turnos de la sede ${esc(sede(P().sede_id).nombre)}. Cada cambio queda guardado en el historial.`;
  return `<div class="hello"><div><div class="eyebrow">Intranet · semana del ${esc(fechaCorta(lunes))}</div><h1>Malla de <em>horarios</em></h1><p>${ayuda}</p></div></div>
    <div class="toolbar"><div class="weeknav"><button class="btn ghost sm" type="button" data-semana="-7">Semana anterior</button><b>${esc(fechaCorta(lunes))} – ${esc(fechaCorta(sumarDias(lunes, 5)))}</b><button class="btn ghost sm" type="button" data-semana="7">Semana siguiente</button></div>
      <span style="display:flex;gap:8px;flex-wrap:wrap">${S.sedes.length > 1 ? `<select id="mSede" aria-label="Sede"><option value="0" ${S.malla.sede === 0 ? 'selected' : ''}>Las dos sedes</option>${S.sedes.map(s => `<option value="${s.id}" ${S.malla.sede === s.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>` : ''}
      ${esLider() ? `<button class="btn ghost sm" type="button" data-accion="copiarSemana">Copiar la semana anterior</button>` : ''}</span></div>
    <div class="card tablewrap"><table><thead><tr><th>Persona</th>${DIAS.map((d, i) => { const f = sumarDias(lunes, i); return `<th class="${f === hoy ? 'today' : ''}">${d} ${f.slice(8)}${f === hoy ? ' · hoy' : ''}</th>`; }).join('')}</tr></thead>
      <tbody>${filas || '<tr><td colspan="7" class="vacio">No hay personas en esta sede todavía.</td></tr>'}</tbody></table></div>
    ${esLider() ? turnosView() : ''}`;
}
function turnosView() {
  const sedesEd = S.sedes.filter(s => lideraSede(s.id));
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
  S.asistencia = { malla, marcas };
}
function estadoPersona(x) {
  const tz = sede(x.sede_id).zona_horaria, hoy = fechaEn(tz), ahora = toMin(horaEn(tz));
  const r = S.asistencia.malla.find(y => y.persona_id === x.id && y.fecha === hoy), t = r ? turno(r.turno_id) : null;
  const m = Object.fromEntries(S.asistencia.marcas.filter(y => y.persona_id === x.id && y.fecha === hoy).map(y => [y.tipo, toMin(horaEn(tz, new Date(y.hora)))]));
  let est;
  if (t && !t.entrada) est = ['mute', t.nombre];
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
  const lb = S.com.lb; if (!lb) return '';
  const imgs = S.com.imgs[lb.cid] || [], im = imgs[lb.i], c = S.com.lista.find(x => x.id === lb.cid); if (!im || !c) return '';
  return `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Imagen del comunicado">
    <div class="lb-top"><div><b>${esc(c.titulo)}</b><div style="font-size:13px;opacity:.8">${esc(im.nombre)} · ${lb.i + 1} de ${imgs.length}</div></div>
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
        <div class="field"><label for="nRol">Rol</label><select id="nRol"><option value="colaborador">Colaborador</option><option value="directora">Directora de operaciones</option><option value="gerente">Gerente</option></select></div>
      </div><div><button class="btn teal" type="submit">${ico('plus')} Crear cuenta</button></div></form></section>
    <section><div class="sec-h"><h2>Personas <span class="hint num">(${S.personas.filter(x => x.activo).length} activas)</span></h2>
      <div class="search" style="flex:0 1 260px"><input id="eFiltro" type="search" placeholder="Buscar por nombre o correo" value="${esc(S.equipo.filtro)}" aria-label="Buscar personas" style="padding-left:14px"></div></div>
      <div class="card tablewrap"><table class="perm"><thead><tr><th>Persona</th><th>Sede</th><th>Área</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>
      ${lista.map(x => { const yo = x.id === P().id; return `<tr class="${x.activo ? '' : 'inactivo'}"><td><div class="person"><div class="avatar soft">${initials(x.nombre)}</div><div><b>${esc(x.nombre)}</b><small>${esc(x.correo)}</small></div></div></td>
        <td><select data-perfil="${x.id}|sede_id" aria-label="Sede de ${esc(x.nombre)}" ${yo ? 'disabled' : ''}>${opt(S.sedes, x.sede_id)}</select></td>
        <td><select data-perfil="${x.id}|area_id" aria-label="Área de ${esc(x.nombre)}">${opt(S.areas, x.area_id)}</select></td>
        <td><select data-perfil="${x.id}|rol" aria-label="Rol de ${esc(x.nombre)}" ${yo ? 'disabled' : ''}>${['colaborador', 'directora', 'gerente'].map(r => `<option value="${r}" ${x.rol === r ? 'selected' : ''}>${{ colaborador: 'Colaborador', directora: 'Directora', gerente: 'Gerente' }[r]}</option>`).join('')}</select>${x.es_admin ? '<div class="hint">Administración</div>' : ''}</td>
        <td><span class="chip ${x.activo ? 'ok' : 'mute'}">${x.activo ? 'Activa' : 'Desactivada'}</span></td>
        <td style="white-space:nowrap">${yo ? '<span class="hint">Tu cuenta</span>' : `<button class="btn ghost sm" type="button" data-restablecer="${x.id}">Restablecer contraseña</button>
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
    if (view === 'asistencia') await cargarAsistencia();
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
  const b = e.target.closest('button'); if (!b) { if (S.menu && !e.target.closest('.menu')) { S.menu = false; render(); } return; }
  const a = b.dataset.accion;
  if (b.dataset.view) { ir(b.dataset.view); return; }
  if (a === 'menu') { S.menu = !S.menu; render(); return; }
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
  if (b.dataset.lb) { const [cid, i] = b.dataset.lb.split('|').map(Number); S.com.lb = { cid, i }; render(); return; }
  if (a === 'lbCerrar') { S.com.lb = null; render(); return; }
  if (b.dataset.lbmover) { const n = (S.com.imgs[S.com.lb.cid] || []).length; S.com.lb.i = (S.com.lb.i + Number(b.dataset.lbmover) + n) % n; render(); return; }
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
      const filas = prev.filter(r => { const x = persona(r.persona_id); return x && x.activo && lideraSede(x.sede_id) && (S.malla.sede === 0 || x.sede_id === S.malla.sede); })
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
    if (el.id === 'cImg') {
      for (const file of el.files) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast(`"${file.name}" no es JPG, PNG ni WEBP.`); continue; }
        S.com.borrador.push({ file, vista: URL.createObjectURL(file) });
      }
      el.value = ''; document.getElementById('borrador').innerHTML = borradorView(); return;
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && (S.menu || S.com.lb)) { S.menu = false; S.com.lb = null; render(); }
  if (S.com.lb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const n = (S.com.imgs[S.com.lb.cid] || []).length; S.com.lb.i = (S.com.lb.i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; render(); }
});

setInterval(() => {
  const c = document.getElementById('clock'); if (!c || !S.perfil) return;
  const tz = miTz(); c.innerHTML = `${horaEn(tz)}<small>:${segEn(tz)}</small>`;
}, 1000);

sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && S.pantalla !== 'login') { S.pantalla = 'login'; render(); } });
iniciar();
})();
