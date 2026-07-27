import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, nombre, duracion_minutos, precio
       FROM servicios
       WHERE prestador_id = $1
       ORDER BY created_at`,
      [req.prestadorId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { nombre, duracion_minutos, precio } = req.body || {};
    if (!nombre || !duracion_minutos) {
      return res.status(400).json({ error: "nombre y duracion_minutos son requeridos" });
    }

    const { rows } = await query(
      `INSERT INTO servicios (prestador_id, nombre, duracion_minutos, precio)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, duracion_minutos, precio`,
      [req.prestadorId, nombre, duracion_minutos, precio ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { nombre, duracion_minutos, precio } = req.body || {};
    if (!nombre || !duracion_minutos) {
      return res.status(400).json({ error: "nombre y duracion_minutos son requeridos" });
    }

    const { rows } = await query(
      `UPDATE servicios
       SET nombre = $1, duracion_minutos = $2, precio = $3
       WHERE id = $4 AND prestador_id = $5
       RETURNING id, nombre, duracion_minutos, precio`,
      [nombre, duracion_minutos, precio ?? null, req.params.id, req.prestadorId]
    );
    if (!rows[0]) return res.status(404).json({ error: "servicio no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM servicios WHERE id = $1 AND prestador_id = $2",
      [req.params.id, req.prestadorId]
    );
    if (!rowCount) return res.status(404).json({ error: "servicio no encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
