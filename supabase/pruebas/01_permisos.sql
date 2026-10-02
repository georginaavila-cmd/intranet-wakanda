\set ON_ERROR_STOP 0
\set QUIET 1
-- personas
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-0000000000d1'),('00000000-0000-0000-0000-0000000000c1'),('00000000-0000-0000-0000-0000000000c2'),('00000000-0000-0000-0000-00000000000c');
insert into perfiles (id,nombre,correo,sede_id,area_id,rol,es_admin) values
 ('00000000-0000-0000-0000-00000000000a','Gerente','g@x',1,1,'gerente',false),
 ('00000000-0000-0000-0000-0000000000d1','Directora CO','d@x',1,3,'directora',false),
 ('00000000-0000-0000-0000-0000000000c1','Colab Bog Ops','c1@x',1,3,'colaborador',false),
 ('00000000-0000-0000-0000-0000000000c2','Colab SD Com','c2@x',2,2,'colaborador',false),
 ('00000000-0000-0000-0000-00000000000c','Contabilidad','k@x',1,4,'colaborador',false);
insert into revisores (persona_id, sede_id, tipos, nivel) values ('00000000-0000-0000-0000-00000000000c', null, '{incapacidad}', 'aprobar');
set role authenticated;
\echo '--- C1 marca'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select tipo from marcar('entrada');
\echo 'esperado error: ya marcaste'
select tipo from marcar('entrada');
\echo 'esperado error: primero salida almuerzo'
select tipo from marcar('regreso_almuerzo');
\echo 'esperado error: insert directo denegado'
insert into marcas (persona_id, fecha, tipo) values (auth.uid(), current_date, 'salida');
\echo 'esperado error: colaborador no edita malla'
insert into malla (persona_id, fecha, turno_id) values (auth.uid(), current_date, 1);
\echo '--- C2 marca'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
select tipo from marcar('entrada');
\echo 'C2 ve marcas (esperado 1):'
select count(*) from marcas;
\echo '--- Directora CO'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
\echo 've marcas de su sede (esperado 1):'
select count(*) from marcas;
insert into malla (persona_id, fecha, turno_id) values ('00000000-0000-0000-0000-0000000000c1', current_date, 1);
\echo 'esperado error: malla de otra sede'
insert into malla (persona_id, fecha, turno_id) values ('00000000-0000-0000-0000-0000000000c2', current_date, 6);
\echo 'historial (esperado 1):'
select count(*) from malla_historial;
insert into comunicados (titulo, cuerpo, destino, destino_id) values ('Para Operaciones', 'texto', 'area', 3);
\echo 'esperado error: colaborador no publica'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
insert into comunicados (titulo, cuerpo) values ('x','y');
\echo 'C1 ve comunicados (esperado 1):'
select count(*) from comunicados;
insert into comunicado_lecturas (comunicado_id, persona_id) select id, auth.uid() from comunicados;
\echo 'C2 ve comunicados (esperado 0):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
select count(*) from comunicados;
\echo 'esperado error: C2 confirma comunicado que no es suyo'
insert into comunicado_lecturas (comunicado_id, persona_id) values (1, auth.uid());
\echo '--- Solicitudes'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
\echo 'esperado error: modulo apagado'
insert into solicitudes (tipo, desde, hasta) values ('vacaciones', current_date, current_date);
\echo 'esperado error: colaborador no cambia configuracion (0 filas)'
update configuracion set valor = '{"activo": true}' where clave = 'modulo_solicitudes';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update configuracion set valor = '{"activo": true}' where clave = 'modulo_solicitudes';
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
insert into solicitudes (tipo, desde, hasta) values ('vacaciones', current_date, current_date + 2);
insert into solicitudes (tipo, desde, hasta, motivo) values ('incapacidad', current_date, current_date, 'gripe');
\echo 'esperado error: auto-aprobar'
select estado from revisar_solicitud(2, true);
\echo 'esperado error: crearla ya aprobada'
insert into solicitudes (tipo, desde, hasta, estado) values ('permiso', current_date, current_date, 'aprobada');
insert into storage.objects (bucket_id, name) values ('soportes', '2/incapacidad.jpg');
\echo 'Contabilidad ve solicitudes (esperado 1, solo incapacidad):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select tipo from solicitudes;
\echo 've soporte (esperado 1):'
select count(*) from storage.objects;
\echo 'esperado error: aprobar vacaciones'
select estado from revisar_solicitud(1, true);
select estado from revisar_solicitud(2, true, 'Que te mejores');
\echo 'esperado error: C2 sube soporte a solicitud ajena'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
insert into storage.objects (bucket_id, name) values ('soportes', '1/x.jpg');
\echo 'C2 ve solicitudes (esperado 0):'
select count(*) from solicitudes;
\echo 'Directora CO sin acceso de revisora ve solicitudes de otros (esperado 0):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select count(*) from solicitudes;
\echo 'Gerente ve (esperado 2) y aprueba vacaciones:'
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select count(*) from solicitudes;
select estado from revisar_solicitud(1, true);
\echo 'Herramientas visibles para colaborador (esperado 3):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select count(*) from herramientas;
\echo 'esperado 0 filas: colaborador se vuelve admin'
update perfiles set es_admin = true where id = auth.uid();
select es_admin from perfiles where id = auth.uid();
