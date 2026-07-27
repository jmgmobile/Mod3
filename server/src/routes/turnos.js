import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const SELECT_TURNO_PUBLICO = `
  SELECT t.id, t.fecha, t.hora_inicio, t.hora_fin, t.estado,
         s.nombre AS servicio_nombre,
         p.nombre_negocio
  FROM turnos t
  JOIN servicios s ON s.id = t.servicio_id
  JOIN prestadores p ON p.id = t.prestador_id
  WHERE t.id = $1
`;

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(SELECT_TURNO_PUBLICO, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "turno no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/cancelar", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, fecha, hora_inicio, estado FROM turnos WHERE id = $1",
      [req.params.id]
    );
    const turno = rows[0];
    if (!turno) return res.status(404).json({ error: "turno no encontrado" });
    if (turno.estado === "cancelado") {
      return res.status(409).json({ error: "el turno ya estaba cancelado" });
    }

    const inicioTurno = new Date(`${turno.fecha}T${turno.hora_inicio}`);
    const horasRestantes = (inicioTurno.getTime() - Date.now()) / (1000 * 60 * 60);
    if (horasRestantes < 2) {
      return res.status(409).json({ error: "el plazo para cancelar (2 horas antes) ya venció" });
    }

    const actualizado = await query(
      "UPDATE turnos SET estado = 'cancelado' WHERE id = $1 RETURNING id, estado",
      [req.params.id]
    );
    res.json(actualizado.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
