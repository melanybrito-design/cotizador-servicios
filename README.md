# Cotiza · Melany Brito

Un estudio de propuestas para cotizar servicios de automatización, RPA, Google Apps Script, agentes de IA, consultoría y capacitación. Panel privado, formulario de solicitudes y proformas PDF con alcance y retorno estimado por capacidad recuperada.

## Empezar en tu equipo

Requiere Node.js 22 o superior y npm. La versión validada usa Node 24.

```sh
npm ci
npm run setup
npm run dev
```

Abre http://127.0.0.1:3004. La clave de acceso se genera en `.env.local`, variable `ADMIN_PASSWORD`. Ese archivo es privado y está excluido de Git. Puedes cambiar la clave (mínimo 16 caracteres) y reiniciar el servidor. Cambiar también `SESSION_SECRET` invalida las sesiones existentes.

La base de datos local se guarda en `data/cotizador.db`, fuera de Git. Los datos sobreviven al cierre del navegador y al reinicio de la aplicación. No dependen de localStorage.

Para ejecutar la compilación de producción local:

```sh
npm run build
npm start
```

## Primer uso

1. En **Configuración**, confirma tu nombre comercial y añade correo o teléfono. Puedes subir un logo PNG/JPG pequeño. Tarifa inicial: **USD 15/h**. Vigencia y condiciones iniciales son editables, no una decisión fiscal o contractual.
2. En **Servicios**, ajusta el catálogo. Las horas de ejemplo no son un tarifario comercial aprobado. No se publican precios automáticos a clientes.
3. En **Nueva cotización**, completa cliente y necesidad, añade módulos y ajusta horas o precio fijo.
4. Opcionalmente activa **Ahorro y valor**. El costo por hora del cliente es distinto de tu tarifa. Los campos desconocidos pueden quedar vacíos.
5. En **Revisar y emitir**, confirma impuestos (también si corresponden a 0 %), cronograma y condiciones. Descarga un borrador, emite y descarga la proforma final.
6. Cada versión emitida conserva PDF e instantánea. Editar después crea un nuevo borrador; el historial permite recuperar documentos anteriores. Descargar no envía mensajes ni registra una aceptación.
7. El formulario `/solicitar` recibe solicitudes y las muestra en **Solicitudes**. Convertir una solicitud crea un borrador revisable; no cotiza automáticamente a partir del presupuesto.

En esta entrega la aplicación funciona localmente. Un enlace `127.0.0.1` no se puede compartir con clientes que estén en otros equipos. GitHub guarda el código, no publica el servicio web ni sus datos.

## Precios y retorno

- Por horas: minutos × tarifa en centavos × cantidad / 60, redondeado por línea.
- Precio fijo: importe × cantidad; las horas internas no se facturan otra vez.
- Descuento por línea y después impuesto sobre el neto. Pago único, mensualidad y pagos directos a terceros se mantienen separados.
- El servidor valida la propuesta antes de emitir. El navegador no envía un total confiable.
- Horas recuperadas = volumen mensual del equipo × cobertura × (minutos actuales − futuros) / 60 − supervisión mensual.
- Capacidad valorada = horas recuperadas × costo/hora del cliente.
- ROI de capacidad = (beneficio del horizonte − inversión inicial − recurrentes del horizonte) / (inversión inicial + recurrentes del horizonte) × 100.
- Se calcula solo con costos confirmados, impuestos confirmados y costo/hora conocido; los resultados negativos se conservan y el denominador cero no produce infinito.
- Recuperación simple = inversión / beneficio mensual neto, solo si este es positivo. Supone operación estable sin rampa de adopción. **Capacidad recuperada no equivale a caja ni ingresos garantizados.**

## Arquitectura

- Next.js + React + TypeScript.
- Zod: esquemas compartidos y validación en servidor.
- libSQL: SQLite persistente local o base remota compatible.
- React PDF: generación en servidor con fuentes locales; pdf-lib añade pies y numeración. PDF almacenado como BLOB con hash SHA-256.
- Un administrador con clave privada; sesión firmada de 12 horas en cookie HttpOnly/SameSite Strict; Secure en HTTPS.
- Validación de origen en mutaciones, consultas parametrizadas, límites de tamaño, límites persistentes para login/formulario, honeypot y consentimiento.
- Edición optimista con revisiones para evitar sobrescrituras entre pestañas. Emisión idempotente por cotización/revisión y folios atómicos.

```text
src/app/                  Páginas y API HTTP
src/components/           Panel, editor, catálogo, configuración y formulario
src/domain/               Esquemas, tarifas, cálculo e impacto
src/server/               Autenticación, persistencia y PDF
public/fonts/             Fuentes incrustadas en PDF y licencia OFL
tests/                    Casos de cálculo y validación
scripts/                  Configuración y pruebas del flujo completo
```

## Pruebas

```sh
npm test
npm run typecheck
npm run format:check
npm run build
npm run test:integration
```

Las pruebas de integración arrancan temporalmente en el puerto 3054, usan otra base de datos y credenciales ficticias, generan PDF de ejemplo en `output/pdf` y eliminan la base de prueba al terminar. Se verifican control de acceso, solicitudes idempotentes, edición concurrente, emisión y conservación de versiones.

## Publicación futura en Vercel

Esta versión incluye el código necesario, pero **no ha provisionado una base de datos remota ni ha publicado el sitio**. Antes de compartir el formulario:

1. Crea una base libSQL remota en un proveedor compatible. Confirma su presupuesto y política de respaldos.
2. Importa el repositorio en Vercel como Next.js y configura `DATABASE_URL` (`libsql://…`), `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET` (32 caracteres o más) y `APP_URL` (origen HTTPS exacto, sin ruta ni barra final). Variables privadas, sin prefijo `NEXT_PUBLIC_`.
3. Nunca uses SQLite local en Vercel: el sistema lo rechaza porque el almacenamiento efímero no sirve para conservar solicitudes. Tampoco uses GitHub Pages: el proyecto requiere servidor.
4. Verifica límites de memoria/duración y tamaño de BLOB del proveedor con tus proformas reales. El PDF se genera dentro de la transacción de emisión para no dejar documentos parcialmente emitidos; una transacción remota que expire devuelve un error sin emitir.
5. Publica y prueba acceso, formulario y PDF con datos ficticios. Comprueba correo/teléfono, condiciones y privacidad antes de usar clientes reales.

El código limita por IP cuando está detrás de Vercel usando su cabecera de IP. En un servidor propio el límite es global; adapta una cabecera confiable de tu proxy antes de admitir tráfico externo. El acceso del panel es para una única administradora; no es un portal multiusuario de clientes.

## Respaldo y operación

- Local: detén la aplicación y copia la carpeta `data/` completa a un lugar privado. Para restaurar, con el servidor detenido, repón esa carpeta y reinicia. Conserva `.env.local` por separado en un gestor seguro. No subas esos archivos a GitHub.
- Remoto: configura respaldos y prueba restauración con el proveedor. No asumas que GitHub respalda tus clientes o PDF.
- Guarda las descargas finales en tu archivo comercial si quieres una segunda copia.
- No hay envío automático, firma electrónica, cobros ni rangos automáticos sin revisar alcance. El panel registra cambios de estado comerciales manuales.
- Los supuestos de precio y ROI necesitan revisión humana. El PDF identifica un borrador cuando aún no se ha emitido.

Documentación técnica: [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [libSQL Client](https://tursodatabase.github.io/libsql-client-ts/interfaces/Client.html), [React PDF](https://react-pdf.org/).
