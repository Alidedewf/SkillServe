const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * JWT-аутентификация.
 * Проверяет токен, декодирует payload и навешивает на req.user.
 * Payload: { id, email, role, restaurantId }
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, email, role, restaurantId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
};

module.exports = authMiddleware;
