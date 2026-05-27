class ApiError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

function notFound(req, res, next) {
  next(new ApiError(404, `Not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const requestId = req.id || null;

  if (status >= 500) {
    console.error(`[${requestId || 'n/a'}]`, err);
  }

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    message: err.message || 'Internal Server Error',
    code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    requestId,
  });
}

module.exports = { ApiError, notFound, errorHandler };
