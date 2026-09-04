const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the backend.');
}

/**
 * Middleware to authenticate requests via Bearer JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or invalid. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid access token signature.',
    });
  }
}

/**
 * Optional authentication middleware: attaches user if valid token exists, but does not block if missing
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles Allowed roles (e.g. 'superadmin', 'user')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before verifying role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
};
