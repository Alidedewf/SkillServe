const rateLimit = require('express-rate-limit');

/**
 * Лимитер для эндпоинта логина — защита от перебора паролей (brute-force).
 *
 * skipSuccessfulRequests: true — считаем ТОЛЬКО неудачные попытки (статус >= 400).
 * Поэтому легитимные пользователи, которые входят с первого раза, квоту не расходуют,
 * и даже на общем IP (NAT ресторана) обычный вход не блокируется. Под лимит попадает
 * только тот, кто раз за разом ошибается паролем.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // окно 15 минут
  max: 20,                  // не более 20 НЕУДАЧНЫХ попыток с одного IP за окно
  skipSuccessfulRequests: true,
  standardHeaders: true,    // отдаём заголовки RateLimit-*
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});

module.exports = { loginLimiter };
