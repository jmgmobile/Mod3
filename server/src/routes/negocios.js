import { Router } from "express";
import { query, pool } from "../db.js";
import { calcularSlotsDisponibles } from "../lib/disponibilidad.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ error: "negocio no encontrado" });
    }

    const { rows } = await query(
      `SELECT id, nombre_negocio, rubro, foto_url
       FROM prestadores
       WHERE id = $1 AND nombre_negocio IS NOT NULL`,
      [req.params.id]
    );
    const negocio = rows[0];
    if (!negocio) return res.status(404).json({ error: "negocio no encontrado" });

    const servicios = await query(
      `SELECT id, nombre, duracion_minutos, precio
       FROM servicios
       WHERE prestador_id = $1
       ORDER BY created_at`,
      [req.params.id]
    );

    res.json({ ...negocio, servicios: servicios.rows });
  } catch (err) {
    next(err);
  }
});

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

async function obtenerServicio(prestadorId, servicioId) {
  const { rows } = await query(
    "SELECT id, nombre, duracion_minutos FROM servicios WHERE id = $1 AND prestador_id = $2",
    [servicioId, prestadorId]
  );
  return rows[0] || null;
}

async function calcularSlotsParaFecha(prestadorId, fecha, duracionMinutos) {
  const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();

  const [ventanas, bloqueos, turnosOcupados] = await Promise.all([
    query(
      "SELECT hora_inicio, hora_fin FROM disponibilidad_semanal WHERE prestador_id = $1 AND dia_semana = $2",
      [prestadorId, diaSemana]
    ),
    query("SELECT hora_inicio, hora_fin FROM bloqueos WHERE prestador_id = $1 AND fecha = $2", [
      prestadorId,
      fecha,
    ]),
    query(
      "SELECT hora_inicio, hora_fin FROM turnos WHERE prestador_id = $1 AND fecha = $2 AND estado <> 'cancelado'",
      [prestadorId, fecha]
    ),
  ]);

  return calcularSlotsDisponibles({
    ventanas: ventanas.rows,
    bloqueos: bloqueos.rows,
    turnosOcupados: turnosOcupados.rows,
    duracionMinutos,
  });
}

router.get("/:id/disponibilidad", async (req, res, next) => {
  try {
    const { servicio_id, fecha } = req.query;
    if (!servicio_id || !fecha || !FECHA_RE.test(fecha)) {
      return res.status(400).json({ error: "servicio_id y fecha (YYYY-MM-DD) son requeridos" });
    }

    const servicio = await obtenerServicio(req.params.id, servicio_id);
    if (!servicio) return res.status(404).json({ error: "servicio no encontrado" });

    const slots = await calcularSlotsParaFecha(req.params.id, fecha, servicio.duracion_minutos);
    res.json({ fecha, servicio_id, slots });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/turnos", async (req, res, next) => {
  try {
    const { servicio_id, fecha, hora_inicio, cliente_nombre, cliente_telefono } = req.body || {};

    if (!servicio_id || !fecha || !hora_inicio || !cliente_nombre || !cliente_telefono) {
      return res.status(400).json({
        error: "servicio_id, fecha, hora_inicio, cliente_nombre y cliente_telefono son requeridos",
      });
    }
    if (!FECHA_RE.test(fecha)) {
      return res.status(400).json({ error: "fecha inválida" });
    }

    const servicio = await obtenerServicio(req.params.id, servicio_id);
    if (!servicio) return res.status(404).json({ error: "servicio no encontrado" });

    const slotsDisponibles = await calcularSlotsParaFecha(req.params.id, fecha, servicio.duracion_minutos);
    if (!slotsDisponibles.includes(hora_inicio)) {
      return res.status(409).json({ error: "ese horario ya no está disponible" });
    }

    const [h, m] = hora_inicio.split(":").map(Number);
    const finMinutos = h * 60 + m + servicio.duracion_minutos;
    const horaFin = `${String(Math.floor(finMinutos / 60)).padStart(2, "0")}:${String(
      finMinutos % 60
    ).padStart(2, "0")}`;

    let turno;
    try {
      const { rows } = await pool.query(
        `INSERT INTO turnos (prestador_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, fecha, hora_inicio, hora_fin, estado`,
        [req.params.id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, horaFin]
      );
      turno = rows[0];
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "ese horario ya no está disponible" });
      }
      throw err;
    }

    res.status(201).json({ ...turno, servicio_nombre: servicio.nombre });
  } catch (err) {
    next(err);
  }
});

export default router;
