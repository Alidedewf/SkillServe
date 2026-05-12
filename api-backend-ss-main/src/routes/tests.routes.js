const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

// GET /api/tests/:id - Запуск теста (загрузка вопросов без флага правильности ответов)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        questions: {
          include: {
            answers: {
              select: {
                id: true,
                content: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Тест не найден в базе данных' });
    }

    res.json(test);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения теста из БД' });
  }
});

// POST /api/tests/:id/submit - Проверка результатов теста на бэкенде
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const { answers } = req.body; // Ожидаем { answers: [ { question_id, answer_id } ] }
  const testId = parseInt(req.params.id);

  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Тест не найден в базе данных' });
    }

    let correct_count = 0;
    const questionsResult = test.questions.map(q => {
      // Ищем ответ пользователя на этот вопрос
      const userAnswer = answers && answers.find(a => parseInt(a.question_id) === q.id);
      
      // Ищем правильный ответ в БД
      const correctAnswer = q.answers.find(ans => ans.is_correct);
      
      const is_correct = userAnswer && parseInt(userAnswer.answer_id) === correctAnswer.id;
      if (is_correct) correct_count++;

      return {
        id: q.id,
        content: q.content,
        is_correct: !!is_correct
      };
    });

    // Сохраняем попытку сдачи в базу
    const scorePct = Math.round((correct_count / test.questions.length) * 100);
    const isPassed = scorePct >= 70; // Проходной балл 70%

    await prisma.testAttempt.create({
      data: {
        user_id: req.user.id,
        test_id: testId,
        correct_count: correct_count,
        total_questions: test.questions.length
      }
    });

    // Если тест сдан, можно обновить прогресс по курсу
    // Во 2 фазе сделаем автоматический пересчет прогресса курса

    res.json({
      correct_count,
      total_questions: test.questions.length,
      ranking: correct_count === test.questions.length ? 1 : Math.floor(Math.random() * 5) + 2,
      coins: correct_count * 10,
      test: {
        questions: questionsResult
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обработки результатов теста' });
  }
});

module.exports = router;
