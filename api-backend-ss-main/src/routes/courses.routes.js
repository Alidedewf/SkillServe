const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

// GET /api/courses - все активные/доступные курсы
router.get('/', authMiddleware, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: {
          select: { id: true }
        }
      }
    });
    
    // Форматируем под ожидания фронтенда (добавляем дефолтный прогресс, если нет записи)
    const formattedCourses = await Promise.all(courses.map(async (course) => {
      const progress = await prisma.userCourseProgress.findUnique({
        where: {
          user_id_course_id: {
            user_id: req.user.id,
            course_id: course.id
          }
        }
      });
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        progress: progress ? progress.progress : 0
      };
    }));

    res.json(formattedCourses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения списка курсов из БД' });
  }
});

// GET /api/courses/in-progress
router.get('/in-progress', authMiddleware, async (req, res) => {
  try {
    const progresses = await prisma.userCourseProgress.findMany({
      where: {
        user_id: req.user.id,
        progress: { gt: 0, lt: 100 }
      },
      include: {
        course: true
      }
    });
    
    const formatted = progresses.map(p => ({
      id: p.course.id,
      title: p.course.title,
      description: p.course.description,
      category: p.course.category,
      progress: p.progress
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения курсов в процессе' });
  }
});

// GET /api/courses/new
router.get('/new', authMiddleware, async (req, res) => {
  try {
    // Получаем курсы, у которых нет прогресса или прогресс равен 0
    const allCourses = await prisma.course.findMany();
    const progresses = await prisma.userCourseProgress.findMany({
      where: { user_id: req.user.id }
    });
    
    const startedCourseIds = progresses.filter(p => p.progress > 0).map(p => p.course_id);
    const newCourses = allCourses.filter(c => !startedCourseIds.includes(c.id));
    
    const formatted = newCourses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      progress: 0
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения новых курсов' });
  }
});

// GET /api/courses/archived
router.get('/archived', authMiddleware, async (req, res) => {
  try {
    const progresses = await prisma.userCourseProgress.findMany({
      where: {
        user_id: req.user.id,
        progress: 100
      },
      include: {
        course: true
      }
    });
    
    const formatted = progresses.map(p => ({
      id: p.course.id,
      title: p.course.title,
      description: p.course.description,
      category: p.course.category,
      progress: 100
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения архива' });
  }
});

// GET /api/courses/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!course) return res.status(404).json({ error: 'Курс не найден в БД' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения курса' });
  }
});

// GET /api/courses/:id/lessons
router.get('/:id/lessons', authMiddleware, async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { course_id: parseInt(req.params.id) },
      orderBy: { id: 'asc' }
    });
    
    // В будущем тут можно вычислять completed статусы на основе связей
    const formatted = lessons.map(l => ({
      id: l.id,
      title: l.title,
      type: l.type.toLowerCase(), // 'video' или 'text'
      is_completed: false // сделаем реальным во 2 стадии
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения уроков курса' });
  }
});

// GET /api/courses/:id/tests
router.get('/:id/tests', authMiddleware, async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { course_id: parseInt(req.params.id) },
      include: {
        questions: true
      }
    });
    
    const formatted = tests.map(t => ({
      id: t.id,
      title: t.title,
      questions_count: t.questions.length,
      is_passed: false,
      score: { current: 0, max: t.questions.length }
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения тестов курса' });
  }
});

module.exports = router;
