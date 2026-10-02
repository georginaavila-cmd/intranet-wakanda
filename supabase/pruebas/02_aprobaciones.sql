\set QUIET 1
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select id as vac from solicitudes where tipo='vacaciones' \gset
select id as inc from solicitudes where tipo='incapacidad' \gset
insert into storage.objects (bucket_id, name) values ('soportes', :'inc' || '/incapacidad.jpg');
\echo 'Contabilidad ve soporte de incapacidad (esperado 1):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select count(*) from storage.objects where name like :'inc' || '/%';
\echo 'Contabilidad aprueba incapacidad (esperado aprobada):'
select estado from revisar_solicitud(:inc, true, 'Que te mejores');
\echo 'esperado error: ya revisada'
select estado from revisar_solicitud(:inc, false);
\echo 'esperado error: contabilidad aprueba vacaciones'
select estado from revisar_solicitud(:vac, true);
\echo 'Gerente aprueba vacaciones (esperado aprobada):'
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select estado from revisar_solicitud(:vac, true);
\echo 'Gerente ve el soporte (esperado >=1):'
select count(*) from storage.objects;
