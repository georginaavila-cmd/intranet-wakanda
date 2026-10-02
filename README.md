# Intranet Wakanda Travel

Intranet del equipo de Wakanda Travel: pase de jornada (entrada, almuerzo y salida), malla de horarios, turnos, asistencia del día, comunicados con imágenes y confirmación de lectura, solicitudes de vacaciones, permisos e incapacidades, informes mensuales para la gerencia y administración de cuentas.

- **Página:** https://georginaavila-cmd.github.io/intranet-wakanda/ (GitHub Pages, rama `main`)
- **Datos:** Supabase, proyecto `tlppvxbusfocsgqppnbr` (East US). Cuenta dueña: `georgina.avila@wakanda.travel`.
- **Diseño y decisiones:** prototipo y `DECISIONES.md` en el repositorio `proyectos`, carpeta `intranet/`.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | La página. No necesita compilación |
| `assets/app.js` | La aplicación (JavaScript sin dependencias, salvo supabase-js desde jsDelivr) |
| `assets/estilos.css`, `assets/app.css` | Estilos con el sistema de diseño de Wakanda |
| `assets/config.js` | URL y llave **pública** de Supabase. Nunca pongas aquí la llave secreta |
| `supabase/migrations/` | Base de datos: tablas, reglas de seguridad (RLS), carpetas de archivos y datos iniciales |
| `supabase/functions/crear-usuario/` | Crea cuentas, restablece contraseñas y desactiva personas (solo administración) |
| `supabase/pruebas/` | Pruebas de permisos para un PostgreSQL local |
| `pruebas/demo.html` | La página con un Supabase simulado, para probar la interfaz sin conexión (contraseña de prueba: `clave1234`) |

## Seguridad

La página es pública, pero los datos no: cada consulta pasa por las reglas de la base de datos. La hora de cada marca la pone el servidor, nadie puede marcar dos veces lo mismo, la malla solo la edita quien lidera la sede, y las cuentas solo las crea la administración. Ver `supabase/migrations/001_esquema.sql`.

## Cómo se crea una cuenta

1. La administración entra a **Equipo → Crear cuenta** con el nombre, el correo corporativo, la sede, el área y el rol.
2. La intranet genera una contraseña temporal y la muestra una sola vez. Se le entrega a la persona por un canal privado.
3. Al entrar por primera vez, la persona crea su propia contraseña y acepta el tratamiento de datos (Ley 1581 de 2012).
