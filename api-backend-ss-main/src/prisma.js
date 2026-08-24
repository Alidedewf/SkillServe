const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { emit: 'event', level: 'error' },
  ],
});

// Гасим шум: "terminating connection" — БД закрыла idle-соединение,
// Prisma переподключится при следующем запросе.
prisma.$on('error', (e) => {
  if (e.message?.includes('terminating connection')) return;
  console.error('[Prisma Error]', e.message);
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Разрыв соединения с БД (перезапуск контейнера БД, таймаут пула и т.п.)
const isConnectionLost = (err) =>
  err?.code === 'P1001' || // Can't reach database server
  err?.code === 'P1008' || // Operations timed out
  err?.code === 'P1017' || // Server closed the connection
  err?.code === 'P2024' || // Connection pool timeout
  err?.message?.includes('terminating connection') ||
  err?.message?.includes('Connection pool timeout') ||
  err?.message?.includes('kind: Closed');

// Повторные попытки при кратковременном разрыве соединения
// (например, БД перезапустилась) — с нарастающей задержкой.
prisma.$use(async (params, next) => {
  const MAX_RETRIES = 4;
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await next(params);
    } catch (err) {
      lastErr = err;
      if (!isConnectionLost(err) || attempt === MAX_RETRIES) {
        if (isConnectionLost(err)) {
          console.error(`❌ [Prisma] БД недоступна после ${attempt + 1} попыток (${params.model}.${params.action}): ${err.code || err.message}`);
        }
        throw err;
      }
      const delay = 300 * Math.pow(2, attempt); // 300, 600, 1200, 2400ms
      console.warn(`[Prisma] Соединение оборвано (${err.code || 'closed'}), повтор ${attempt + 1}/${MAX_RETRIES} через ${delay}ms — ${params.model}.${params.action}`);
      await sleep(delay);
    }
  }
  throw lastErr;
});

// Прогреваем соединение при старте сервера
prisma.$connect()
  .then(() => console.log('✅ Подключение к БД установлено'))
  .catch((err) => console.error('❌ Ошибка подключения к БД:', err.message));

module.exports = prisma;
