# Validación de la primera versión

Comprobaciones ejecutadas el 26 de septiembre de 2026 (hora de Ecuador):

- 13 pruebas de precios, ROI, datos desconocidos, valores negativos, tarifas históricas y validación: aprobadas.
- 14 comprobaciones de integración con base de datos independiente: aprobadas. Incluyen acceso privado, rechazo de orígenes ajenos, cookie HttpOnly, solicitudes y conversiones idempotentes, conflictos de revisión, emisión, descarga, inmutabilidad de PDF y bloqueo de eliminación de historial emitido.
- Compilación de producción, TypeScript y formato Prettier: aprobados.
- npm audit tras la instalación: sin vulnerabilidades reportadas en ese momento.
- Navegador: panel a 1440 px, editor a 390 px sin desbordamiento horizontal, creación y guardado automático, selección de módulo RPA (20 h × USD 15 = USD 300) y formulario de cliente enviado en tres pasos con confirmación.
- PDF: documento breve de 2 páginas y prueba extensa de 7 páginas. Se revisaron visualmente la plantilla y los saltos de página. Extracción de texto confirmó los 8 cierres de alcance, las condiciones finales y la ausencia del marcador de notas internas. Se verificó numeración por página y coordenadas dentro del papel.
- Datos ficticios de navegación eliminados; la base de integración se elimina automáticamente. Las capturas y PDF de prueba permanecen ignorados por Git.

## Límites de esta validación

No se ha contratado ni probado una base remota, un despliegue Vercel, envíos por correo, pagos o firmas electrónicas. El servidor remoto necesita su propia prueba de tiempo de generación de PDF y límites de transacción. Tampoco se ha realizado todavía el piloto comercial con cotizaciones reales ni medido el objetivo de menos de dos minutos.

La identidad comercial, contacto, impuestos, horas del catálogo y condiciones deben revisarse en el panel antes de emitir una proforma real. El programa impide emitir si faltan datos mínimos o la confirmación de impuestos.
