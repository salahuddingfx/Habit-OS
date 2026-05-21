const memoryLimits = new Map();

// Clear memory rates every minute
setInterval(() => {
  memoryLimits.clear();
}, 60 * 1000);

export function rateLimitMiddleware(limit = 100) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // In-memory rate limiting
    const current = memoryLimits.get(ip) || 0;
    if (current >= limit) {
      return res.status(429).json({
        message: 'Too many requests. Please throttle your sync schedule.'
      });
    }
    
    memoryLimits.set(ip, current + 1);
    next();
  };
}
