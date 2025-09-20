function validation(res, errors) {
  return res.status(400).json({ erros: Array.isArray(errors) ? errors : [errors] });
}

function badRequest(res, message) {
  return res.status(400).json({ erro: message });
}

function notFound(res, message) {
  return res.status(404).json({ erro: message });
}

function conflict(res, message) {
  return res.status(409).json({ erro: message });
}

function serverError(res, err) {
  // Log to console for server-side debugging
  console.error('Server error:', err && err.stack ? err.stack : err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { validation, badRequest, notFound, conflict, serverError };
