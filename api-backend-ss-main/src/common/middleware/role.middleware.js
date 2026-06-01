/**
 * Фабрика middleware для проверки ролей.
 * Использование: requireRole('ADMIN', 'SUPER_ADMIN')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};

module.exports = requireRole;
