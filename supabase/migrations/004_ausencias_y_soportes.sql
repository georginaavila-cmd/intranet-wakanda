-- Intranet Wakanda Travel · ausencias aprobadas y borrado de soportes
-- 1. ausencias_aprobadas(): la asistencia y los informes necesitan saber quién está de vacaciones, con permiso o incapacitado,
--    aunque la líder no sea revisora de solicitudes. Solo devuelve persona, tipo y fechas (nunca motivo ni soportes),
--    y solo de las personas que quien consulta lidera (o de sí misma).
-- 2. Quien envió una solicitud pendiente puede borrar sus propios soportes al cancelarla.

create function ausencias_aprobadas(p_desde date, p_hasta date)
returns table (persona_id uuid, tipo solicitud_tipo_t, desde date, hasta date)
language sql stable security definer set search_path = public as $$
  select s.persona_id, s.tipo, s.desde, s.hasta
  from solicitudes s
  where s.estado = 'aprobada' and s.hora_desde is null
    and s.desde <= p_hasta and s.hasta >= p_desde
    and (s.persona_id = auth.uid() or lidera_sede(sede_de(s.persona_id)))
$$;
revoke all on function ausencias_aprobadas(date, date) from public, anon;
grant execute on function ausencias_aprobadas(date, date) to authenticated;

create policy archivos_soportes_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)
                and s.persona_id = auth.uid() and s.estado = 'pendiente'));
