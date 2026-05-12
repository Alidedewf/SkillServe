const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

// Прогреваем соединение с Neon при старте сервера
prisma.$connect()
  .then(() => console.log('✅ Подключение к БД установлено'))
  .catch((err) => console.error('❌ Ошибка подключения к БД:', err.message));

module.exports = prisma;
