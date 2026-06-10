const prisma = require('../../prisma');
const { notFound } = require('../../common/utils/errors');

const getCourses = async (userId, restaurantId) => {
  const where = { status: 'ACTIVE' };
  if (restaurantId) where.restaurant_id = restaurantId;

  const [courses, progresses] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        image_url: true,
      },
    }),
    prisma.userCourseProgress.findMany({
      where: { user_id: userId },
      select: { course_id: true, progress: true },
    }),
  ]);

  const progressMap = new Map(progresses.map(p => [p.course_id, p.progress]));

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    image: course.image_url,
    image_url: course.image_url,
    progress: progressMap.get(course.id) || 0,
  }));
};

const getInProgress = async (userId, restaurantId) => {
  const courseFilter = restaurantId ? { restaurant_id: restaurantId } : {};
  const progresses = await prisma.userCourseProgress.findMany({
    where: {
      user_id: userId,
      course: courseFilter,
      progress: { gt: 0, lt: 100 },
    },
    select: {
      progress: true,
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          image_url: true,
        }
      }
    },
  });

  return progresses.map((p) => ({
    id: p.course.id,
    title: p.course.title,
    description: p.course.description,
    category: p.course.category,
    image: p.course.image_url,
    image_url: p.course.image_url,
    progress: p.progress,
  }));
};

const getNewCourses = async (userId, restaurantId) => {
  const courseWhere = { status: 'ACTIVE' };
  if (restaurantId) courseWhere.restaurant_id = restaurantId;

  const courseFilter = restaurantId ? { restaurant_id: restaurantId } : {};

  const [allCourses, progresses] = await Promise.all([
    prisma.course.findMany({ 
      where: courseWhere,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        image_url: true,
      }
    }),
    prisma.userCourseProgress.findMany({
      where: { user_id: userId, course: courseFilter },
      select: { course_id: true, progress: true },
    }),
  ]);

  const startedCourseIds = new Set(
    progresses.filter((p) => p.progress > 0).map((p) => p.course_id)
  );

  return allCourses
    .filter((c) => !startedCourseIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      image: c.image_url,
      image_url: c.image_url,
      progress: 0,
    }));
};

const getArchived = async (userId, restaurantId) => {
  const courseFilter = restaurantId ? { restaurant_id: restaurantId } : {};
  const progresses = await prisma.userCourseProgress.findMany({
    where: {
      user_id: userId,
      course: courseFilter,
      progress: 100,
    },
    select: {
      progress: true,
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          image_url: true,
        }
      }
    },
  });

  return progresses.map((p) => ({
    id: p.course.id,
    title: p.course.title,
    description: p.course.description,
    category: p.course.category,
    image: p.course.image_url,
    image_url: p.course.image_url,
    progress: 100,
  }));
};

const getCourseById = async (courseId, restaurantId) => {
  const where = { id: courseId };
  if (restaurantId) where.restaurant_id = restaurantId;

  const course = await prisma.course.findFirst({ where });
  if (!course) throw notFound('Курс');
  return course;
};

const getCourseLessons = async (userId, courseId, restaurantId) => {
  const courseWhere = { id: courseId };
  if (restaurantId) courseWhere.restaurant_id = restaurantId;

  const course = await prisma.course.findFirst({ where: courseWhere });
  if (!course) throw notFound('Курс');

  const lessons = await prisma.lesson.findMany({
    where: { course_id: courseId },
    orderBy: { order: 'asc' },
  });

  const completedLessons = await prisma.userLessonProgress.findMany({
    where: {
      user_id: userId,
      lesson: { course_id: courseId },
    },
    select: { lesson_id: true },
  });
  const completedIds = new Set(completedLessons.map((c) => c.lesson_id));

  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type.toLowerCase(),
    is_completed: completedIds.has(l.id),
  }));
};

const getCourseTests = async (courseId, restaurantId) => {
  const courseWhere = { id: courseId };
  if (restaurantId) courseWhere.restaurant_id = restaurantId;

  const course = await prisma.course.findFirst({ where: courseWhere });
  if (!course) throw notFound('Курс');

  const tests = await prisma.test.findMany({
    where: { course_id: courseId },
    include: {
      questions: true,
    },
  });

  return tests.map((t) => ({
    id: t.id,
    title: t.title,
    questions_count: t.questions.length,
    is_passed: false,
    score: { current: 0, max: t.questions.length },
  }));
};

const resetCourseProgress = async (userId, courseId, restaurantId) => {
  const courseWhere = { id: courseId };
  if (restaurantId) courseWhere.restaurant_id = restaurantId;

  const course = await prisma.course.findFirst({ where: courseWhere });
  if (!course) throw notFound('Курс');

  const lessons = await prisma.lesson.findMany({
    where: { course_id: courseId },
    select: { id: true },
  });
  const lessonIds = lessons.map((l) => l.id);

  const tests = await prisma.test.findMany({
    where: { course_id: courseId },
    select: { id: true },
  });
  const testIds = tests.map((t) => t.id);

  await prisma.$transaction([
    prisma.userLessonProgress.deleteMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
    }),
    prisma.testAttempt.deleteMany({
      where: {
        user_id: userId,
        test_id: { in: testIds },
      },
    }),
    prisma.userCourseProgress.upsert({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
      update: {
        progress: 0,
        status: 'NOT_STARTED',
      },
      create: {
        user_id: userId,
        course_id: courseId,
        progress: 0,
        status: 'NOT_STARTED',
      },
    }),
  ]);

  return { message: 'Прогресс курса успешно сброшен' };
};

module.exports = {
  getCourses,
  getInProgress,
  getNewCourses,
  getArchived,
  getCourseById,
  getCourseLessons,
  getCourseTests,
  resetCourseProgress,
};
