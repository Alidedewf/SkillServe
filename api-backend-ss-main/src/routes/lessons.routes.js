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

module.exports = router;
