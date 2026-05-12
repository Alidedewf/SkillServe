const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Очистка старых данных перед посевом...');
  
  // Каскадно очищаем таблицы
  await prisma.testAttempt.deleteMany();
  await prisma.userCourseProgress.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  // Удаляем старых пользователей перед чистым пересозданием
  await prisma.user.deleteMany();

  console.log('🌱 Создание других сотрудников и тестовых аккаунтов...');
  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash('123', saltRounds);

  // Тестовый Администратор
  const adminUser = await prisma.user.create({
    data: {
      name: 'Александр Тестовый (Админ)',
      email: 'admin@gmail.com',
      password: defaultPassword,
      role: 'ADMIN',
      position: 'Администратор',
      language: 'ru'
    }
  });

  // Тестовый Сотрудник (Официант)
  const standardUser = await prisma.user.create({
    data: {
      name: 'Иван Сотрудников (Юзер)',
      email: 'user@gmail.com',
      password: defaultPassword,
      role: 'USER',
      position: 'Официант',
      language: 'ru'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Даниял Ким',
      email: 'danial@gmail.com',
      password: defaultPassword,
      role: 'USER',
      position: 'Официант',
      language: 'ru'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Алина Мис',
      email: 'alina@gmail.com',
      password: defaultPassword,
      role: 'USER',
      position: 'Хостес',
      language: 'ru'
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Грег Тюнер',
      email: 'greg@gmail.com',
      password: defaultPassword,
      role: 'USER',
      position: 'Бармен',
      language: 'ru'
    }
  });

  const user4 = await prisma.user.create({
    data: {
      name: 'Зейн Ван',
      email: 'zayn@gmail.com',
      password: defaultPassword,
      role: 'USER',
      position: 'Официант',
      language: 'ru'
    }
  });

  console.log('🌱 Создание курсов...');
  
  // Курс 1
  const course1 = await prisma.course.create({
    data: {
      title: 'Стандарты сервировки стола',
      description: 'Правила раскладки приборов и виды посуды',
      image_url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=600&q=80',
      category: 'Сервис',
      language: 'ru',
      status: 'ACTIVE'
    }
  });

  // Курс 2
  const course2 = await prisma.course.create({
    data: {
      title: 'Винная карта: Базовый уровень',
      description: 'Основные сорта винограда и правила подачи',
      image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      category: 'Бар',
      language: 'ru',
      status: 'ACTIVE'
    }
  });

  // Курс 3
  const course3 = await prisma.course.create({
    data: {
      title: 'Конфликтология с гостями',
      description: 'Работа с возражениями и жалобами',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80',
      category: 'Сервис',
      language: 'ru',
      status: 'ACTIVE'
    }
  });

  console.log('🌱 Создание уроков...');

  // Уроки для Курса 1
  const l1_content = JSON.stringify([
    { order: 1, type: 'text', content: 'В ресторанном сервисе выделяют основные приборы (нож, вилка, ложка) и вспомогательные (для масла, рыбы, десертов).' },
    { order: 2, type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4' }
  ]);
  await prisma.lesson.create({
    data: {
      course_id: course1.id,
      title: 'Виды столовых приборов',
      type: 'VIDEO',
      content: l1_content,
      order: 1
    }
  });

  const l2_content = JSON.stringify([
    { order: 1, type: 'text', content: 'Основное правило сервировки: приборы располагаются в порядке их использования. Первыми берутся приборы, лежащие дальше всего от тарелки.' },
    { order: 2, type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { order: 3, type: 'text', content: 'Нож всегда кладется справа от тарелки лезвием к ней.' }
  ]);
  await prisma.lesson.create({
    data: {
      course_id: course1.id,
      title: 'Классическая раскладка',
      type: 'TEXT',
      content: l2_content,
      order: 2
    }
  });

  const l3_content = JSON.stringify([
    { order: 1, type: 'text', content: 'Салфетка должна быть идеально чистой и аккуратно сложенной. При подаче первого блюда она кладется гостю на колени.' }
  ]);
  await prisma.lesson.create({
    data: {
      course_id: course1.id,
      title: 'Работа с текстилем (скатерти, салфетки)',
      type: 'VIDEO',
      content: l3_content,
      order: 3
    }
  });

  // Урок для Курса 2
  const l4_content = JSON.stringify([
    { order: 1, type: 'text', content: 'Основные сорта красного винограда: Каберне Совиньон, Мерло, Пино Нуар. Каждый сорт обладает уникальным профилем кислотности и танинов.' }
  ]);
  await prisma.lesson.create({
    data: {
      course_id: course2.id,
      title: 'Красные сорта винограда',
      type: 'VIDEO',
      content: l4_content,
      order: 1
    }
  });

  console.log('🌱 Создание тестов, вопросов и ответов...');

  // Создаем Тест для Курса 1
  const test1 = await prisma.test.create({
    data: {
      course_id: course1.id,
      title: 'Итоговый экзамен: Сервировка',
      min_score: 2
    }
  });

  // Вопрос 1
  const q1 = await prisma.question.create({
    data: {
      test_id: test1.id,
      content: 'С какой стороны располагается нож при классической сервировке?',
      image_url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=600&q=80'
    }
  });
  await prisma.answer.createMany({
    data: [
      { question_id: q1.id, content: 'Слева от тарелки, лезвием наружу', is_correct: false },
      { question_id: q1.id, content: 'Справа от тарелки, лезвием к тарелке', is_correct: true },
      { question_id: q1.id, content: 'Сверху над тарелкой', is_correct: false }
    ]
  });

  // Вопрос 2
  const q2 = await prisma.question.create({
    data: {
      test_id: test1.id,
      content: 'В каком порядке гость должен использовать столовые приборы при подаче нескольких блюд?',
      image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80'
    }
  });
  await prisma.answer.createMany({
    data: [
      { question_id: q2.id, content: 'Снаружи внутрь (от дальних к ближним)', is_correct: true },
      { question_id: q2.id, content: 'Изнутри наружу (от ближних к дальним)', is_correct: false },
      { question_id: q2.id, content: 'Порядок не имеет значения', is_correct: false }
    ]
  });

  // Вопрос 3
  const q3 = await prisma.question.create({
    data: {
      test_id: test1.id,
      content: 'Какой бокал традиционно ставится первым (ближе всего к тарелке)?',
      image_url: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=600&q=80'
    }
  });
  await prisma.answer.createMany({
    data: [
      { question_id: q3.id, content: 'Для шампанского', is_correct: false },
      { question_id: q3.id, content: 'Для белого вина', is_correct: false },
      { question_id: q3.id, content: 'Для воды', is_correct: true }
    ]
  });

  console.log('🌱 Создание начального прогресса и очков для ботов (чтобы лидерборд ожил)...');
  
  // Добавим прохождение тестов ботами для симуляции очков (XP)
  await prisma.testAttempt.create({
    data: { user_id: user1.id, test_id: test1.id, correct_count: 3, total_questions: 3 } // 130 XP
  });
  await prisma.testAttempt.create({
    data: { user_id: user2.id, test_id: test1.id, correct_count: 2, total_questions: 3 } // 120 XP
  });
  await prisma.testAttempt.create({
    data: { user_id: user3.id, test_id: test1.id, correct_count: 1, total_questions: 3 } // 110 XP
  });

  console.log('✅ База данных успешно засеяна!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка выполнения сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
