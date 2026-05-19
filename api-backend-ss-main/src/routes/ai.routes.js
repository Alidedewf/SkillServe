const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth.middleware');

// Проверка прав админа
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  next();
};

router.use(authMiddleware, adminMiddleware);

// ─── 1. ГЕНЕРАЦИЯ СТРУКТУРЫ КУРСА ────────────────────────────────────────────
// POST /api/admin/ai/generate-course
router.post('/generate-course', async (req, res) => {
  const { topic, lessonsCount = 3, difficulty = 'Базовый', category = 'Сервис' } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Укажите тему курса' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY не настроен на сервере' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Ты — эксперт по обучению персонала в сфере HoReCa (гостиницы, рестораны, кафе, бары).
Создай обучающий курс по теме: "${topic}".

Параметры:
- Уровень сложности: ${difficulty}
- Количество уроков: ${lessonsCount}
- Категория: ${category}

Требования к контенту:
1. Каждый урок должен содержать минимум 3-4 абзаца полезного, практического текста.
2. Текст должен быть написан простым, понятным языком для сотрудников ресторана/кафе.
3. В конце курса должен быть итоговый тест с ${Math.max(lessonsCount * 2, 5)} вопросами.
4. Каждый вопрос теста должен иметь ровно 4 варианта ответа, из которых только 1 правильный.
5. Вопросы теста должны проверять знания из уроков.

КРИТИЧЕСКИ ВАЖНО: Ответ должен быть СТРОГО в формате JSON. 
Без markdown-обёрток, без \`\`\`json, без пояснений — ТОЛЬКО чистый JSON объект.

Структура JSON:
{
  "title": "Название курса на русском языке",
  "description": "Описание курса (2-3 предложения, кратко и по делу)",
  "lessons": [
    {
      "title": "Название урока",
      "type": "text",
      "blocks": [
        { "type": "text", "content": "Полный текст урока (минимум 3-4 абзаца через \\n\\n)", "order": 1 }
      ]
    }
  ],
  "tests": [
    {
      "title": "Итоговый тест",
      "questions": [
        {
          "content": "Текст вопроса",
          "answers": [
            { "content": "Правильный ответ", "is_correct": true },
            { "content": "Неправильный ответ 1", "is_correct": false },
            { "content": "Неправильный ответ 2", "is_correct": false },
            { "content": "Неправильный ответ 3", "is_correct": false }
          ]
        }
      ]
    }
  ]
}`;

    console.log(`[AI] Генерация курса по теме: "${topic}" (${lessonsCount} уроков, ${difficulty})`);

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Пытаемся извлечь JSON из ответа (Gemini иногда обёртывает в ```json)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Парсим JSON
    let courseData;
    try {
      courseData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[AI] Ошибка парсинга JSON от Gemini:', parseErr.message);
      console.error('[AI] Raw response:', responseText.substring(0, 500));
      return res.status(500).json({
        error: 'ИИ вернул некорректный формат. Попробуйте ещё раз.',
        raw: responseText.substring(0, 300)
      });
    }

    // Валидируем обязательные поля
    if (!courseData.title || !courseData.lessons || !Array.isArray(courseData.lessons)) {
      return res.status(500).json({
        error: 'ИИ вернул неполные данные. Попробуйте ещё раз.',
      });
    }

    // Добавляем category если не вернул
    courseData.category = courseData.category || category;

    // Нормализуем блоки уроков — добавляем id и order для фронтенда
    courseData.lessons = courseData.lessons.map((lesson, i) => ({
      ...lesson,
      id: `lesson-ai-${Date.now()}-${i}`,
      order: i + 1,
      type: lesson.type || 'text',
      blocks: (lesson.blocks || []).map((block, j) => ({
        ...block,
        id: `block-ai-${Date.now()}-${i}-${j}`,
        type: block.type || 'text',
        order: j + 1,
      })),
    }));

    // Нормализуем тесты
    courseData.tests = (courseData.tests || []).map((test, i) => ({
      ...test,
      id: `test-ai-${Date.now()}-${i}`,
      questions: (test.questions || []).map((q, j) => ({
        ...q,
        id: `q-ai-${Date.now()}-${i}-${j}`,
        answers: (q.answers || []).map((a, k) => ({
          ...a,
          id: `a-ai-${Date.now()}-${i}-${j}-${k}`,
        })),
      })),
    }));

    console.log(`[AI] Курс "${courseData.title}" сгенерирован: ${courseData.lessons.length} уроков, ${courseData.tests.length} тестов`);

    res.json(courseData);
  } catch (err) {
    console.error('[AI] Ошибка генерации:', err);
    res.status(500).json({ error: `Ошибка генерации курса: ${err.message}` });
  }
});

// ─── 2. ГЕНЕРАЦИЯ ОБЛОЖКИ КУРСА ──────────────────────────────────────────────
// POST /api/admin/ai/generate-image
router.post('/generate-image', async (req, res) => {
  const { title, category, type = 'cover' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Укажите название курса для генерации изображения' });
  }

  try {
    // Используем Unsplash Source — надёжный и бесплатный
    // Генерируем ключевые слова из названия для поиска
    const keywords = encodeURIComponent(
      (category || 'restaurant') + ' ' + title.split(' ').slice(0, 3).join(' ')
    );
    
    const imageUrl = `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80`;
    
    // Подбираем тематическое фото по категории
    const categoryImages = {
      'Сервис': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      'Кухня': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
      'Бар': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      'Менеджмент': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      'Закупки': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
      'Гигиена': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
    };

    const selectedImage = categoryImages[category] || categoryImages['Сервис'];

    console.log(`[AI] Обложка подобрана (${type}) для: "${title}" [${category}]`);
    return res.json({ image_url: selectedImage });

  } catch (err) {
    console.error('[AI] Ошибка подбора обложки:', err.message);
    return res.json({ image_url: '', fallback: true, error: err.message });
  }
});

module.exports = router;
