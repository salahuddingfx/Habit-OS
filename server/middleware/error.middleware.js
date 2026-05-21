export function errorMiddleware(err, req, res, next) {
  console.error('Error:', err.stack || err.message || err);
  
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    status: 'error',
    statusCode: status,
    message
  });
}
