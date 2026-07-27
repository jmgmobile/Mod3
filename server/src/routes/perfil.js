import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, email, nombre_negocio, rubro, foto_url FROM prestadores WHERE id = $1",
      [req.prestadorId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const { nombre_negocio, rubro, foto_url } = req.body || {};
    if (!nombre_negocio || !rubro) {
      return res.status(400).json({ error: "nombre_negocio y rubro son requeridos" });
    }

    const { rows } = await query(
      `UPDATE prestadores
       SET nombre_negocio = $1, rubro = $2, foto_url = $3
       WHERE id = $4
       RETURNING id, email, nombre_negocio, rubro, foto_url`,
      [nombre_negocio, rubro, foto_url || null, req.prestadorId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
