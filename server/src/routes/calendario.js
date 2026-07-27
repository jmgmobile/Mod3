import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const SELECT_TURNOS_DEL_PRESTADOR = `
  SELECT t.id, t.fecha, t.hora_inicio, t.hora_fin, t.estado,
         t.cliente_nombre, t.cliente_telefono,
         s.nombre AS servicio_nombre
  FROM turnos t
  JOIN servicios s ON s.id = t.servicio_id
  WHERE t.prestador_id = $1 AND t.fecha = $2 AND t.estado <> 'cancelado'
  ORDER BY t.hora_inicio
`;

function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { vista, fecha } = req.query;
    if (!fecha || !FECHA_RE.test(fecha)) {
      return res.status(400).json({ error: "fecha (YYYY-MM-DD) es requerida" });
    }

    if (vista === "semana") {
      const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();
      const inicioSemana = sumarDias(fecha, -diaSemana);

      const dias = [];
      for (let i = 0; i < 7; i++) {
        const fechaDia = sumarDias(inicioSemana, i);
        const { rows } = await query(SELECT_TURNOS_DEL_PRESTADOR, [req.prestadorId, fechaDia]);
        dias.push({ fecha: fechaDia, turnos: rows });
      }
      return res.json({ semana_inicio: inicioSemana, dias });
    }

    const { rows } = await query(SELECT_TURNOS_DEL_PRESTADOR, [req.prestadorId, fecha]);
    res.json({ fecha, turnos: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
