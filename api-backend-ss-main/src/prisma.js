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


// Автоматический реконнект при обрыве соединения Neon (E57P01 — admin_shutdown)
// Neon serverless убивает idle-соединения, поэтому при следующем запросе нужно переподключиться
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (err) {
    const isNeonDisconnect =
      err?.message?.includes('terminating connection') ||
      err?.message?.includes('Connection pool timeout') ||
      err?.code === 'P1001' ||
      err?.code === 'P1008' ||
      err?.code === 'P2024';

    if (isNeonDisconnect) {
      console.warn('[Prisma] Neon оборвал соединение, переподключаемся...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch (reconnectErr) {
        console.error('[Prisma] Ошибка реконнекта:', reconnectErr.message);
      }
      // Повторяем исходный запрос один раз
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
