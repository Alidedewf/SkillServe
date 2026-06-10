/**
 * Tenant isolation middleware.
 * Извлекает restaurant_id из JWT и навешивает на req.restaurantId.
 * SUPER_ADMIN может указать ресторан через заголовок X-Restaurant-Id.
 */
const tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  // SUPER_ADMIN может работать с любым рестораном
  if (req.user.role === 'SUPER_ADMIN') {
    const headerRestaurantId = req.headers['x-restaurant-id'];
    if (headerRestaurantId) {
      const parsed = parseInt(headerRestaurantId, 10);
      req.restaurantId = Number.isNaN(parsed) ? null : parsed;
    } else {
      req.restaurantId = null;
    }
    return next();
  }

  // ADMIN и USER — строго по своему ресторану
  if (!req.user.restaurantId) {
    return res.status(403).json({ error: 'Пользователь не привязан к ресторану' });
  }

  req.restaurantId = req.user.restaurantId;
  next();
};

module.exports = tenantMiddleware;
