-- Intranet · permisos del rol de servicio
-- La Edge Function crear-usuario usa la llave de servicio (rol service_role) para crear el perfil
-- y activar o desactivar personas. Con "Automatically expose new tables" apagado, ese rol
-- tampoco recibe permisos solo: sin esto, crear una cuenta falla con "permission denied for table perfiles".

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
