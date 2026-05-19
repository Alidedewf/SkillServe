const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

// Middleware для проверки прав суперадмина
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  next();
};

// Все роуты админки требуют авторизации и роли ADMIN
router.use(authMiddleware, adminMiddleware);

// ─── 1. СТАТИСТИКА ────────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const total_courses = await prisma.course.count();
    const published_courses = await prisma.course.count({
      where: { status: 'ACTIVE' }
    });
    const total_users = await prisma.user.count({
      where: { role: 'USER' }
    });

    res.json({
      total_courses,
      published_courses,
      total_users,
      active_users: total_users, // Упростим до общего кол-ва активных сотрудников
    });
  } catch (err) {
    console.error('[admin stats]', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// ─── 2. УПРАВЛЕНИЕ КУРСАМИ (CRUD) ──────────────────────────────────────────────
// GET /api/admin/courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: true,
        tests: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Форматируем под ожидания фронтенда (парсим блоки из lesson.content)
    const formatted = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      category: course.category || 'Сервис',
      image_url: course.image_url || '',
      is_published: course.status === 'ACTIVE',
      created_at: course.created_at,
      lessons: (course.lessons || []).map(l => {
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
          blocks: blocks
        };
      }),
      tests: (course.tests || []).map(t => ({
        id: t.id,
        course_id: t.course_id,
        title: t.title,
        questions: (t.questions || []).map(q => ({
          id: q.id,
          content: q.content,
          answers: (q.answers || []).map(a => ({
            id: a.id,
            content: a.content,
            is_correct: a.is_correct
          }))
        }))
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[admin get courses]', err);
    res.status(500).json({ error: 'Ошибка получения курсов' });
  }
});

// GET /api/admin/courses/:id
router.get('/courses/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Неверный ID курса' });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
        tests: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    const formatted = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      category: course.category || 'Сервис',
      image_url: course.image_url || '',
      is_published: course.status === 'ACTIVE',
      created_at: course.created_at,
      lessons: (course.lessons || []).map(l => {
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
          blocks: blocks
        };
      }),
      tests: (course.tests || []).map(t => ({
        id: t.id,
        course_id: t.course_id,
        title: t.title,
        questions: (t.questions || []).map(q => ({
          id: q.id,
          content: q.content,
          answers: (q.answers || []).map(a => ({
            id: a.id,
            content: a.content,
            is_correct: a.is_correct
          }))
        }))
      }))
    };

    res.json(formatted);
  } catch (err) {
    console.error('[admin get course]', err);
    res.status(500).json({ error: 'Ошибка получения данных курса' });
  }
});

// POST /api/admin/courses
router.get('/courses/create-placeholder', async (req, res) => {
  // Заглушка, если фронтенд запросит пустую болванку перед сохранением
});

// Реальное создание курса с вложенными уроками и тестами
router.post('/courses', async (req, res) => {
  const { title, description, category, image_url, is_published, lessons, tests } = req.body;
  try {
    const course = await prisma.course.create({
      data: {
        title: title || 'Новый курс',
        description: description || '',
        category: category || 'Сервис',
        image_url: image_url || '',
        status: is_published ? 'ACTIVE' : 'ARCHIVED'
      }
    });

    const courseId = course.id;

    // Создаем уроки
    if (lessons && Array.isArray(lessons)) {
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        await prisma.lesson.create({
          data: {
            course_id: courseId,
            title: l.title || 'Урок',
            type: String(l.type).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT',
            content: l.blocks ? JSON.stringify(l.blocks) : '',
            order: i + 1
          }
        });
      }
    }

    // Создаем тесты
    if (tests && Array.isArray(tests)) {
      for (const t of tests) {
        const createdTest = await prisma.test.create({
          data: {
            course_id: courseId,
            title: t.title || 'Тест'
          }
        });

        if (t.questions && Array.isArray(t.questions)) {
          for (const q of t.questions) {
            const createdQ = await prisma.question.create({
              data: {
                test_id: createdTest.id,
                content: q.content
              }
            });

            if (q.answers && Array.isArray(q.answers)) {
              await prisma.answer.createMany({
                data: q.answers.map(ans => ({
                  question_id: createdQ.id,
                  content: ans.content,
                  is_correct: !!ans.is_correct
                }))
              });
            }
          }
        }
      }
    }

    res.status(201).json({ id: courseId, message: 'Курс успешно создан' });
  } catch (err) {
    console.error('[admin create course]', err);
    res.status(500).json({ error: 'Ошибка создания курса в БД' });
  }
});

// Реальное обновление курса с каскадным обновлением связей
router.put('/courses/:id', async (req, res) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }

  const { title, description, category, image_url, is_published, lessons, tests } = req.body;

  try {
    // 1. Обновляем основные сведения курса
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        category,
        image_url,
        status: is_published ? 'ACTIVE' : 'ARCHIVED'
      }
    });

    // 2. Синхронизируем уроки (удаляем старые, пишем новые)
    await prisma.lesson.deleteMany({ where: { course_id: courseId } });
    if (lessons && Array.isArray(lessons)) {
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        await prisma.lesson.create({
          data: {
            course_id: courseId,
            title: l.title,
            type: String(l.type).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'TEXT',
            content: l.blocks ? JSON.stringify(l.blocks) : '',
            order: i + 1
          }
        });
      }
    }

    // 3. Синхронизируем тесты
    if (tests && Array.isArray(tests)) {
      const activeTestIds = [];

      for (const t of tests) {
        let testId;
        const isNewTest = !t.id || String(t.id).startsWith('t');

        if (isNewTest) {
          const createdTest = await prisma.test.create({
            data: {
              course_id: courseId,
              title: t.title || 'Финальный тест'
            }
          });
          testId = createdTest.id;
        } else {
          testId = parseInt(t.id);
          await prisma.test.update({
            where: { id: testId },
            data: { title: t.title }
          });
        }

        activeTestIds.push(testId);

        // Обновляем вопросы для этого теста: удаляем старые, записываем новые
        await prisma.question.deleteMany({ where: { test_id: testId } });

        if (t.questions && Array.isArray(t.questions)) {
          for (const q of t.questions) {
            const createdQ = await prisma.question.create({
              data: {
                test_id: testId,
                content: q.content
              }
            });

            if (q.answers && Array.isArray(q.answers)) {
              await prisma.answer.createMany({
                data: q.answers.map(ans => ({
                  question_id: createdQ.id,
                  content: ans.content,
                  is_correct: !!ans.is_correct
                }))
              });
            }
          }
        }
      }

      // Удаляем тесты, которых больше нет в курсе
      await prisma.test.deleteMany({
        where: {
          course_id: courseId,
          id: { notIn: activeTestIds }
        }
      });
    } else {
      // Если тестов не прислали вовсе — трем все тесты курса
      await prisma.test.deleteMany({ where: { course_id: courseId } });
    }

    res.json({ id: courseId, message: 'Курс успешно обновлен' });
  } catch (err) {
    console.error('[admin update course]', err);
    res.status(500).json({ error: 'Ошибка обновления курса в БД' });
  }
});

// Удаление курса
router.delete('/courses/:id', async (req, res) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }

  try {
    await prisma.course.delete({ where: { id: courseId } });
    res.json({ message: 'Курс успешно удален' });
  } catch (err) {
    console.error('[admin delete course]', err);
    res.status(500).json({ error: 'Ошибка удаления курса' });
  }
});

// ─── 3. УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (CRUD) ───────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' }
    });

    const formatted = users.map(user => {
      const parts = (user.name || '').split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      return {
        id: user.id,
        first_name,
        last_name,
        email: user.email,
        phone: '', // В схеме нет телефона, возвращаем пустоту
        role: user.role.toLowerCase(),
        position: user.position || 'Сотрудник',
        avatar_url: user.avatar_url || '',
        is_active: true,
        created_at: user.created_at
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('[admin get users]', err);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  const { first_name, last_name, email, password, role, position } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Сотрудник';

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
        position: position || 'Официант'
      }
    });

    res.status(201).json({
      id: user.id,
      first_name,
      last_name,
      email: user.email,
      role: user.role.toLowerCase(),
      position: user.position,
      avatar_url: user.avatar_url || '',
      is_active: true,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('[admin create user]', err);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  const { first_name, last_name, email, password, role, position } = req.body;
  try {
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();
    const data = {
      name: fullName,
      email,
      role: String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      position
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    res.json({
      id: user.id,
      first_name,
      last_name,
      email: user.email,
      role: user.role.toLowerCase(),
      position: user.position,
      avatar_url: user.avatar_url || '',
      is_active: true,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('[admin update user]', err);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Пользователь успешно удален' });
  } catch (err) {
    console.error('[admin delete user]', err);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// УПРАВЛЕНИЕ ДОСТИЖЕНИЯМИ (ACHIEVEMENTS)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      include: {
        course: { select: { title: true } },
        _count: { select: { users: true } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(achievements);
  } catch (err) {
    console.error('[admin get achievements]', err);
    res.status(500).json({ error: 'Ошибка загрузки достижений' });
  }
});

// POST /api/admin/achievements
router.post('/achievements', async (req, res) => {
  const { title, description, image_url, course_id } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Название достижения обязательно' });
  }

  try {
    const achievement = await prisma.achievement.create({
      data: {
        title,
        description,
        image_url,
        course_id: course_id ? parseInt(course_id) : null
      },
      include: {
        course: { select: { title: true } },
        _count: { select: { users: true } }
      }
    });
    res.status(201).json(achievement);
  } catch (err) {
    console.error('[admin create achievement]', err);
    res.status(500).json({ error: 'Ошибка создания достижения' });
  }
});

// PUT /api/admin/achievements/:id
router.put('/achievements/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, image_url, course_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Название достижения обязательно' });
  }

  try {
    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        title,
        description,
        image_url,
        course_id: course_id ? parseInt(course_id) : null
      },
      include: {
        course: { select: { title: true } },
        _count: { select: { users: true } }
      }
    });
    res.json(achievement);
  } catch (err) {
    console.error('[admin update achievement]', err);
    res.status(500).json({ error: 'Ошибка обновления достижения' });
  }
});

// DELETE /api/admin/achievements/:id
router.delete('/achievements/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.achievement.delete({ where: { id } });
    res.json({ message: 'Достижение удалено' });
  } catch (err) {
    console.error('[admin delete achievement]', err);
    res.status(500).json({ error: 'Ошибка удаления достижения' });
  }
});

// POST /api/admin/achievements/:id/grant
router.post('/achievements/:id/grant', async (req, res) => {
  const achievement_id = parseInt(req.params.id);
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Не указан user_id' });
  }

  try {
    const userAchievement = await prisma.userAchievement.upsert({
      where: {
        user_id_achievement_id: {
          user_id: parseInt(user_id),
          achievement_id
        }
      },
      update: {}, // Если уже есть, ничего не делаем
      create: {
        user_id: parseInt(user_id),
        achievement_id
      }
    });
    res.json(userAchievement);
  } catch (err) {
    console.error('[admin grant achievement]', err);
    res.status(500).json({ error: 'Ошибка выдачи достижения' });
  }
});

module.exports = router;
