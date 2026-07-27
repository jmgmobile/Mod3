import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
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

// Próximo lunes a partir de una fecha ancla fija, para no depender del día en que corren los tests.
function proximoLunesISO() {
  const base = new Date("2026-07-27T00:00:00Z"); // lunes
  const diasHastaLunes = (8 - base.getUTCDay()) % 7 || 7;
  const lunes = new Date(base);
  lunes.setUTCDate(base.getUTCDate() + diasHastaLunes);
  return lunes.toISOString().slice(0, 10);
}

function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function crearNegocioConServicio(agent, { email = "negocio@test.com", duracion = 30 } = {}) {
  await agent.post("/api/auth/registro").send({ email, password: "password123" });
  const perfil = await agent
    .put("/api/perfil")
    .send({ nombre_negocio: "Negocio Test", rubro: "rubro", foto_url: null });
  const servicio = await agent
    .post("/api/servicios")
    .send({ nombre: "Servicio Test", duracion_minutos: duracion });
  return { prestadorId: perfil.body.id, servicioId: servicio.body.id };
}

test("AC-01: los slots respetan el rango de disponibilidad configurado y nada fuera de él", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);

  await agent.put("/api/disponibilidad").send({
    reglas: [
      { dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" },
      { dia_semana: 2, hora_inicio: "09:00", hora_fin: "18:00" },
      { dia_semana: 3, hora_inicio: "09:00", hora_fin: "18:00" },
      { dia_semana: 4, hora_inicio: "09:00", hora_fin: "18:00" },
      { dia_semana: 5, hora_inicio: "09:00", hora_fin: "18:00" },
    ],
  });

  const lunes = proximoLunesISO();
  const martes = sumarDias(lunes, 1);
  const domingoSiguiente = sumarDias(lunes, 6);

  const res = await request(app).get(
    `/api/negocios/${prestadorId}/disponibilidad?servicio_id=${servicioId}&fecha=${martes}`
  );
  assert.equal(res.status, 200);
  assert.ok(res.body.slots.includes("09:00"));
  assert.ok(res.body.slots.every((s) => s >= "09:00" && s < "18:00"));

  const domingo = await request(app).get(
    `/api/negocios/${prestadorId}/disponibilidad?servicio_id=${servicioId}&fecha=${domingoSiguiente}`
  );
  assert.deepEqual(domingo.body.slots, []);
});

test("AC-02 y AC-24: bloquear un día completo vs. un horario específico", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  await agent.post("/api/bloqueos").send({ fecha: lunes });
  const diaCompleto = await request(app).get(
    `/api/negocios/${prestadorId}/disponibilidad?servicio_id=${servicioId}&fecha=${lunes}`
  );
  assert.deepEqual(diaCompleto.body.slots, []);

  const otroLunes = sumarDias(lunes, 7);
  await agent.post("/api/bloqueos").send({ fecha: otroLunes, hora_inicio: "14:00", hora_fin: "16:00" });
  const parcial = await request(app).get(
    `/api/negocios/${prestadorId}/disponibilidad?servicio_id=${servicioId}&fecha=${otroLunes}`
  );
  assert.ok(!parcial.body.slots.includes("14:00"));
  assert.ok(!parcial.body.slots.includes("15:30"));
  assert.ok(parcial.body.slots.includes("09:00"));
  assert.ok(parcial.body.slots.includes("16:00"));
});

test("AC-03 y AC-23: un turno reservado deja de estar disponible de inmediato para otro cliente", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  await request(app).post(`/api/negocios/${prestadorId}/turnos`).send({
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "14:00",
    cliente_nombre: "Cliente A",
    cliente_telefono: "111",
  });

  const disponibilidad = await request(app).get(
    `/api/negocios/${prestadorId}/disponibilidad?servicio_id=${servicioId}&fecha=${lunes}`
  );
  assert.ok(!disponibilidad.body.slots.includes("14:00"));
});

test("AC-04: la confirmación llega en la misma respuesta con fecha, hora y nombre del servicio", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  const res = await request(app).post(`/api/negocios/${prestadorId}/turnos`).send({
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "09:00",
    cliente_nombre: "Cliente A",
    cliente_telefono: "111",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.fecha, lunes);
  assert.equal(res.body.hora_inicio, "09:00:00");
  assert.equal(res.body.servicio_nombre, "Servicio Test");
});

test("AC-13/AC-15: reservar requiere un servicio real del negocio y un horario válido", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  const servicioInexistente = await request(app)
    .get(`/api/negocios/${prestadorId}/disponibilidad?servicio_id=00000000-0000-0000-0000-000000000000&fecha=${lunes}`);
  assert.equal(servicioInexistente.status, 404);

  const horarioInvalido = await request(app).post(`/api/negocios/${prestadorId}/turnos`).send({
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "23:45",
    cliente_nombre: "Cliente A",
    cliente_telefono: "111",
  });
  assert.equal(horarioInvalido.status, 409);
});

test("AC-16: reservar sin nombre o teléfono queda bloqueado", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  const sinTelefono = await request(app).post(`/api/negocios/${prestadorId}/turnos`).send({
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "09:00",
    cliente_nombre: "Cliente A",
  });
  assert.equal(sinTelefono.status, 400);

  const sinNombre = await request(app).post(`/api/negocios/${prestadorId}/turnos`).send({
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "09:00",
    cliente_telefono: "111",
  });
  assert.equal(sinNombre.status, 400);
});

test("AC-07/AC-09 (parte pública): el perfil público muestra los mismos valores guardados por el prestador", async () => {
  const agent = request.agent(app);
  await crearNegocioConServicio(agent, { email: "publico@test.com" });
  const perfil = await agent.get("/api/perfil");

  const res = await request(app).get(`/api/negocios/${perfil.body.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.nombre_negocio, perfil.body.nombre_negocio);
  assert.equal(res.body.rubro, perfil.body.rubro);
  assert.equal(res.body.servicios.length, 1);
  assert.equal(res.body.email, undefined);
});

test("doble-booking concurrente: solo una de dos reservas simultáneas para el mismo horario se confirma", async () => {
  const agent = request.agent(app);
  const { prestadorId, servicioId } = await crearNegocioConServicio(agent);
  await agent.put("/api/disponibilidad").send({
    reglas: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "18:00" }],
  });
  const lunes = proximoLunesISO();

  const payload = {
    servicio_id: servicioId,
    fecha: lunes,
    hora_inicio: "09:00",
    cliente_nombre: "Cliente",
    cliente_telefono: "111",
  };

  const [a, b] = await Promise.all([
    request(app).post(`/api/negocios/${prestadorId}/turnos`).send(payload),
    request(app).post(`/api/negocios/${prestadorId}/turnos`).send(payload),
  ]);

  const exitosas = [a, b].filter((r) => r.status === 201);
  const rechazadas = [a, b].filter((r) => r.status === 409);
  assert.equal(exitosas.length, 1);
  assert.equal(rechazadas.length, 1);
});
