# AGENTS.md

## Propósito
TurnoApp es una web para que negocios de servicios (peluquerías, yoga, entrenadores personales) gestionen turnos y disponibilidad sin coordinar por WhatsApp.
Los clientes reservan online viendo disponibilidad real, sin registrarse ni esperar respuesta del prestador.

## Stack
- Frontend: React 18
- Backend: Node.js 20 (LTS) + Express
- Base de datos: PostgreSQL 16
- Gestor de paquetes: npm

## Cómo correr
```
npm install
npm run dev
npm test
```

## Qué NO hacer
- No implementar pagos online (Fuera de Alcance del PRD).
- No soportar múltiples prestadores o empleados por negocio: cada negocio tiene un único prestador.
- No enviar recordatorios automáticos por WhatsApp o SMS.
- No exponer datos ni calendario de un prestador a otro prestador, ni siquiera por manipulación de URL (AC-20).
- No exponer los datos de una reserva a un cliente distinto del que la realizó, ni siquiera por manipulación del identificador en la URL (AC-21).
