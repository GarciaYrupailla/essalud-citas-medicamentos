export function authMiddleware(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  next();
}
