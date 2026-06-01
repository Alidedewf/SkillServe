const { GoogleGenerativeAI } = require('@google/generative-ai');
const { badRequest } = require('../../common/utils/errors');

const generateCourseContent = async ({ topic, lessonsCount = 3, difficulty = 'Базовый', category = 'Сервис' }) => {
  if (!topic || !topic.trim()) {
    throw badRequest('Укажите тему курса');
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY не настроен на сервере');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  console.log(`[AI] Генерация курса по теме: "${topic}" (${lessonsCount} уроков, ${difficulty})`);

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
4. Каждый вопрос теста должен иметь ровно 4 варианты ответа, из которых только 1 правильный.
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

  const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 2000;

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let result;
  let lastError;

  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AI] Попытка ${attempt}/${MAX_RETRIES} с моделью ${modelName}`);
        result = await model.generateContent(systemPrompt);
        break; // успех — выходим из внутреннего цикла
      } catch (err) {
        lastError = err;
        const isRetryable = err.status === 503 || err.status === 429 || err.status === 500;
        if (isRetryable && attempt < MAX_RETRIES) {
          console.warn(`[AI] ${err.status} от ${modelName}, повтор через ${RETRY_DELAY_MS}мс...`);
          await sleep(RETRY_DELAY_MS * attempt);
        } else {
          break; // не ретраябельная ошибка или исчерпаны попытки — пробуем следующую модель
        }
      }
    }
    if (result) break; // успех — выходим из внешнего цикла
    console.warn(`[AI] Модель ${modelName} недоступна, переключаемся на следующую...`);
  }

  if (!result) {
    console.error('[AI] Все модели недоступны:', lastError?.message);
    throw new Error('Сервис ИИ временно недоступен. Попробуйте через несколько минут.');
  }

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
    throw new Error('ИИ вернул некорректный формат. Попробуйте ещё раз.');
  }

  // Валидируем обязательные поля
  if (!courseData.title || !courseData.lessons || !Array.isArray(courseData.lessons)) {
    throw new Error('ИИ вернул неполные данные. Попробуйте ещё раз.');
  }

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
  return courseData;
};

const generateCoverImage = async ({ title, category }) => {
  if (!title) {
    throw badRequest('Укажите название курса для генерации изображения');
  }

  const categoryImages = {
    'Сервис': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    'Кухня': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    'Бар': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    'Менеджмент': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    'Закупки': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    'Гигиена': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
  };

  const selectedImage = categoryImages[category] || categoryImages['Сервис'];
  return { image_url: selectedImage };
};

module.exports = {
  generateCourseContent,
  generateCoverImage,
};
