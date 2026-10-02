/* Simulador mínimo de supabase-js para probar la interfaz sin conexión (solo para pruebas locales). */
(() => {
  const uid = () => crypto.randomUUID();
  const hoyTz = tz => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const ADMIN = '00000000-0000-0000-0000-00000000000a';
  const DB = {
    sedes: [{ id: 1, nombre: 'Bogotá', zona_horaria: 'America/Bogota' }, { id: 2, nombre: 'República Dominicana', zona_horaria: 'America/Santo_Domingo' }],
    areas: [{ id: 1, nombre: 'Dirección / Gerencia' }, { id: 2, nombre: 'Comercial / KAM' }, { id: 3, nombre: 'Operaciones / Reservas' }, { id: 4, nombre: 'Administración / Finanzas' }],
    turnos: [], herramientas: [
      { id: 1, nombre: 'OMNIAXIS', descripcion: 'Operaciones en AppSheet.', icono: 'compass', pie: 'Operaciones', url: 'https://example.com', orden: 1, activo: true },
      { id: 2, nombre: 'KAM 360', descripcion: 'Equipo comercial.', icono: 'target', pie: 'Comercial', url: 'https://example.com', orden: 2, activo: true }],
    configuracion: [{ clave: 'tolerancias', valor: { entrada_min: 5, almuerzo_min: 5 } }, { clave: 'validar_ip', valor: { activo: false } }, { clave: 'modulo_solicitudes', valor: { activo: false } }],
    perfiles: [{ id: ADMIN, nombre: 'Georgina Ávila', correo: 'georgina.avila@wakanda.travel', sede_id: 1, area_id: 1, rol: 'gerente', es_admin: true, activo: true, acepto_datos: null }],
    malla: [], marcas: [], comunicados: [], comunicado_imagenes: [], comunicado_lecturas: [], solicitudes: [], solicitud_adjuntos: [], revisores: []
  };
  let tid = 1;
  for (const s of [1, 2]) for (const [c, n, e, a, r, sa] of [['M', 'Mañana', '08:00:00', '12:30:00', '13:30:00', '17:30:00'], ['T', 'Tarde', '10:00:00', '14:00:00', '15:00:00', '19:00:00'], ['S', 'Sábado', '09:00:00', null, null, '13:00:00'], ['D', 'Descanso', null, null, null, null]])
    DB.turnos.push({ id: tid++, sede_id: s, codigo: c, nombre: n, entrada: e, salida_almuerzo: a, regreso_almuerzo: r, salida: sa, activo: true });
  DB.malla.push({ persona_id: ADMIN, fecha: hoyTz('America/Bogota'), turno_id: 1 });
  let sesion = null, meta = { debe_cambiar_contrasena: true };
  class Q {
    constructor(t) { this.t = t; this.f = []; this.op = 'select'; this.one = false; }
    select() { this.sel = true; return this; } order() { return this; } limit() { return this; }
    single() { this.one = true; return this; }
    insert(v) { this.op = 'insert'; this.v = [].concat(v); return this; }
    eq(c, v) { this.f.push(r => String(r[c]) === String(v)); return this; }
    gte(c, v) { this.f.push(r => r[c] >= v); return this; } lte(c, v) { this.f.push(r => r[c] <= v); return this; }
    in(c, vs) { this.f.push(r => vs.includes(r[c])); return this; }
    maybeSingle() { this.one = true; return this; }
    upsert(v) { this.op = 'upsert'; this.v = [].concat(v); return this; }
    update(v) { this.op = 'update'; this.v = v; return this; }
    delete() { this.op = 'delete'; return this; }
    then(ok, ko) { return Promise.resolve(this.run()).then(ok, ko); }
    run() {
      const T = DB[this.t], m = r => this.f.every(f => f(r));
      if (this.op === 'insert') { const out = this.v.map(v => { const r = { id: (T.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1), creado: new Date().toISOString(), ...(this.t === 'solicitudes' ? { estado: 'pendiente' } : {}), ...v }; T.push(r); return r; }); return { data: this.one ? out[0] : out, error: null }; }
      if (this.op === 'upsert') { for (const v of this.v) { const i = T.findIndex(r => r.persona_id === v.persona_id && r.fecha === v.fecha); if (i >= 0) T[i] = { ...T[i], ...v }; else T.push(v); } return { data: null, error: null }; }
      if (this.op === 'update') { T.filter(m).forEach(r => Object.assign(r, this.v)); return { data: null, error: null }; }
      if (this.op === 'delete') { DB[this.t] = T.filter(r => !m(r)); return { data: null, error: null }; }
      const rows = T.filter(m).map(r => ({ ...r }));
      return { data: this.one ? (rows[0] || null) : rows, error: null };
    }
  }
  let actual = ADMIN;
  const user = () => { const p = DB.perfiles.find(x => x.id === actual); return { id: actual, email: p.correo, user_metadata: actual === ADMIN ? meta : {} }; };
  window.supabase = { createClient: () => ({
    from: t => new Q(t),
    auth: {
      getSession: async () => ({ data: { session: sesion } }),
      signInWithPassword: async ({ email, password }) => { const p = DB.perfiles.find(x => x.correo === email); if (password !== 'clave1234' || !p) return { data: {}, error: { message: 'Invalid login credentials' } }; actual = p.id; sesion = { user: user() }; return { data: { user: user() }, error: null }; },
      updateUser: async ({ data }) => { Object.assign(meta, data || {}); return { data: { user: user() }, error: null }; },
      signOut: async () => { sesion = null; return {}; },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    rpc: async (fn, args) => {
      if (fn === 'aceptar_datos') { DB.perfiles.find(x => x.id === actual).acepto_datos = new Date().toISOString(); return { error: null }; }
      if (fn === 'marcar') {
        const f = hoyTz('America/Bogota');
        if (DB.marcas.some(x => x.persona_id === ADMIN && x.fecha === f && x.tipo === args.p_tipo)) return { error: { message: 'ERROR: Ya marcaste entrada hoy.' } };
        DB.marcas.push({ persona_id: ADMIN, fecha: f, tipo: args.p_tipo, hora: new Date(Date.now() - 3600e3 * (4 - DB.marcas.length)).toISOString() }); return { data: {}, error: null };
      }
      if (fn === 'revisar_solicitud') { const x = DB.solicitudes.find(y => y.id === args.p_id); if (x.persona_id === actual) return { error: { message: 'ERROR: No puedes revisar tus propias solicitudes.' } }; Object.assign(x, { estado: args.p_aprobar ? 'aprobada' : 'rechazada', revisado_por: actual, comentario: args.p_comentario }); return { data: x, error: null }; }
      if (fn === 'ausencias_aprobadas') return { data: DB.solicitudes.filter(x => x.estado === 'aprobada' && !x.hora_desde && x.desde <= args.p_hasta && x.hasta >= args.p_desde), error: null };
      return { error: { message: 'rpc desconocida' } };
    },
    storage: { from: () => ({
      upload: async (ruta, file) => { (window.__archivos = window.__archivos || {})[ruta] = URL.createObjectURL(file); return { data: { path: ruta }, error: null }; },
      createSignedUrls: async rutas => ({ data: rutas.map(r => ({ path: r, signedUrl: (window.__archivos || {})[r] })), error: null }),
      remove: async () => ({ data: [], error: null }) }) },
    functions: { invoke: async (n, { body }) => {
      if (body.accion === 'crear') { DB.perfiles.push({ id: uid(), nombre: body.nombre, correo: body.correo, sede_id: body.sede_id, area_id: body.area_id, rol: body.rol, es_admin: false, activo: true, acepto_datos: null }); return { data: { ok: true }, error: null }; }
      if (body.accion === 'desactivar' || body.accion === 'reactivar') { DB.perfiles.find(p => p.id === body.id).activo = body.accion === 'reactivar'; return { data: { ok: true }, error: null }; }
      return { data: { ok: true }, error: null };
    } }
  }) };
})();
