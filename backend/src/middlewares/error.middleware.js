export function errorMiddleware(error, req, res, next) {
  console.error(error);

  const status = error.status || 500;
  const message = error.message || 'Error interno del servidor';

  res.status(status).json({ message });
}
