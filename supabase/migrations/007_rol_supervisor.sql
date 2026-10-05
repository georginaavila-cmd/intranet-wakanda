-- Intranet · rol Supervisor (parte 1)
-- Postgres no deja usar un valor nuevo de un enum en la misma transacción que lo crea,
-- por eso el rol se agrega aquí y se usa en 008.
alter type rol_t add value if not exists 'supervisor' after 'colaborador';
