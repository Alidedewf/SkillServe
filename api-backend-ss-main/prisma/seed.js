const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Очистка старых данных перед посевом...');
  
  // Каскадно очищаем все таблицы
  await prisma.testAttempt.deleteMany();
  await prisma.userCourseProgress.deleteMany();
  await prisma.userLessonProgress.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurantSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.restaurant.deleteMany();

  console.log('🌱 Создание SUPER_ADMIN...');
  const saltRounds = 10;
  const superAdminPassword = await bcrypt.hash('superadminpassword', saltRounds);
  
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Супер Администратор (Владелец)',
      email: 'superadmin@skillserve.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      language: 'ru',
    },
  });
  console.log(`- Создан SUPER_ADMIN: ${superAdmin.email}`);
  console.log('✅ База данных успешно очищена и инициализирована (создан только SUPER_ADMIN)!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка выполнения сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
