import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, fecha, hora_inicio, hora_fin
       FROM bloqueos
       WHERE prestador_id = $1
       ORDER BY fecha, hora_inicio NULLS FIRST`,
      [req.prestadorId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { fecha, hora_inicio, hora_fin } = req.body || {};
    if (!fecha) {
      return res.status(400).json({ error: "fecha es requerida" });
    }
    if ((hora_inicio && !hora_fin) || (!hora_inicio && hora_fin)) {
      return res.status(400).json({ error: "hora_inicio y hora_fin deben ir juntas, o ninguna (día completo)" });
    }

    const { rows } = await query(
      `INSERT INTO bloqueos (prestador_id, fecha, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, fecha, hora_inicio, hora_fin`,
      [req.prestadorId, fecha, hora_inicio || null, hora_fin || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM bloqueos WHERE id = $1 AND prestador_id = $2",
      [req.params.id, req.prestadorId]
    );
    if (!rowCount) return res.status(404).json({ error: "bloqueo no encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
