import express from "express";
import cors from "cors";
import session from "express-session";
import authRouter from "./routes/auth.js";
import perfilRouter from "./routes/perfil.js";
import serviciosRouter from "./routes/servicios.js";
import disponibilidadRouter from "./routes/disponibilidad.js";
import bloqueosRouter from "./routes/bloqueos.js";
import negociosRouter from "./routes/negocios.js";
import turnosRouter from "./routes/turnos.js";
import calendarioRouter from "./routes/calendario.js";
import misTurnosRouter from "./routes/misTurnos.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(
    session({
      name: "turnoapp.sid",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/perfil", perfilRouter);
  app.use("/api/servicios", serviciosRouter);
  app.use("/api/disponibilidad", disponibilidadRouter);
  app.use("/api/bloqueos", bloqueosRouter);
  app.use("/api/negocios", negociosRouter);
  app.use("/api/turnos", turnosRouter);
  app.use("/api/calendario", calendarioRouter);
  app.use("/api/mis-turnos", misTurnosRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Error interno" });
  });

  return app;
}
