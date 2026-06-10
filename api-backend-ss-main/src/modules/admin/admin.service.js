const bcrypt = require('bcrypt');
const prisma = require('../../prisma');
const { notFound, badRequest, conflict } = require('../../common/utils/errors');
const findOrFail = require('../../common/utils/findOrFail');

// ─── 1. STATISTICS ───────────────────────────────────────────────────────────
const getStats = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  const total_courses = await prisma.course.count({
    where,
  });
  const published_courses = await prisma.course.count({
    where: { ...where, status: 'ACTIVE' },
  });

  const userWhere = { role: 'USER', restaurant_id: restaurantId };

  const total_users = await prisma.user.count({
    where: userWhere,
  });

  return {
    total_courses,
    published_courses,
    total_users,
    active_users: total_users,
  };
};

// ─── 2. COURSE MANAGEMENT ────────────────────────────────────────────────────
const getCourses = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  const courses = await prisma.course.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      image_url: true,
      status: true,
      created_at: true,
      _count: {
        select: {
          lessons: true,
          tests: true,
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    category: course.category || 'Сервис',
    image_url: course.image_url || '',
    is_published: course.status === 'ACTIVE',
    created_at: course.created_at,
    lessons_count: course._count.lessons,
    tests_count: course._count.tests,
  }));
};

const getCourseById = async (restaurantId, courseId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { id: courseId, restaurant_id: restaurantId };

  const course = await prisma.course.findFirst({
    where,
    include: {
      lessons: true,
      tests: {
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      },
    },
  });

  if (!course) throw notFound('Курс');

  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    category: course.category || 'Сервис',
    image_url: course.image_url || '',
    is_published: course.status === 'ACTIVE',
    created_at: course.created_at,
    lessons: (course.lessons || []).map((l) => {
      let blocks = [];
      try {
        blocks = JSON.parse(l.content);
      } catch {
        blocks = [{ order: 1, type: 'text', content: l.content || '' }];
      }
      return {
        id: l.id,
        course_id: l.course_id,
        title: l.title,
        order: l.order,
        type: l.type.toLowerCase(),
        blocks: blocks,
      };
    }),
    tests: (course.tests || []).map((t) => ({
      id: t.id,
      course_id: t.course_id,
      title: t.title,
      questions: (t.questions || []).map((q) => ({
        id: q.id,
        content: q.content,
        answers: (q.answers || []).map((a) => ({
          id: a.id,
          content: a.content,
          is_correct: a.is_correct,
        })),
      })),
    })),
  };
};

const createCourse = async (restaurantId, { title, description, category, image_url, is_published, lessons, tests }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан для создания курса');
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        restaurant_id: restaurantId,
        title: title || 'Новый курс',
        description: description || '',
        category: category || 'Сервис',
        image_url: image_url || '',
        status: is_published ? 'ACTIVE' : 'ARCHIVED',
      },
    });

    const courseId = course.id;

    if (lessons && Array.isArray(lessons)) {
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        await tx.lesson.create({
          data: {
            course_id: courseId,
            title: l.title || 'Урок',
            type: String(l.type).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT',
            content: l.blocks ? JSON.stringify(l.blocks) : '',
            order: i + 1,
          },
        });
      }
    }

    if (tests && Array.isArray(tests)) {
      for (const t of tests) {
        const createdTest = await tx.test.create({
          data: {
            course_id: courseId,
            title: t.title || 'Тест',
          },
        });

        if (t.questions && Array.isArray(t.questions)) {
          for (const q of t.questions) {
            const createdQ = await tx.question.create({
              data: {
                test_id: createdTest.id,
                content: q.content,
              },
            });

            if (q.answers && Array.isArray(q.answers)) {
              await tx.answer.createMany({
                data: q.answers.map((ans) => ({
                  question_id: createdQ.id,
                  content: ans.content,
                  is_correct: !!ans.is_correct,
                })),
              });
            }
          }
        }
      }
    }

    return { id: courseId, message: 'Курс успешно создан' };
  }, { maxWait: 10000, timeout: 15000 });
};

const updateCourse = async (restaurantId, courseId, { title, description, category, image_url, is_published, lessons, tests }) => {
  await findOrFail('course', courseId, restaurantId, 'Курс');

  return prisma.$transaction(async (tx) => {
    // Обновляем только те поля курса, которые реально переданы
    const courseData = {};
    if (title !== undefined) courseData.title = title;
    if (description !== undefined) courseData.description = description;
    if (category !== undefined) courseData.category = category;
    if (image_url !== undefined) courseData.image_url = image_url;
    if (is_published !== undefined) courseData.status = is_published ? 'ACTIVE' : 'ARCHIVED';

    if (Object.keys(courseData).length > 0) {
      await tx.course.update({
        where: { id: courseId },
        data: courseData,
      });
    }

    // Пересоздаём уроки ТОЛЬКО если они явно переданы в payload
    if (lessons !== undefined && Array.isArray(lessons)) {
      await tx.lesson.deleteMany({ where: { course_id: courseId } });
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        await tx.lesson.create({
          data: {
            course_id: courseId,
            title: l.title,
            type: String(l.type).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT',
            content: l.blocks ? JSON.stringify(l.blocks) : '',
            order: i + 1,
          },
        });
      }
    }

    // Пересоздаём тесты ТОЛЬКО если они явно переданы в payload
    if (tests !== undefined && Array.isArray(tests)) {
      const activeTestIds = [];

      for (const t of tests) {
        let testId;
        const isNewTest = !t.id || String(t.id).startsWith('t');

        if (isNewTest) {
          const createdTest = await tx.test.create({
            data: {
              course_id: courseId,
              title: t.title || 'Финальный тест',
            },
          });
          testId = createdTest.id;
        } else {
          testId = parseInt(t.id);
          await tx.test.update({
            where: { id: testId },
            data: { title: t.title },
          });
        }

        activeTestIds.push(testId);

        await tx.question.deleteMany({ where: { test_id: testId } });

        if (t.questions && Array.isArray(t.questions)) {
          for (const q of t.questions) {
            const createdQ = await tx.question.create({
              data: {
                test_id: testId,
                content: q.content,
              },
            });

            if (q.answers && Array.isArray(q.answers)) {
              await tx.answer.createMany({
                data: q.answers.map((ans) => ({
                  question_id: createdQ.id,
                  content: ans.content,
                  is_correct: !!ans.is_correct,
                })),
              });
            }
          }
        }
      }

      await tx.test.deleteMany({
        where: {
          course_id: courseId,
          id: { notIn: activeTestIds },
        },
      });
    }
    // Если tests не передан — не трогаем существующие тесты

    return { id: courseId, message: 'Курс успешно обновлен' };
  }, { maxWait: 15000, timeout: 30000 });
};

const deleteCourse = async (restaurantId, courseId) => {
  await findOrFail('course', courseId, restaurantId, 'Курс');

  await prisma.course.delete({ where: { id: courseId } });
  return { message: 'Курс успешно удален' };
};

// Helper to look up or create position under a restaurant
const getOrCreatePosition = async (restaurantId, positionName) => {
  if (!positionName) return null;
  const name = positionName.trim();
  if (!name) return null;

  let pos = await prisma.position.findFirst({
    where: {
      restaurant_id: restaurantId,
      name: { equals: name, mode: 'insensitive' },
    },
  });

  if (!pos) {
    pos = await prisma.position.create({
      data: {
        restaurant_id: restaurantId,
        name: name,
        order: 0,
      },
    });
  }
  return pos;
};

// ─── 3. USER MANAGEMENT ──────────────────────────────────────────────────────
const getUsers = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  const users = await prisma.user.findMany({
    where,
    include: { position: true },
    orderBy: { id: 'desc' },
  });

  return users.map((user) => {
    const parts = (user.name || '').split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';

    return {
      id: user.id,
      first_name,
      last_name,
      email: user.email,
      phone: '',
      role: user.role.toLowerCase(),
      position: user.position?.name || 'Сотрудник',
      avatar_url: user.avatar_url || '',
      is_active: true,
      created_at: user.created_at,
    };
  });
};

const createUser = async (restaurantId, { first_name, last_name, email, password, role, position }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан для создания пользователя');
  if (!email || !password) {
    throw badRequest('Email и пароль обязательны');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('Пользователь с таким email уже существует');

  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Сотрудник';

  const positionObj = await getOrCreatePosition(restaurantId, position);

  const user = await prisma.user.create({
    data: {
      restaurant_id: restaurantId,
      name: fullName,
      email,
      password: hashedPassword,
      role: String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      position_id: positionObj ? positionObj.id : null,
    },
    include: { position: true },
  });

  // Создаём приветственное уведомление
  await prisma.notification.create({
    data: {
      user_id: user.id,
      restaurant_id: restaurantId,
      title: 'Добро пожаловать!',
      message: `Привет, ${fullName}! Ваш аккаунт успешно создан. Начните обучение в разделе «Курсы».`,
    },
  });

  return {
    id: user.id,
    first_name,
    last_name,
    email: user.email,
    role: user.role.toLowerCase(),
    position: user.position?.name || 'Сотрудник',
    avatar_url: user.avatar_url || '',
    is_active: true,
    created_at: user.created_at,
  };

};

const updateUser = async (restaurantId, userId, { first_name, last_name, email, password, role, position }) => {
  await findOrFail('user', userId, restaurantId, 'Пользователь');

  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  const data = {
    name: fullName || undefined,
    email,
    role: role ? (String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') : undefined,
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  if (position !== undefined) {
    const positionObj = await getOrCreatePosition(restaurantId, position);
    data.position_id = positionObj ? positionObj.id : null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { position: true },
  });

  return {
    id: user.id,
    first_name,
    last_name,
    email: user.email,
    role: user.role.toLowerCase(),
    position: user.position?.name || 'Сотрудник',
    avatar_url: user.avatar_url || '',
    is_active: true,
    created_at: user.created_at,
  };
};

const deleteUser = async (restaurantId, userId) => {
  await findOrFail('user', userId, restaurantId, 'Пользователь');

  await prisma.user.delete({ where: { id: userId } });
  return { message: 'Пользователь успешно удален' };
};

// ─── 4. ACHIEVEMENT MANAGEMENT ───────────────────────────────────────────────
const getAchievements = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const where = { restaurant_id: restaurantId };

  return prisma.achievement.findMany({
    where,
    include: {
      course: { select: { title: true } },
      _count: { select: { users: true } },
    },
    orderBy: { id: 'desc' },
  });
};

const createAchievement = async (restaurantId, { title, description, image_url, course_id }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан для создания достижения');
  if (!title) throw badRequest('Название достижения обязательно');

  if (course_id) {
    await findOrFail('course', parseInt(course_id), restaurantId, 'Курс');
  }

  return prisma.achievement.create({
    data: {
      restaurant_id: restaurantId,
      title,
      description,
      image_url,
      course_id: course_id ? parseInt(course_id) : null,
    },
    include: {
      course: { select: { title: true } },
      _count: { select: { users: true } },
    },
  });
};

const updateAchievement = async (restaurantId, id, { title, description, image_url, course_id }) => {
  await findOrFail('achievement', id, restaurantId, 'Достижение');

  if (course_id) {
    await findOrFail('course', parseInt(course_id), restaurantId, 'Курс');
  }

  return prisma.achievement.update({
    where: { id },
    data: {
      title,
      description,
      image_url,
      course_id: course_id !== undefined ? (course_id ? parseInt(course_id) : null) : undefined,
    },
    include: {
      course: { select: { title: true } },
      _count: { select: { users: true } },
    },
  });
};

const deleteAchievement = async (restaurantId, id) => {
  await findOrFail('achievement', id, restaurantId, 'Достижение');

  await prisma.achievement.delete({ where: { id } });
  return { message: 'Достижение удалено' };
};

const grantAchievement = async (restaurantId, achievementId, { user_id }) => {
  if (!user_id) throw badRequest('Не указан user_id');

  const userId = parseInt(user_id);

  // Проверяем что достижение принадлежит ресторану
  await findOrFail('achievement', achievementId, restaurantId, 'Достижение');

  // Проверяем что пользователь принадлежит ресторану
  await findOrFail('user', userId, restaurantId, 'Пользователь');

  return prisma.userAchievement.upsert({
    where: {
      user_id_achievement_id: {
        user_id: userId,
        achievement_id: achievementId,
      },
    },
    update: {},
    create: {
      user_id: userId,
      achievement_id: achievementId,
    },
  });
};

module.exports = {
  getStats,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  grantAchievement,
};
