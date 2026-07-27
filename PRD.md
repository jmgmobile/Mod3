# PRD-001: TurnoApp — web para gestionar reservas en negocios de servicios

## Contexto y Problema

Los pequeños negocios (peluquerías, estudios de yoga, entrenadores personales) coordinan turnos por WhatsApp o teléfono. Eso genera falta de visibilidad del calendario, cancelaciones sin aviso que dejan huecos y tiempo del prestador dedicado a responder mensajes en lugar de trabajar.

**Persona 1 — Prestador de servicio**
*"Quiero saber qué tengo para mañana sin revisar tres conversaciones de WhatsApp."*
Peluquero, instructora de yoga, masajista o entrenador personal. 30–50 años, trabaja solo o con una persona más. Necesita ver su agenda clara y no perder tiempo coordinando.

**Persona 2 — Cliente final**
*"Quiero sacar turno sin tener que esperar que me respondan."*
Usuario de los servicios de la Persona 1. Prefiere autogestión sobre llamar o esperar respuesta. Necesita ver disponibilidad real y confirmar en el momento.

## Objetivos

- Que el prestador reemplace WhatsApp por el sitio web para gestionar turnos: ≥ 80% de las reservas nuevas a través de el sitio web al mes 2.
- Que el cliente pueda reservar sin intervención del prestador: flujo completo sin ningún intercambio de mensajes.
- Reducir cancelaciones sin aviso: tasa de cancelación con aviso previo ≥ 70% al mes 3.

## Requerimientos Funcionales

- RF-01: El sistema debe permitir al prestador crear un perfil con nombre del negocio, rubro y foto.
- RF-02: El sistema debe permitir al prestador agregar servicios con nombre, duración en minutos y precio opcional.
- RF-03: El sistema debe permitir al prestador editar servicios existentes.
- RF-04: El sistema debe permitir al prestador eliminar servicios existentes.
- RF-05: El sistema debe permitir al prestador configurar su disponibilidad semanal indicando días y rangos horarios.
- RF-06: El sistema debe permitir al prestador bloquear fechas u horarios específicos como no disponibles.
- RF-07: El sistema debe mostrar al cliente los horarios disponibles del prestador.
- RF-08: El sistema debe permitir al cliente seleccionar un servicio ofrecido por el negocio.
- RF-09: El sistema debe permitir al cliente seleccionar una fecha disponible para el servicio elegido.
- RF-10: El sistema debe permitir al cliente seleccionar un horario disponible dentro de la fecha elegida.
- RF-11: El sistema debe solicitar al cliente nombre y número de teléfono para completar la reserva.
- RF-12: El sistema debe enviar una confirmación al cliente una vez registrada la reserva.
- RF-13: El sistema debe permitir al cliente cancelar un turno hasta 2 horas antes del horario reservado.
- RF-14: El sistema debe mostrar al prestador una vista de calendario con todos los turnos del día y la semana.
- RF-15: El sistema debe notificar al prestador cuando se registre una nueva reserva.
- RF-16: El sistema debe permitir al prestador cancelar un turno existente.
- RF-17: El sistema debe permitir al prestador marcar un turno como completado.
- RF-18: El sistema debe permitir a cualquier usuario acceder al perfil público del negocio y ver los servicios disponibles sin necesidad de registrarse.

## Requerimientos No Funcionales

- RNF-01: La pantalla de horarios disponibles debe cargar en < 2 segundos.
- RNF-02: El cliente debe poder completar una reserva en ≤ 4 pasos desde el link del negocio.
- RNF-03: El sistema no debe exponer datos ni calendario de un prestador a otro prestador, ni siquiera por manipulación de URL.
- RNF-04: El sistema no debe exponer los datos de una reserva a un cliente distinto del que la realizó, ni siquiera por manipulación del identificador en la URL.
- RNF-05: La disponibilidad de horarios mostrada al cliente debe reflejar una reserva confirmada por otro cliente en menos de 30 segundos.

## Criterios de Aceptación

- AC-01 (RF-05): Dado que el prestador configuró disponibilidad de lunes a viernes de 9:00 a 18:00, cuando un cliente accede al link el martes a las 10:00, entonces ve slots disponibles en ese rango y ninguno fuera de él.
- AC-02 (RF-06): Dado que el prestador bloqueó el jueves 10/07 completo, cuando un cliente intenta reservar ese día, entonces no aparece ningún horario disponible para esa fecha.
- AC-03 (RF-07): Dado que un turno de las 14:00 ya está reservado, cuando otro cliente accede al link, entonces ese horario no aparece como disponible.
- AC-04 (RF-12): Dado que un cliente completó una reserva, cuando el sistema la registra, entonces el cliente recibe una confirmación con fecha, hora y nombre del servicio en menos de 30 segundos.
- AC-05 (RF-13): Dado que faltan menos de 2 horas para el turno, cuando el cliente intenta cancelarlo desde el sitio web, entonces el sistema rechaza la cancelación y muestra un mensaje indicando que el plazo venció.
- AC-06 (RF-15): Dado que un cliente reservó un turno, cuando la reserva queda confirmada, entonces el prestador recibe una notificación push en menos de 60 segundos.
- AC-07 (RF-18): Dado que el prestador comparte su link público, cuando un usuario anónimo lo abre, entonces ve el perfil del negocio y los servicios disponibles sin necesidad de registrarse.
- AC-08 (RNF-01): Dado que el cliente accede al link con conexión 4G, cuando solicita ver disponibilidad, entonces la pantalla carga completamente en menos de 2 segundos en el percentil 95 de las mediciones.
- AC-09 (RF-01): Dado que el prestador ingresa nombre del negocio, rubro y foto y guarda el perfil, cuando un cliente accede al link público, entonces ve el nombre, el rubro y la foto con los mismos valores guardados por el prestador.
- AC-10 (RF-02): Dado que el prestador agrega un servicio con nombre, duración y precio opcional, cuando guarda el servicio, entonces aparece en la lista de servicios del negocio con los datos ingresados.
- AC-11 (RF-03): Dado que el prestador modifica la duración de un servicio existente, cuando guarda el cambio, entonces la lista de servicios refleja el valor actualizado.
- AC-12 (RF-04): Dado que el prestador elimina un servicio existente, cuando confirma la eliminación, entonces el servicio no aparece en la lista de servicios ni está disponible para que un cliente lo seleccione.
- AC-13 (RF-08): Dado que el cliente accede al link del negocio, cuando selecciona uno de los servicios listados, entonces el sistema lo marca como el servicio elegido y avanza a la selección de fecha.
- AC-14 (RF-09): Dado que el cliente ya seleccionó un servicio, cuando elige una fecha con disponibilidad, entonces el sistema muestra los horarios libres de ese día para el servicio elegido.
- AC-15 (RF-10): Dado que el cliente ya seleccionó un servicio y una fecha, cuando elige un horario disponible, entonces el sistema registra esa combinación de servicio, fecha y horario y avanza al formulario de datos del cliente.
- AC-16 (RF-11): Dado que el cliente intenta confirmar una reserva sin ingresar nombre o número de teléfono, cuando presiona confirmar, entonces el sistema bloquea el avance y muestra un mensaje indicando los campos requeridos.
- AC-17 (RF-14): Dado que el prestador tiene turnos registrados para el día de hoy, cuando abre la vista de calendario diaria, entonces ve todos los turnos del día ordenados cronológicamente con nombre del cliente y servicio.
- AC-18 (RF-16): Dado que el prestador cancela un turno existente, cuando confirma la cancelación, entonces el turno desaparece de su calendario y el horario queda disponible para nuevas reservas.
- AC-19 (RF-17): Dado que el prestador marca un turno como completado, cuando confirma la acción, entonces el turno cambia de estado a "completado" y deja de aparecer como pendiente en la vista del día.
- AC-20 (RNF-03): Dado que el prestador A está autenticado en su cuenta, cuando intenta acceder al calendario o datos del prestador B mediante manipulación de URL, entonces el sistema deniega el acceso y devuelve un error de autorización.
- AC-21 (RNF-04): Dado que un cliente completó una reserva, cuando otro cliente intenta acceder a los datos de esa reserva manipulando el identificador en la URL, entonces el sistema deniega el acceso y no muestra los datos de la reserva ajena.
- AC-22 (RF-14): Dado que el prestador tiene turnos registrados para la semana en curso, cuando abre la vista de calendario semanal, entonces ve todos los turnos de la semana agrupados por día con nombre del cliente y servicio.
- AC-23 (RNF-05): Dado que un cliente A reserva un horario, cuando un cliente B consulta la disponibilidad de ese mismo horario dentro de los 30 segundos posteriores a la reserva de A, entonces el horario ya no aparece como disponible para el cliente B.
- AC-24 (RF-06): Dado que el prestador bloqueó únicamente el horario de 14:00 a 16:00 del jueves 10/07 dejando el resto del día disponible, cuando un cliente intenta reservar un horario dentro de ese rango, entonces no aparece disponible, y los horarios fuera del rango bloqueado sí aparecen disponibles.
- AC-25 (RF-13): Dado que faltan 2 horas o más para el turno, cuando el cliente cancela el turno desde el sitio web, entonces el sistema confirma la cancelación y el horario queda disponible para nuevas reservas.
- AC-26 (RNF-02): Dado que el cliente accede al link del negocio, cuando completa el flujo de reserva (servicio, fecha, horario y datos de contacto) hasta confirmar, entonces lo completa en 4 pasos o menos desde el acceso al link.

## Fuera de Alcance

- Pagos online.
- Múltiples prestadores o empleados por negocio.
- Recordatorios automáticos por WhatsApp o SMS.
- Reportes o estadísticas.
- Integración con calendarios externos.
- Desarrollo de aplicación nativa

## Riesgos y Dependencias

- Riesgo: los prestadores no adoptan el sitio web por inercia al WhatsApp → mitigación: onboarding en < 5 minutos y link para compartir.
- Riesgo: competidores con más recursos atacan el mismo segmento → mitigación: foco en simplicidad extrema y soporte.
- Dependencias: ninguna dependencia externa identificada para este alcance.
