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

  const systemPrompt = `Ты — топовый эксперт-тренер в сфере HoReCa с 10-летним опытом управления премиальными заведениями.
Твоя задача — создать МАКСИМАЛЬНО ПОЛЕЗНЫЙ, глубокий и практичный обучающий курс по теме: "${topic}".

Параметры:
- Уровень сложности: ${difficulty}
- Количество уроков: ${lessonsCount}
- Категория: ${category}

Твои курсы должны быть без "воды", с реальными кейсами. Каждый урок должен читаться на одном дыхании и давать мощные инсайты.

ПРАВИЛА КОНТЕНТА ДЛЯ УРОКОВ (ОЧЕНЬ ВАЖНО):
1. Структура: используй короткие емкие подзаголовки. Пиши их отдельной строкой БЕЗ точки на конце (система автоматически сделает их заголовками).
2. Формат: активно используй списки, чеклисты, примеры "Как надо / Как не надо", разбор конфликтных ситуаций с гостями.
3. Глубина: каждый урок должен быть объемным (5-8 абзацев минимум), с глубоким погружением в тему и практическими советами.
4. Разделяй абзацы двойным переносом строки (\\n\\n).

ПРАВИЛА ДЛЯ ТЕСТОВ:
1. Забудь про скучные школьные вопросы (типа "Что такое X?"). Используй ТОЛЬКО сценарные вопросы.
   (Пример: "Гость жалуется на остывший стейк, ваши действия?", "Полная посадка, пришел постоянный гость без брони. Как поступим?")
2. В конце курса создай итоговый тест из ${Math.max(lessonsCount * 2, 5)} вопросов.
3. Ровно 4 варианта ответа на вопрос, только 1 правильный. Неправильные ответы должны быть реалистичными частыми ошибками, а не откровенной глупостью.

КРИТИЧЕСКИ ВАЖНО: Ответ должен быть СТРОГО в формате JSON. 
Без markdown-обёрток, без \`\`\`json, без пояснений — ТОЛЬКО чистый JSON объект.

Структура JSON:
{
  "title": "Креативное и цепляющее название курса (на русском)",
  "description": "Мощное описание курса (3-4 предложения), объясняющее какую реальную боль ресторана решит этот курс",
  "lessons": [
    {
      "title": "Название урока (интригующее)",
      "type": "text",
      "blocks": [
        { 
          "type": "text", 
          "content": "Введение в тему\\n\\nЗдесь идет мощный абзац введения...\\n\\nГлавные правила\\n\\n1. Первое правило...\\n2. Второе правило...\\n\\nКейс из реальной практики\\n\\nОписание ситуации и как ее решили...", 
          "order": 1 
        }
      ]
    }
  ],
  "tests": [
    {
      "title": "Финальный экзамен: Проверка боем",
      "questions": [
        {
          "content": "Ситуация: [описание ситуации в зале/на кухне]. Ваше действие?",
          "answers": [
            { "content": "Правильное действие, решающее проблему", "is_correct": true },
            { "content": "Частая ошибка новичка", "is_correct": false },
            { "content": "Агрессивный или пассивный вариант", "is_correct": false },
            { "content": "Игнорирование или перекладывание вины", "is_correct": false }
          ]
        }
      ]
    }
  ]
}`;

  // gemini-3.1-flash-lite: 500 RPD, 15 RPM — огромный лимит и не перегружена
  const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3-flash'];
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000; // 5 секунд между попытками для 503

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let result;
  let lastError;

  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AI] Запрос к модели ${modelName} (попытка ${attempt})...`);
        result = await model.generateContent(systemPrompt);
        break; 
      } catch (err) {
        lastError = err;
        // 429 = лимит исчерпан — сразу на следующую модель, не спамим
        if (err.status === 429) {
          console.warn(`[AI] Модель ${modelName} — лимит исчерпан, пробуем другую...`);
          break;
        }
        // 503 = сервер перегружен — ждём и пробуем ещё раз ту же модель
        if (err.status === 503 && attempt < MAX_RETRIES) {
          console.warn(`[AI] ${modelName} перегружена, ждём ${RETRY_DELAY_MS / 1000}с...`);
          await sleep(RETRY_DELAY_MS);
        } else {
          break;
        }
      }
    }
    if (result) break;
    console.warn(`[AI] Модель ${modelName} недоступна, переключаемся...`);
  }

  if (!result) {
    console.error('[AI] Все модели недоступны:', lastError?.message);
    throw new Error('Сервис ИИ временно недоступен. Попробуйте через несколько минут.');
  }

  const responseText = result.response.text();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let courseData;
  try {
    courseData = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error('[AI] Ошибка парсинга JSON от Gemini:', parseErr.message);
    throw new Error('ИИ вернул некорректный формат. Попробуйте ещё раз.');
  }

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

/**
 * Парсит текст меню ресторана и возвращает структурированный JSON массив.
 * @param {string} text - Текст меню (например, из PDF).
 * @returns {Promise<Array>} - Массив категорий с блюдами.
 */
const parseMenuTextToJSON = async (text) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY не установлен. ИИ недоступен.');
  }

  // Используем актуальную модель gemini-2.5-flash
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Ты профессиональный парсер ресторанных меню. Твоя задача извлечь информацию из переданного текста меню ресторана и вернуть ее в формате строгого JSON.
Игнорируй любой мусор, номера телефонов, адреса, рекламу.
Твоя задача вернуть ТОЛЬКО JSON-массив и ничего больше (без маркдауна, без \`\`\`json).

Формат массива, который ты должен вернуть:
[
  {
    "category": "Название категории (например: Салаты, Горячее, Напитки)",
    "items": [
      {
        "title": "Название блюда",
        "description": "Описание блюда, состав (если есть, иначе пустая строка)",
        "price": "Цена строкой (например '2500 тг', '1200', если нет - пустая строка)",
        "portion": "Граммовка/размер строкой (например '300 г', '1 шт', '0.5 л', если нет - пустая строка)"
      }
    ]
  }
]

Вот текст меню для парсинга:
--------------------------------
${text}
--------------------------------
ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON!`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Очищаем ответ от маркдауна, если Gemini всё же добавил ```json ... ```
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJson);
    return parsedData;
  } catch (error) {
    console.error('[AI Menu Parsing Error]:', error);
    throw new Error('Не удалось распарсить меню с помощью ИИ. Возможно, текст слишком сложный или невалидный JSON.');
  }
};

module.exports = {
  generateCourseContent,
  generateCoverImage,
  parseMenuTextToJSON,
};
