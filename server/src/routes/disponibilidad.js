import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, dia_semana, hora_inicio, hora_fin
       FROM disponibilidad_semanal
       WHERE prestador_id = $1
       ORDER BY dia_semana, hora_inicio`,
      [req.prestadorId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.put("/", requireAuth, async (req, res, next) => {
  const { reglas } = req.body || {};
  if (!Array.isArray(reglas)) {
    return res.status(400).json({ error: "reglas debe ser un array" });
  }
  for (const r of reglas) {
    if (
      typeof r.dia_semana !== "number" ||
      r.dia_semana < 0 ||
      r.dia_semana > 6 ||
      !r.hora_inicio ||
      !r.hora_fin
    ) {
      return res.status(400).json({ error: "cada regla necesita dia_semana (0-6), hora_inicio y hora_fin" });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM disponibilidad_semanal WHERE prestador_id = $1", [req.prestadorId]);
    for (const r of reglas) {
      await client.query(
        `INSERT INTO disponibilidad_semanal (prestador_id, dia_semana, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4)`,
        [req.prestadorId, r.dia_semana, r.hora_inicio, r.hora_fin]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    `SELECT id, dia_semana, hora_inicio, hora_fin
     FROM disponibilidad_semanal
     WHERE prestador_id = $1
     ORDER BY dia_semana, hora_inicio`,
    [req.prestadorId]
  );
  res.json(rows);
});

export default router;
