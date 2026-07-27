import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";

const router = Router();

router.post("/registro", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "la contraseña debe tener al menos 8 caracteres" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let result;
    try {
      result = await query(
        `INSERT INTO prestadores (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`,
        [email.toLowerCase().trim(), passwordHash]
      );
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "ya existe una cuenta con ese email" });
      }
      throw err;
    }

    const prestador = result.rows[0];
    req.session.prestadorId = prestador.id;
    res.status(201).json(prestador);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }

    const { rows } = await query(
      "SELECT id, email, password_hash FROM prestadores WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    const prestador = rows[0];
    const valid = prestador && (await bcrypt.compare(password, prestador.password_hash));
    if (!valid) {
      return res.status(401).json({ error: "email o contraseña incorrectos" });
    }

    req.session.prestadorId = prestador.id;
    res.json({ id: prestador.id, email: prestador.email });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("turnoapp.sid");
    res.status(204).end();
  });
});

router.get("/me", (req, res) => {
  if (!req.session.prestadorId) {
    return res.status(401).json({ error: "no autenticado" });
  }
  res.json({ id: req.session.prestadorId });
});

export default router;
