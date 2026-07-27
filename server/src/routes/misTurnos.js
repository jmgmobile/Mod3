import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

async function obtenerTurnoPropio(prestadorId, turnoId) {
  const { rows } = await query(
    "SELECT id, estado FROM turnos WHERE id = $1 AND prestador_id = $2",
    [turnoId, prestadorId]
  );
  return rows[0] || null;
}

router.post("/:id/cancelar", requireAuth, async (req, res, next) => {
  try {
    const turno = await obtenerTurnoPropio(req.prestadorId, req.params.id);
    if (!turno) return res.status(404).json({ error: "turno no encontrado" });
    if (turno.estado === "cancelado") {
      return res.status(409).json({ error: "el turno ya estaba cancelado" });
    }

    const { rows } = await query(
      "UPDATE turnos SET estado = 'cancelado' WHERE id = $1 RETURNING id, estado",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/completar", requireAuth, async (req, res, next) => {
  try {
    const turno = await obtenerTurnoPropio(req.prestadorId, req.params.id);
    if (!turno) return res.status(404).json({ error: "turno no encontrado" });
    if (turno.estado !== "confirmado") {
      return res.status(409).json({ error: "solo se puede completar un turno confirmado" });
    }

    const { rows } = await query(
      "UPDATE turnos SET estado = 'completado' WHERE id = $1 RETURNING id, estado",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
