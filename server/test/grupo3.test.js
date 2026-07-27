import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { pool } from "../src/db.js";
import { buildApp, limpiarDb, cerrarDb } from "../support/helpers.js";

const app = buildApp();

before(async () => {
  await limpiarDb();
});

beforeEach(async () => {
  await limpiarDb();
});

after(async () => {
  await cerrarDb();
});

async function crearNegocioConServicio(agent, { email = "negocio@test.com" } = {}) {
  await agent.post("/api/auth/registro").send({ email, password: "password123" });
  const perfil = await agent
    .put("/api/perfil")
    .send({ nombre_negocio: "Negocio Test", rubro: "rubro", foto_url: null });
  const servicio = await agent
    .post("/api/servicios")
    .send({ nombre: "Servicio Test", duracion_minutos: 30 });
  return { prestadorId: perfil.body.id, servicioId: servicio.body.id };
}

// Usa componentes en hora local: la app trata fecha/hora_inicio como
// hora de pared local (sin conversión de zona horaria), igual que acá.
function partesFechaHora(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const fecha = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const hora_inicio = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return { fecha, hora_inicio };
}

async function insertarTurno({ prestadorId, servicioId, minutosDesdeAhora, clienteNombre = "Cliente" }) {
  const inicio = new Date(Date.now() + minutosDesdeAhora * 60 * 1000);
  const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
  const { fecha, hora_inicio } = partesFechaHora(inicio);
  const { hora_inicio: hora_fin } = partesFechaHora(fin);

  const { rows } = await pool.query(
    `INSERT INTO turnos (prestador_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, hora_fin)
     VALUES ($1, $2, $3, '111', $4, $5, $6)
     RETURNING id, fecha, hora_inicio`,
    [prestadorId, servicioId, clienteNombre, fecha, hora_inicio, hora_fin]
  );
  return rows[0];
}

test("AC-05: cancelar con menos de 2 horas de anticipación queda rechazado", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 90 });

  const res = await request(app).post(`/api/turnos/${turno.id}/cancelar`).send({});
  assert.equal(res.status, 409);

  const { rows } = await pool.query("SELECT estado FROM turnos WHERE id = $1", [turno.id]);
  assert.equal(rows[0].estado, "confirmado");
});

test("AC-25: cancelar con 2 horas o más de anticipación se confirma", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 180 });

  const res = await request(app).post(`/api/turnos/${turno.id}/cancelar`).send({});
  assert.equal(res.status, 200);
  assert.equal(res.body.estado, "cancelado");
});

test("AC-17: la vista diaria muestra los turnos del día ordenados con cliente y servicio", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const t1 = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 240, clienteNombre: "Zoe" });
  const t2 = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 120, clienteNombre: "Ana" });

  const res = await agent.get(`/api/calendario?vista=dia&fecha=${t1.fecha}`);
  assert.equal(res.status, 200);

  if (t1.fecha === t2.fecha) {
    assert.equal(res.body.turnos.length, 2);
    assert.ok(res.body.turnos[0].hora_inicio <= res.body.turnos[1].hora_inicio);
    assert.equal(res.body.turnos[0].servicio_nombre, "Servicio Test");
  } else {
    assert.equal(res.body.turnos.length, 1);
  }
});

test("AC-22: la vista semanal agrupa los turnos por día", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 60 * 5, clienteNombre: "Lu" });

  const res = await agent.get(`/api/calendario?vista=semana&fecha=${turno.fecha}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.dias.length, 7);

  const diaConTurno = res.body.dias.find((d) => d.fecha === turno.fecha);
  assert.ok(diaConTurno);
  assert.equal(diaConTurno.turnos.length, 1);
  assert.equal(diaConTurno.turnos[0].cliente_nombre, "Lu");
});

test("AC-18: al cancelar el prestador, el turno desaparece del calendario y el horario queda libre", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 120 });

  const cancelar = await agent.post(`/api/mis-turnos/${turno.id}/cancelar`).send({});
  assert.equal(cancelar.status, 200);
  assert.equal(cancelar.body.estado, "cancelado");

  const calendario = await agent.get(`/api/calendario?vista=dia&fecha=${turno.fecha}`);
  assert.equal(calendario.body.turnos.length, 0);
});

test("AC-19: al completar, el turno cambia de estado y deja de estar pendiente", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 120 });

  const completar = await agent.post(`/api/mis-turnos/${turno.id}/completar`).send({});
  assert.equal(completar.status, 200);
  assert.equal(completar.body.estado, "completado");

  const calendario = await agent.get(`/api/calendario?vista=dia&fecha=${turno.fecha}`);
  const enCalendario = calendario.body.turnos.find((t) => t.id === turno.id);
  assert.equal(enCalendario.estado, "completado");
});

test("AC-20: un prestador no puede cancelar ni completar turnos de otro", async () => {
  const agentA = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agentA, { email: "a@test.com" });
  const turno = await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 120 });

  const agentB = request.agent(app);
  await crearNegocioConServicio(agentB, { email: "b@test.com" });

  const cancelar = await agentB.post(`/api/mis-turnos/${turno.id}/cancelar`).send({});
  assert.equal(cancelar.status, 404);

  const completar = await agentB.post(`/api/mis-turnos/${turno.id}/completar`).send({});
  assert.equal(completar.status, 404);

  const calendarioDeA = await agentA.get(`/api/calendario?vista=dia&fecha=${turno.fecha}`);
  assert.equal(calendarioDeA.body.turnos[0].estado, "confirmado");
});

test("AC-21: un cliente no puede ver los datos de la reserva de otro adivinando el id", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await insertarTurno({ prestadorId, servicioId, minutosDesdeAhora: 120 });

  const idInventado = "00000000-0000-0000-0000-000000000000";
  const res = await request(app).get(`/api/turnos/${idInventado}`);
  assert.equal(res.status, 404);
});

test("mis-turnos requiere sesión", async () => {
  const res = await request(app).post("/api/mis-turnos/cualquier-id/cancelar").send({});
  assert.equal(res.status, 401);
});
