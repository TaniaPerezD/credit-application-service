const { NotFoundError, InvalidTransitionError } = require('../services/creditApplicationService');

function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof InvalidTransitionError) {
    return res.status(422).json({ error: err.message });
  }
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

module.exports = { errorHandler, notFoundHandler };
