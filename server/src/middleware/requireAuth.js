export function requireAuth(req, res, next) {
  if (!req.session || !req.session.prestadorId) {
    return res.status(401).json({ error: "no autenticado" });
  }
  req.prestadorId = req.session.prestadorId;
  next();
}
