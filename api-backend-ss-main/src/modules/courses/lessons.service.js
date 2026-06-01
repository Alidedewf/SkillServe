const prisma = require('../../prisma');
const { notFound } = require('../../common/utils/errors');

const getLessonById = async (userId, lessonId, restaurantId) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: true,
    },
  });

  if (!lesson || (restaurantId && lesson.course.restaurant_id !== restaurantId)) {
    throw notFound('Урок');
  }

  // ─── Трекинг прогресса: отмечаем что юзер открыл урок ──────────
  try {
    const totalLessons = await prisma.lesson.count({
      where: { course_id: lesson.course_id },
    });

    const existing = await prisma.userCourseProgress.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: lesson.course_id,
        },
      },
    });

    const stepPerLesson = totalLessons > 0 ? 100 / totalLessons : 100;

    await prisma.userCourseProgress.upsert({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: lesson.course_id,
        },
      },
      create: {
        user_id: userId,
        course_id: lesson.course_id,
        progress: stepPerLesson,
        status: 'IN_PROGRESS',
      },
      update: {
        status: 'IN_PROGRESS',
        progress: existing && existing.progress > 0 ? existing.progress : stepPerLesson,
      },
    });
  } catch (progressErr) {
    console.error('[Progress] Ошибка трекинга:', progressErr.message);
  }

  // Декодируем блоки из JSON-строки в базе
  let blocks = [];
  try {
    blocks = JSON.parse(lesson.content);
  } catch (e) {
    blocks = [{ order: 1, type: 'text', content: lesson.content }];
  }

  return {
    id: lesson.id,
    title: lesson.title,
    blocks: blocks,
  };
};

const completeLesson = async (userId, lessonId, restaurantId) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });

  if (!lesson || (restaurantId && lesson.course.restaurant_id !== restaurantId)) {
    throw notFound('Урок');
  }

  // 1. Помечаем урок как завершённый
  await prisma.userLessonProgress.upsert({
    where: {
      user_id_lesson_id: {
        user_id: userId,
        lesson_id: lessonId,
      },
    },
    create: {
      user_id: userId,
      lesson_id: lessonId,
    },
    update: {},
  });

  // 2. Считаем реальный прогресс курса
  const totalLessons = await prisma.lesson.count({
    where: { course_id: lesson.course_id },
  });

  const completedLessons = await prisma.userLessonProgress.count({
    where: {
      user_id: userId,
      lesson: { course_id: lesson.course_id },
    },
  });

  // Проверяем, есть ли тесты в этом курсе
  const totalTests = await prisma.test.count({
    where: { course_id: lesson.course_id },
  });

  const hasTests = totalTests > 0;
  const isAllLessonsCompleted = completedLessons === totalLessons;

  let progress = 0;
  let status = 'IN_PROGRESS';

  if (totalLessons > 0) {
    if (isAllLessonsCompleted && !hasTests) {
      progress = 100;
      status = 'COMPLETED';
    } else {
      progress = Math.min(Math.round((completedLessons / totalLessons) * 100), 99);
      status = 'IN_PROGRESS';
    }
  }

  // 3. Обновляем общий прогресс курса
  const updated = await prisma.userCourseProgress.upsert({
    where: {
      user_id_course_id: {
        user_id: userId,
        course_id: lesson.course_id,
      },
    },
    create: {
      user_id: userId,
      course_id: lesson.course_id,
      progress,
      status,
    },
    update: {
      progress,
      status,
    },
  });

  return {
    progress: updated.progress,
    status: updated.status,
    completedLessons,
    totalLessons,
  };
};

module.exports = {
  getLessonById,
  completeLesson,
};
