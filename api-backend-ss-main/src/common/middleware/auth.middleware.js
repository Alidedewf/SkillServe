const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * JWT-аутентификация.
 * Проверяет токен, декодирует payload и навешивает на req.user.
 * Payload: { id, email, role, restaurantId }
 */
const authMiddleware = (req, res, next) => {
  // Основной источник — httpOnly cookie. Bearer-заголовок оставлен как fallback
  // для внешних API-клиентов (Postman, мобильные интеграции и т.п.).
  let token = req.cookies && req.cookies.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, email, role, restaurantId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
};

module.exports = authMiddleware;
