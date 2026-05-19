const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

// GET /api/lessons/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден в БД' });
    }

    // ─── Трекинг прогресса: отмечаем что юзер открыл урок ──────────
    try {
      // Считаем общее кол-во уроков в курсе
      const totalLessons = await prisma.lesson.count({
        where: { course_id: lesson.course_id }
      });

      // Получаем текущий прогресс (или создаём)
      const existing = await prisma.userCourseProgress.findUnique({
        where: {
          user_id_course_id: {
            user_id: req.user.id,
            course_id: lesson.course_id
          }
        }
      });

      // Храним список просмотренных уроков в поле progress как процент
      // При каждом открытии урока увеличиваем прогресс
      const currentProgress = existing ? existing.progress : 0;
      const stepPerLesson = totalLessons > 0 ? (100 / totalLessons) : 100;
      const newProgress = Math.min(
        currentProgress + (currentProgress === 0 ? stepPerLesson : 0),
        99 // до 100 доводим только после теста
      );

      await prisma.userCourseProgress.upsert({
        where: {
          user_id_course_id: {
            user_id: req.user.id,
            course_id: lesson.course_id
          }
        },
        create: {
          user_id: req.user.id,
          course_id: lesson.course_id,
          progress: stepPerLesson,
          status: 'IN_PROGRESS'
        },
        update: {
          // Только если NOT_STARTED — переводим в IN_PROGRESS
          status: 'IN_PROGRESS',
          progress: existing && existing.progress > 0
            ? existing.progress  // уже считали — не перезаписываем
            : stepPerLesson
        }
      });
    } catch (progressErr) {
      // Не блокируем отдачу урока, если трекинг упал
      console.error('[Progress] Ошибка трекинга:', progressErr.message);
    }

    // Декодируем блоки из JSON-строки в базе
    let blocks = [];
    try {
      blocks = JSON.parse(lesson.content);
    } catch (e) {
      // Если там просто текст, оборачиваем в один блок
      blocks = [{ order: 1, type: 'text', content: lesson.content }];
    }

    res.json({
      id: lesson.id,
      title: lesson.title,
      blocks: blocks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения урока из БД' });
  }
});

// POST /api/lessons/:id/complete — юзер завершил урок
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });
    if (!lesson) return res.status(404).json({ error: 'Урок не найден' });

    // 1. Помечаем урок как завершённый (upsert — идемпотентно)
    await prisma.userLessonProgress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: req.user.id,
          lesson_id: lessonId
        }
      },
      create: {
        user_id: req.user.id,
        lesson_id: lessonId
      },
      update: {}
    });

    // 2. Считаем реальный прогресс курса
    const totalLessons = await prisma.lesson.count({
      where: { course_id: lesson.course_id }
    });

    const completedLessons = await prisma.userLessonProgress.count({
      where: {
        user_id: req.user.id,
        lesson: { course_id: lesson.course_id }
      }
    });

    const progress = totalLessons > 0
      ? Math.min(Math.round((completedLessons / totalLessons) * 100), 99)
      : 0;

    // 3. Обновляем общий прогресс курса
    const updated = await prisma.userCourseProgress.upsert({
      where: {
        user_id_course_id: {
          user_id: req.user.id,
          course_id: lesson.course_id
        }
      },
      create: {
        user_id: req.user.id,
        course_id: lesson.course_id,
        progress,
        status: 'IN_PROGRESS'
      },
      update: {
        progress,
        status: 'IN_PROGRESS'
      }
    });

    res.json({
      progress: updated.progress,
      status: updated.status,
      completedLessons,
      totalLessons
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления прогресса' });
  }
});

module.exports = router;
