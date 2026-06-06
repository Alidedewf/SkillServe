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

// Фильтруем шум от Neon: E57P01 = idle-соединение убито — это ожидаемо,
// Prisma сама переподключится при следующем запросе.
prisma.$on('error', (e) => {
  if (e.message?.includes('terminating connection')) return; // Neon idle disconnect — игнорируем
  console.error('[Prisma Error]', e.message);
});


// Обработка повторных попыток при разрыве соединения Neon
prisma.$use(async (params, next) => {
  const start = Date.now();
  try {
    return await next(params);
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`❌ [Prisma ERROR] ${params.model}.${params.action} — ${duration}ms:`, err.message);

    const isNeonDisconnect =
      err?.message?.includes('terminating connection') ||
      err?.message?.includes('Connection pool timeout') ||
      err?.code === 'P1001' ||
      err?.code === 'P1008' ||
      err?.code === 'P2024';

    if (isNeonDisconnect) {
      console.warn('[Prisma] Neon оборвал соединение, повторяем запрос...');
      return await next(params);
    }

    throw err;
  }
});

// Прогреваем соединение с Neon при старте сервера
prisma.$connect()
  .then(() => console.log('✅ Подключение к БД установлено'))
  .catch((err) => console.error('❌ Ошибка подключения к БД:', err.message));

module.exports = prisma;
