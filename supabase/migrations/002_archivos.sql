-- Intranet Wakanda Travel · almacenamiento de imágenes y soportes
-- Dos carpetas privadas (buckets). Nada es público: solo quien inició sesión y tiene permiso puede abrir un archivo.
--   comunicados/<id del comunicado>/<archivo>
--   soportes/<id de la solicitud>/<archivo>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('comunicados', 'comunicados', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('soportes', 'soportes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

-- Convierte la primera carpeta de la ruta en número sin fallar si no lo es.
create function carpeta_id(ruta text) returns bigint
language sql immutable as $$
  select case when split_part(ruta, '/', 1) ~ '^[0-9]+$' then split_part(ruta, '/', 1)::bigint end
$$;

-- Imágenes de comunicados: las ve quien puede ver el comunicado; las sube su autora o la gerencia.
create policy archivos_comunicados_ver on storage.objects for select to authenticated
  using (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)));
create policy archivos_comunicados_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)
                and (c.autor_id = auth.uid() or public.es_gerencia())));
create policy archivos_comunicados_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'comunicados'
    and exists (select 1 from public.comunicados c where c.id = public.carpeta_id(name)
                and (c.autor_id = auth.uid() or public.es_gerencia())));

-- Soportes de solicitudes: los ve quien puede ver la solicitud; los sube solo su dueño mientras esté pendiente.
create policy archivos_soportes_ver on storage.objects for select to authenticated
  using (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)));
create policy archivos_soportes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'soportes'
    and exists (select 1 from public.solicitudes s where s.id = public.carpeta_id(name)
                and s.persona_id = auth.uid() and s.estado = 'pendiente'));
