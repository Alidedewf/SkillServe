/**
 * Централизованная конфигурация приложения.
 * Все env-переменные вычитываются здесь и экспортируются как объект.
 */
const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET;
// В production запрещаем старт без секрета: иначе токены подписываются известной
// строкой и могут быть подделаны. В dev допускаем небезопасный дефолт с предупреждением.
if (!jwtSecret && isProduction) {
  throw new Error(
    'JWT_SECRET обязателен в production. Задайте сильный случайный секрет в переменных окружения.'
  );
}
if (!jwtSecret) {
  console.warn(
    '[config] ⚠️  JWT_SECRET не задан — используется небезопасный dev-секрет. НЕ применять в production!'
  );
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isProduction,
  jwt: {
    secret: jwtSecret || 'dev-only-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
