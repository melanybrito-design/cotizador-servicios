# Cotizador de servicios — base del proyecto

**Responsable:** Melany Brito.
**Estado:** primera versión implementada. Consulta README.md para alcance ejecutado, uso, pruebas y requisitos pendientes de publicación. Las preferencias comerciales no confirmadas siguen siendo configurables.
**Fecha:** 26 de septiembre de 2026.
**Moneda inicial:** USD. **Tarifa solicitada:** USD 15 por hora.

## 1. Objetivo y decisiones de partida

Crear una aplicación independiente para preparar cotizaciones de soluciones de automatización, justificar su valor con un cálculo transparente del tiempo recuperado y descargar una proforma profesional. La experiencia interna debe permitir preparar una propuesta sencilla en menos de dos minutos **cuando el alcance y las horas ya estén definidos**. Esa meta se medirá en pruebas; no sustituye el diagnóstico de proyectos complejos.

Dos entradas comparten el mismo motor de precios:

- **Melany cotiza:** selecciona un cliente, una solución, las horas y las condiciones; revisa y genera el PDF.
- **El cliente solicita:** responde un formulario breve; recibe un resumen y, si hay suficiente información, una estimación preliminar. Melany revisa el alcance antes de emitir la proforma final.

Propuesta inicial pendiente de preferencias: precio por servicio visible al cliente; desglose de horas y tarifa disponible solo en el panel privado. El sistema permitirá elegir mostrar las horas en el PDF.

El presupuesto del cliente sirve para priorizar o reducir alcance. **No cambia automáticamente el precio del mismo trabajo.** La rentabilidad potencial de la solución se presenta por separado del costo de implementación.

No se requieren agentes de IA, Make, n8n ni un generador de documentos externo para calcular precios o emitir el PDF. Son tipos de servicio que se cotizan o futuras integraciones, no dependencias obligatorias del cotizador.

## 2. Interfaz: una pantalla principal, cuatro pasos

### Navegación mínima

1. **Cotizaciones:** listado, búsqueda, estado, duplicar, revisar y descargar.
2. **Solicitudes:** respuestas del formulario público pendientes de revisar.
3. **Servicios:** catálogo de módulos y plantillas de alcance.
4. **Configuración:** marca, tarifa, condiciones, impuestos y preferencias.

«Nueva cotización» será el botón principal. Los clientes se crean o seleccionan dentro de la cotización; no necesitan un módulo de CRM separado en la primera versión.

### Editor de cotización

En escritorio: formulario a la izquierda y resumen de inversión a la derecha. En móvil: formulario por pasos y total visible, sin tablas demasiado anchas.

| Paso | Campos principales | Ayudas y automatismos |
|---|---|---|
| 1. Cliente y necesidad | Empresa, contacto, correo, problema y resultado esperado | Seleccionar cliente existente; completar datos fiscales solo si corresponde |
| 2. Solución y esfuerzo | Módulos, horas, entregables, exclusiones y dependencias | Plantilla editable; tarifa de USD 15/h; desglose avanzado plegado |
| 3. Ahorro y valor | Volumen mensual, minutos actuales y futuros, supervisión, costo/hora del cliente | Mostrar horas recuperadas; ROI solo si hay datos suficientes |
| 4. Revisar y generar | Plazo, vigencia, pago, mantenimiento, impuestos y notas | Vista previa; guardar borrador; emitir versión; descargar PDF |

El resumen muestra tres cifras separadas: **implementación**, **recurrente mensual** y **terceros**. Nunca mezclar un pago único con cargos mensuales bajo un único «total» ambiguo.

### Dirección visual

Tomar de la referencia el fondo claro, tarjetas redondeadas, aire entre bloques, navegación sencilla y un acento amarillo lima. Propuesta de base: fondo #F6F7F9, tarjetas #FFFFFF, texto #20232B y acento #DDF77B. Usar texto oscuro sobre el lima y verificar contraste, foco y teclado. Evitar el bajo contraste gris de la captura.

La proforma será más sobria que el panel: blanca, tipografía legible, tablas claras y un acento discreto que se imprima bien. El nombre o logo de Melany debe ocupar el encabezado, sin copiar la marca Starline de la referencia.

## 3. Catálogo modular

Separar el **problema que se resuelve** de la **tecnología utilizada**. El cliente puede pedir «dejar de copiar datos entre sistemas» sin saber si necesita RPA, Apps Script o una integración por API.

| Familia | Uso habitual | Entregables que deben delimitarse |
|---|---|---|
| Diagnóstico y consultoría | Identificar oportunidades y priorizar procesos | Procesos revisados, reunión, mapa de proceso y hoja de ruta |
| Automatización de flujos | Conectar formularios, correo, Sheets, CRM u otros servicios | Número de flujos, disparadores, acciones, reglas, errores y conexiones |
| Google Apps Script | Automatizar tareas de Sheets, Docs, Gmail o Drive | Archivos, funciones, permisos, disparadores y límites de ejecución |
| RPA | Ejecutar tareas repetitivas en interfaces cuando corresponda | Aplicaciones, pasos, equipo/entorno, excepciones y recuperación |
| Agentes de IA | Atención, consulta de información o apoyo a procesos | Canales, fuentes, herramientas permitidas, derivación humana y pruebas |
| Procesamiento documental | Extraer o clasificar datos de documentos | Formatos, campos, volumen, revisión humana y criterio de aceptación |
| Capacitación y entrega | Facilitar que el cliente use la solución | Número de sesiones, duración, manual y grabación si se acuerda |
| Soporte opcional | Acompañamiento después de entregar | Horas incluidas, alcance, horario y gestión de excedentes |

### Cada módulo debe tener

- Código y nombre comercial, descripción en lenguaje sencillo y tecnología opcional.
- Entregables, límites de alcance, exclusiones y criterios de aceptación.
- Horas de diagnóstico, construcción, pruebas y entrega. También coordinación si se cobra.
- Modalidad de precio: **por horas** o **importe fijo**. Solo una modalidad factura ese concepto.
- Dependencias del cliente: accesos, cuentas, datos, permisos y responsable de validación.
- Costos de terceros: quién contrata, quién paga, periodicidad y si el importe está confirmado o pendiente.
- Condiciones específicas; por ejemplo, el consumo de mensajería/modelos se cotiza separado y no se promete «ilimitado».

Un módulo de precio fijo conserva su estimación interna de horas para evaluar rentabilidad, pero esas horas no se vuelven a sumar al precio.

### Ejemplos para probar el motor, no catálogo comercial aprobado

| Ejemplo ficticio | Horas totales de todas las fases | Mano de obra a USD 15/h |
|---|---:|---:|
| Diagnóstico acotado | 4 h | USD 60 |
| Automatización sencilla | 8 h | USD 120 |
| Desarrollo Apps Script | 12 h | USD 180 |
| RPA acotado | 20 h | USD 300 |
| Agente de IA acotado | 30 h | USD 450 |

Estas horas ilustran el cálculo, no afirman cuánto tarda cualquier solución de esa categoría. Las plantillas reales se calibrarán con proyectos de Melany antes de habilitar precios automáticos para clientes.

## 4. Motor de precios

### Fórmula base

```text
Horas facturables = suma de horas aprobadas de los módulos por horas
Mano de obra = horas facturables × USD 15
Servicios = mano de obra + módulos de precio fijo + adicionales propios
Base después de descuento = servicios − descuento aprobado
Implementación = base después de descuento + cargos únicos facturados por Melany + impuestos configurados
```

Cada línea indica si participa en un descuento y cuál es su tratamiento de impuesto. El total se obtiene sumando las líneas calculadas: no se vuelve a gravar ni descontar el total general.

Separar:

- **Pago único a Melany:** implementación y conceptos incluidos.
- **Mensualidad a Melany:** soporte u operación, si se contrata.
- **Pagos directos a terceros:** licencias, hosting, mensajería o modelos; informativos, fuera de las cuentas por cobrar a Melany.
- **Terceros facturados por Melany:** líneas explícitas para evitar omitirlos o contarlos dos veces.

### Reglas de precio

- Tarifa inicial USD 15/h, editable por Melany; cada cotización conserva la tarifa usada aunque cambie la configuración futura.
- Cada módulo permite editar horas por fase; vista rápida con total de horas y opción «Ver desglose».
- Si se añade reserva de esfuerzo, expresarla en horas y mostrarla internamente. No aplicar también un multiplicador oculto de complejidad.
- No asumir que un proyecto de 20 horas se entrega en 20 horas de calendario. Calcular el cronograma con disponibilidad y dependencias.
- Impuestos configurables, **pendientes de confirmar**, sin copiar el 21 % de IVA que aparece en la imagen de referencia ni tratar «sin configurar» como exento.
- Un borrador puede existir con impuestos pendientes. La emisión definitiva exige que Melany haya confirmado el tratamiento aplicable o seleccione una presentación «impuestos por determinar» claramente preliminar.
- Descuento requiere motivo; si reduce el precio efectivo por hora, el panel lo hace visible. No se afirma que USD 15 sea una tarifa mínima rentable sin conocer costos y disponibilidad.
- Importes en centavos y horas en minutos; regla explícita de redondeo al centavo por línea. No hacer cálculos monetarios con redondeos de pantalla.
- Un presupuesto insuficiente produce opciones de menor alcance o fases, no una rebaja automática.

## 5. Ahorro, ROI y recuperación

### Datos que se necesitan del proceso del cliente

1. Volumen mensual de casos o ejecuciones.
2. Tiempo actual por caso y tiempo futuro estimado por caso, en minutos.
3. Porcentaje del volumen que realmente cubrirá la solución.
4. Supervisión y mantenimiento operativo mensual del cliente, en horas.
5. Costo por hora del personal del cliente, opcional y separado de la tarifa de Melany.
6. Costos mensuales adicionales: soporte, licencias, hosting y consumos.
7. Inversión inicial y costos internos de puesta en marcha si se conocen.

Marcar si el volumen corresponde al equipo entero o a una persona. Si ya es volumen total del equipo, no multiplicarlo otra vez por empleados. Usar el mismo proceso y período en todas las variables. Las horas de Melany y las horas recuperadas por el cliente son magnitudes distintas.

### Fórmulas

```text
Volumen cubierto = volumen mensual × porcentaje cubierto / 100
Horas netas recuperadas/mes = volumen cubierto × (minutos actuales − minutos futuros) / 60
                              − horas de supervisión adicional/mes
Valor mensual de capacidad = horas netas recuperadas × costo/hora del cliente

I = inversión inicial considerada para el cliente
R = costos recurrentes adicionales mensuales
B = valor mensual de capacidad recuperada
H = horizonte en meses
Costo total H = I + H × R
Beneficio valorado H = H × B
ROI estimado de capacidad H = (beneficio valorado H − costo total H) / costo total H × 100
Recuperación simple por capacidad = I / (B − R), solo si B − R > 0
```

Etiquetar el resultado como **ROI estimado por capacidad recuperada**. Liberar horas no significa que la empresa reduzca su nómina o gane ese dinero en efectivo.

Un modo de «ahorro efectivo» solo se habilita si el cliente puede identificar gastos realmente evitables. No sumar el valor de las mismas horas como ahorro de personal y como ingresos nuevos. Si posteriormente se incluyen ventas adicionales, usar contribución incremental y una hipótesis de atribución independiente; queda fuera del MVP.

Si faltan costos del personal, mostrar horas recuperadas y «valor económico pendiente». Si se desconocen costos de APIs, mostrar una simulación incompleta, no un ROI definitivo. Si el ahorro neto es negativo, mostrar el trabajo adicional estimado. Si no hay recuperación bajo los supuestos, decirlo sin esconder el resultado. Costo total cero implica ROI no calculable; no mostrar infinito.

Los impuestos no recuperables y costos internos relevantes forman parte de la inversión del cliente si se incluyen en el escenario. La herramienta debe indicar expresamente qué costos considera, sin asumir que los impuestos son recuperables.

### Ejemplo numérico verificable, sin impuestos ni puesta en marcha interna

- 20 horas de servicio × USD 15 = **USD 300 de implementación**.
- 200 casos/mes; 15 minutos actuales y 3 minutos futuros; cobertura 100 %; supervisión adicional 0 h en este ejemplo: **40 horas recuperadas/mes**.
- Costo del equipo del cliente: USD 8/h → **USD 320/mes de capacidad valorada**.
- Soporte y plataformas adicionales: USD 40/mes → **USD 280/mes de beneficio neto valorado**.
- Costo de 12 meses: 300 + 12 × 40 = **USD 780**.
- Capacidad valorada en 12 meses: 12 × 320 = **USD 3.840**.
- ROI estimado de capacidad: (3.840 − 780) / 780 × 100 = **392,31 %**.
- Recuperación simple: 300 / 280 = **1,07 meses de operación**, sin rampa de adopción.

Son supuestos ilustrativos, no resultados garantizados ni una recomendación de precio. Si hay adopción gradual, calcular beneficios por mes y la recuperación mediante flujo acumulado; no usar la división simple.

En el panel: horas recuperadas, costo total del primer año, beneficio valorado, ROI y recuperación. En el PDF: mostrar solo los indicadores que tengan información suficiente y una caja breve con los supuestos.

## 6. Formulario público: lenguaje de negocio y preguntas condicionales

Tres pantallas cortas con progreso y respuesta «No lo sé» cuando corresponda.

### A. Tu necesidad

- ¿Qué tarea o proceso quieres mejorar? Ejemplos: responder consultas, copiar datos, generar reportes o procesar documentos.
- ¿Qué resultado esperas conseguir?
- ¿Qué herramientas utilizas actualmente? Selección y campo libre.

### B. Volumen, plazo y presupuesto

- ¿Cuántas veces al mes se realiza la tarea y cuánto tarda cada vez? Aclarar persona/equipo.
- ¿Cuántas personas participan? Usar como contexto, no multiplicador automático.
- ¿Tienes un presupuesto aproximado? Campo o rangos configurables, con «Necesito orientación».
- ¿Para cuándo necesitas la solución? Fecha deseada y flexibilidad.
- Opcional: costo por hora del equipo, o marcar que prefiere no compartirlo.

### C. Contacto y contexto adicional

- Nombre, empresa y medio de contacto.
- Comentario adicional y confirmación de que la información puede usarse para responder a esta solicitud.
- Pedir datos fiscales únicamente al preparar el documento que los necesite.

Preguntas adicionales solo cuando aplican: número de integraciones, si existe API/acceso autorizado, cantidad de documentos/canales y necesidad de revisión humana. No pedir contraseñas, claves API ni documentos de clientes en el formulario inicial.

### Resultado público

1. Confirmación de recepción y referencia de solicitud.
2. Resumen de lo entendido y la solución orientativa, explicada sin exigir que el cliente conozca la tecnología.
3. Rango orientativo **solo cuando la solicitud encaja en una plantilla validada y sus supuestos están definidos**; el rango se deriva de horas mínimas/máximas, no del presupuesto del cliente.
4. En otros casos: «Requiere diagnóstico para definir alcance e inversión». No fabricar un rango.
5. Documento preliminar claramente rotulado si se ofrece descarga inmediata. La proforma final se genera después de revisión, salvo paquete de alcance cerrado expresamente habilitado por Melany.

La primera versión no enviará correos o WhatsApp automáticamente. Melany descargará y compartirá el PDF. El envío automático necesitará proveedor, destinatarios y reglas aprobadas antes de activarse.

## 7. Estructura del PDF

**Título preferido: «Proforma de servicios» o «Propuesta de servicios».** El tipo de documento y los datos fiscales se configuran según corresponda; no reutilizar «Factura proforma / No pagada» de la imagen sin decidir su significado en este negocio.

### Página 1: propuesta y precio

- Nombre comercial o Melany Brito, logo opcional, correo y teléfono confirmados.
- Cliente, empresa y contacto.
- Folio único, versión, fecha de emisión, moneda y fecha de vencimiento.
- Resumen de la necesidad en dos o tres líneas.
- Solución y entregables en lenguaje sencillo.
- Tabla: concepto, alcance resumido, cantidad e importe. Horas y tarifa solo si se activa esa presentación.
- Subtotal, descuento, impuestos y total de implementación; mensualidades y terceros separados.

### Página 2 cuando haga falta: valor y condiciones

- Horas recuperadas y estimación económica con supuestos y horizonte.
- Gráfico sencillo del costo acumulado y capacidad valorada cuando haya datos suficientes; una línea de beneficios no se presenta como dinero efectivamente cobrado.
- Cronograma por hitos, inicio condicionado a requisitos y validación del cliente.
- Qué está incluido, qué está excluido y cómo se presupuestan cambios.
- Vigencia, forma de pago, condiciones de soporte y aceptación.
- Siguiente paso: contacto o enlace de confirmación validado.

Un servicio breve puede caber en una página. No reducir la letra para forzar esa extensión ni crear una portada decorativa que esconda el precio. No incluir el presupuesto declarado por el cliente ni notas internas.

Defaults **propuestos, pendientes de aprobar**: vigencia 10 días y pago 50 % al inicio / 50 % contra entrega. El plazo de soporte correctivo, revisiones incluidas y mantenimiento deben definirse, no inventarse.

La primera versión no incluirá un botón de Stripe o firma digital sin una cuenta e integración configuradas. Una aceptación comercial registrada no se presentará como firma electrónica certificada.

## 8. Estados y reglas de operación

```text
Solicitud → En revisión → Borrador de cotización → Emitida
                                              → Compartida manualmente
                                              → Aceptada / Rechazada / Vencida
```

- Guardado automático de borradores con confirmación de sincronización; aviso si falla la conexión.
- Duplicar una cotización crea otro borrador, no reutiliza un folio emitido.
- Emitir crea una versión inmutable: conserva tarifas, impuestos, alcance, supuestos, texto y fecha.
- Editar después de emitir crea una revisión nueva; no cambia silenciosamente el PDF enviado.
- Folios asignados en servidor con restricción única y operación atómica. No usar contadores locales del navegador para documentos públicos.
- Descarga no equivale a envío ni a aceptación. Los estados se actualizan mediante acciones identificables.
- Los valores de catálogo nuevos no alteran cotizaciones históricas.
- Los endpoints públicos no pueden aprobar descuentos, cambiar tarifas, emitir documentos definitivos ni leer otros clientes.

## 9. Arquitectura propuesta

Aplicación web en español con el mismo tipo de stack ya usado: Next.js, TypeScript y un generador PDF. A diferencia de la calculadora local, el flujo público requiere backend, autenticación y almacenamiento persistente compartido.

```text
Formulario público ──→ endpoint validado ──→ Solicitudes en base de datos
                                                 ↓
Panel privado autenticado ──→ Catálogo + motor de precios + simulación de valor
                                                 ↓
                            Versión emitida + PDF almacenado de forma privada
                                                 ↓
                            Descarga autorizada / enlace revocable si se habilita
```

- Frontend con formularios pequeños y vista previa del documento.
- Motor de precios y ROI en funciones puras reutilizadas; servidor recalcula antes de emitir.
- Base de datos relacional para solicitudes, clientes, líneas y versiones. Proveedor por decidir antes de implementar.
- Sesión privada para Melany y comprobaciones de autorización en cada operación; no basta ocultar enlaces del panel.
- PDF generado desde una instantánea validada; generación en servidor para el flujo público y descarga consistente. Verificar compatibilidad del motor elegido con el hosting antes de cerrar su selección.
- Almacenamiento privado y respaldo; acceso al PDF mediante autorización o enlace limitado/revocable si esa función se activa.
- Validación de entradas, límites de envío y protección contra spam en el formulario. Los totales enviados desde el navegador no son confiables.
- Datos de clientes fuera del repositorio Git. Credenciales solo en variables de servidor, nunca dentro del PDF o bundle público.
- Vercel como destino previsto, sujeto a comprobar necesidades y plan de hosting; no asumir que todas las funciones son gratuitas. Su protección de despliegues no reemplaza la autorización de datos/rutas dentro de una aplicación que también tiene un formulario público. Referencia: [documentación de Vercel](https://vercel.com/docs/deployment-protection).

### Estructura orientativa del código

```text
src/
  app/
    (public)/solicitar/       # formulario del cliente
    (private)/cotizaciones/  # panel autenticado
    (private)/solicitudes/
    (private)/servicios/
    (private)/configuracion/
    api/                     # recepción, guardado y emisión autorizada
  components/
    quote-editor/
    client-intake/
    impact-summary/
    quote-preview/
  domain/
    pricing.ts               # precios, descuentos e impuestos configurados
    impact.ts                # horas, escenarios, ROI y recuperación
    catalog.ts               # módulos y reglas de alcance
    validation.ts
  server/
    auth/ db/ quotes/ pdf/ storage/
tests/
  pricing/ impact/ workflows/
docs/
  definiciones/ decisiones/ validacion/
```

Los nombres entre paréntesis agrupan rutas; no son una barrera de seguridad. El control de acceso debe implementarse en servidor.

## 10. Modelo de datos mínimo

| Entidad | Información principal |
|---|---|
| Perfil emisor | Nombre, marca, logo, contacto, tarifa, moneda y condiciones por defecto |
| Servicio | Código, modalidad, horas sugeridas por fase, precio fijo si aplica y plantilla de alcance |
| Cliente | Empresa, contacto y datos fiscales opcionales |
| Solicitud | Respuestas originales, presupuesto orientativo, estado y fecha |
| Cotización | Cliente, propietario, estado, moneda, vigencia, calendario y condiciones |
| Línea de cotización | Servicio, cantidad, minutos o precio fijo, tarifa histórica, descuento, impuesto, periodicidad y pagador |
| Escenario de impacto | Volumen, tiempos, cobertura, supervisión, costo del cliente, costos considerados y horizonte |
| Versión emitida | Folio, revisión, instantánea completa, fecha, hash y ubicación privada del PDF |
| Evento | Creación, edición, emisión y cambios de estado, con actor y fecha |

Guardar los datos de entrada y las fórmulas/versiones usadas, no únicamente los totales. «Desconocido» y cero deben ser valores diferentes.

## 11. Alcance de la primera versión y fases de ejecución

### Fase 0 — Reglas y marca

Confirmar datos del emisor, presentación de precios, impuestos, condiciones y si el flujo público emite una estimación o un paquete cerrado. Aprobar un catálogo inicial corto y tres casos comerciales realistas.

**Salida:** especificación de precios, textos y PDF sin ambigüedades.

### Fase 1 — Cotizador interno funcional

Editor de cuatro pasos, módulos, USD 15/h, adicionales, recurrentes, costos de terceros y escenarios de tiempo/ROI. Guardado, duplicado y borrador.

**Salida:** cotización reproducible a partir de los tres casos aprobados, con sus totales verificados.

### Fase 2 — Proforma profesional

Vista previa, emisión de versiones, folios, PDF con tabla, alcance, cronograma, condiciones y módulo opcional de valor. Revisar en móvil y PDF renderizado.

**Salida:** documentos legibles y completos, sin cortes de tabla ni datos internos expuestos.

### Fase 3 — Formulario del cliente y panel privado

Preguntas condicionales, recepción en backend, autenticación, solicitudes y conversión a borrador. Estimaciones públicas solo para plantillas calibradas. Probar permisos, envíos repetidos y pérdida de conexión.

**Salida:** un cliente puede solicitar una propuesta sin acceder a información de otros.

### Fase 4 — Piloto y publicación

Probar con escenarios de Melany y un piloto consentido; medir esfuerzo, corregir etiquetas y cerrar condiciones. Publicar en Vercel y guardar el código en un repositorio GitHub independiente cuando se autorice implementar/publicar este nuevo proyecto.

**Salida:** URL operativa, respaldo y guía breve de uso.

### Evolución posterior

Envío automático aprobado por correo, recordatorios, CRM, aceptación mediante enlace, pagos/firma integrados, historial de cambios de alcance y calibración de horas estimadas frente a reales. No son requisitos para empezar a cotizar.

## 12. Criterios de aceptación y casos de prueba

- 20 h × USD 15 = USD 300; módulos fijos no suman además sus horas internas.
- Pruebas con fracciones de hora, descuentos, cero, datos ausentes, importes grandes y redondeos.
- Distinción visual y numérica entre implementación, mensualidad y terceros directos.
- Ningún ROI con costo total cero ni valor económico si falta el costo/hora del cliente.
- Los 40 h / USD 320 / USD 780 / 392,31 % del ejemplo son reproducibles.
- Supervisión elevada o escaso volumen pueden dar ahorro negativo y no deben ocultarse.
- Presupuesto declarado no modifica el precio de una propuesta idéntica.
- Una misma combinación de alcance y reglas produce el mismo precio en el flujo interno y público permitido.
- Cambiar la tarifa global no altera PDFs ya emitidos.
- Solicitudes duplicadas o doble clic al emitir no duplican folios ni generan documentos inconsistentes.
- El cliente no puede ver tarifas internas, otros clientes, presupuestos privados o PDFs ajenos.
- El PDF no pierde filas, totales, notas o condiciones cuando el texto crece.
- Meta de tiempo: tres cotizaciones simples, con datos ya disponibles, en menos de dos minutos cada una durante el piloto. Separar tiempo de diagnóstico de tiempo de emisión.

## 13. Decisiones todavía pendientes

- Nombre comercial, logo, correo, teléfono y datos del emisor que deben figurar.
- Si el cliente verá horas × USD 15 o únicamente el precio del servicio.
- Estimación preliminar revisada o emisión automática limitada a paquetes cerrados.
- Condiciones: anticipo, vigencia, revisiones, soporte correctivo y mantenimiento.
- Tratamiento de impuestos y jurisdicción de emisión; no copiarlo de la referencia visual.
- Catálogo real, horas mínimas/máximas y costos de terceros; los ejemplos no están aprobados para ventas.
- Proveedor de base de datos, autenticación, almacenamiento y límites de gasto.

Hasta resolverlas, estos puntos son propuestas, no decisiones aprobadas. El proyecto de métricas permanece independiente.
