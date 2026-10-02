-- Intranet Wakanda Travel · datos iniciales
-- Sedes, áreas, turnos de ejemplo, herramientas y configuración. Todo se puede cambiar después desde la intranet.

insert into sedes (nombre, zona_horaria) values
  ('Colombia', 'America/Bogota'),
  ('República Dominicana', 'America/Santo_Domingo');

insert into areas (nombre) values
  ('Dirección / Gerencia'),
  ('Comercial / KAM'),
  ('Operaciones / Reservas'),
  ('Administración / Finanzas');

-- Turnos de ejemplo. La primera tarea de cada directora es ajustarlos a los horarios reales de su sede.
insert into turnos (sede_id, codigo, nombre, entrada, salida_almuerzo, regreso_almuerzo, salida)
select s.id, t.codigo, t.nombre, t.entrada::time, t.salida_almuerzo::time, t.regreso_almuerzo::time, t.salida::time
from sedes s cross join (values
  ('M', 'Mañana',     '08:00', '12:30', '13:30', '17:30'),
  ('T', 'Tarde',      '10:00', '14:00', '15:00', '19:00'),
  ('S', 'Sábado',     '09:00', null,    null,    '13:00'),
  ('D', 'Descanso',   null,    null,    null,    null),
  ('V', 'Vacaciones', null,    null,    null,    null)
) as t(codigo, nombre, entrada, salida_almuerzo, regreso_almuerzo, salida);

insert into herramientas (nombre, descripcion, icono, pie, url, orden) values
  ('OMNIAXIS', 'Herramienta de operaciones en AppSheet. Se abre con la cuenta de Google de operaciones.', 'compass', 'Operaciones · AppSheet',
   'https://www.appsheet.com/start/66a528eb-aa3d-4979-ab72-52c53f755fd8?platform=desktop', 1),
  ('Wakanda Documentos', 'Cotizaciones, confirmaciones, vouchers e itinerarios con el diseño de Wakanda.', 'file', 'Documentos de viaje',
   'https://claude.ai/artifact/1PK4MfNXHBSgoozg83oksE', 2),
  ('KAM 360', 'Visitas, prospectos y solicitudes a Operaciones del equipo comercial.', 'target', 'Equipo comercial',
   'https://georginaavila-cmd.github.io/kam360/', 3);

insert into configuracion (clave, valor) values
  ('modulo_solicitudes', '{"activo": false}'),                 -- la gerencia lo activa cuando quiera
  ('tolerancias', '{"entrada_min": 5, "almuerzo_min": 5}'),     -- minutos antes de contar tarde / almuerzo largo
  ('meta_puntualidad', '{"porcentaje": 95}'),
  ('validar_ip', '{"activo": false}');                          -- se activa en la etapa final, desde la oficina

-- 2 de octubre de 2026: las sedes se llaman "Colombia" y "República Dominicana" (ya aplicado en Supabase).
