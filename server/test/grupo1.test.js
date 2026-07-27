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

async function registrarPrestador(agent, email = "prestador@test.com") {
  const res = await agent
    .post("/api/auth/registro")
    .send({ email, password: "password123" });
  assert.equal(res.status, 201);
  return res.body;
}

test("registro crea la cuenta y rechaza email duplicado", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent, "duplicado@test.com");

  const res = await agent
    .post("/api/auth/registro")
    .send({ email: "duplicado@test.com", password: "otraPassword" });

  assert.equal(res.status, 409);
});

test("login rechaza credenciales incorrectas y acepta las correctas", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent, "login@test.com");
  await agent.post("/api/auth/logout");

  const malas = await agent
    .post("/api/auth/login")
    .send({ email: "login@test.com", password: "incorrecta" });
  assert.equal(malas.status, 401);

  const buenas = await agent
    .post("/api/auth/login")
    .send({ email: "login@test.com", password: "password123" });
  assert.equal(buenas.status, 200);
});

test("PUT /api/perfil requiere sesión", async () => {
  const res = await request(app)
    .put("/api/perfil")
    .send({ nombre_negocio: "X", rubro: "Y" });
  assert.equal(res.status, 401);
});

test("AC-09: el perfil guardado persiste con los valores ingresados", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent);

  const put = await agent.put("/api/perfil").send({
    nombre_negocio: "Peluquería Ana",
    rubro: "peluqueria",
    foto_url: "https://ejemplo.com/foto.jpg",
  });
  assert.equal(put.status, 200);

  const get = await agent.get("/api/perfil");
  assert.equal(get.body.nombre_negocio, "Peluquería Ana");
  assert.equal(get.body.rubro, "peluqueria");
  assert.equal(get.body.foto_url, "https://ejemplo.com/foto.jpg");
});

test("AC-10: agregar un servicio lo deja disponible en la lista con los datos ingresados", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent);

  const crear = await agent.post("/api/servicios").send({
    nombre: "Corte",
    duracion_minutos: 30,
    precio: 5000,
  });
  assert.equal(crear.status, 201);

  const lista = await agent.get("/api/servicios");
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0].nombre, "Corte");
  assert.equal(lista.body[0].duracion_minutos, 30);
});

test("AC-11: editar la duración de un servicio existente refleja el valor actualizado", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent);
  const { body: servicio } = await agent
    .post("/api/servicios")
    .send({ nombre: "Corte", duracion_minutos: 30 });

  const editar = await agent
    .put(`/api/servicios/${servicio.id}`)
    .send({ nombre: "Corte", duracion_minutos: 45 });
  assert.equal(editar.status, 200);

  const lista = await agent.get("/api/servicios");
  assert.equal(lista.body[0].duracion_minutos, 45);
});

test("AC-12: eliminar un servicio lo saca de la lista y ya no se puede seleccionar", async () => {
  const agent = request.agent(app);
  await registrarPrestador(agent);
  const { body: servicio } = await agent
    .post("/api/servicios")
    .send({ nombre: "Corte", duracion_minutos: 30 });

  const eliminar = await agent.delete(`/api/servicios/${servicio.id}`);
  assert.equal(eliminar.status, 204);

  const lista = await agent.get("/api/servicios");
  assert.equal(lista.body.length, 0);
});

test("aislamiento: un prestador no puede editar ni eliminar servicios de otro", async () => {
  const agentA = request.agent(app);
  await registrarPrestador(agentA, "prestadorA@test.com");
  const { body: servicioDeA } = await agentA
    .post("/api/servicios")
    .send({ nombre: "Corte", duracion_minutos: 30 });

  const agentB = request.agent(app);
  await registrarPrestador(agentB, "prestadorB@test.com");

  const editar = await agentB
    .put(`/api/servicios/${servicioDeA.id}`)
    .send({ nombre: "Hackeado", duracion_minutos: 1 });
  assert.equal(editar.status, 404);

  const eliminar = await agentB.delete(`/api/servicios/${servicioDeA.id}`);
  assert.equal(eliminar.status, 404);

  const listaDeA = await agentA.get("/api/servicios");
  assert.equal(listaDeA.body[0].nombre, "Corte");
});
