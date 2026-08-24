const { GoogleGenerativeAI } = require('@google/generative-ai');
const { badRequest, AppError } = require('../../common/utils/errors');

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
    throw new AppError('Сервис ИИ временно недоступен. Попробуйте через несколько минут.', 503);
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
    throw new AppError('ИИ вернул некорректный формат. Попробуйте ещё раз.', 502);
  }

  if (!courseData.title || !courseData.lessons || !Array.isArray(courseData.lessons)) {
    throw new AppError('ИИ вернул неполные данные. Попробуйте ещё раз.', 502);
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
    throw new AppError('Не удалось распарсить меню с помощью ИИ. Возможно, текст слишком сложный или невалидный JSON.', 502);
  }
};

// ─────────────────────────────────────────────────────────────────────
// ОБЩИЕ ХЕЛПЕРЫ ДЛЯ MENU AI PIPELINE
// ─────────────────────────────────────────────────────────────────────

/**
 * Вызов Gemini с фолбэком по моделям и ретраями на 503 (тот же подход,
 * что и в generateCourseContent). Возвращает сырой текст ответа.
 */
const callGeminiText = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('Сервис ИИ недоступен (не настроен ключ).', 503);
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 4000;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let lastError;
  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
        if (err.status === 429) break; // лимит исчерпан — следующая модель
        if (err.status === 503 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        break;
      }
    }
  }
  console.error('[AI] Все модели недоступны:', lastError?.message);
  throw new AppError('Сервис ИИ временно недоступен.', 503);
};

/**
 * Строгий парсинг JSON из ответа модели: срезает markdown-обёртки и мусор
 * до первого [ или {. Бросает при невалидном JSON (для ретраев выше).
 */
const parseStrictJSON = (text) => {
  let s = String(text || '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) s = fenced[1].trim();
  const start = s.search(/[[{]/);
  if (start > 0) s = s.slice(start);
  const lastArr = s.lastIndexOf(']');
  const lastObj = s.lastIndexOf('}');
  const end = Math.max(lastArr, lastObj);
  if (end !== -1) s = s.slice(0, end + 1);
  return JSON.parse(s);
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Генерация Sales Guide для блюд. Строго по текущему меню — апселл/кросс-селл
 * только из переданного списка блюд. Возвращает массив, выровненный по входу:
 * { title, sellingPhrase, upsell, crossSell, premiumOffer, guestQuestions[],
 *   guestAnswers[], keyAdvantages[], status: 'ok' | 'failed' }
 */
const generateSalesGuide = async (dishes) => {
  const allTitles = dishes.map((d) => d.title);
  const SIZE = 12;
  const MAX_RETRIES = 2;
  const results = new Array(dishes.length).fill(null);

  const batches = chunk(dishes.map((d, i) => ({ ...d, _idx: i })), SIZE);

  for (const batch of batches) {
    const prompt = `Ты — эксперт по продажам в ресторане (HoReCa). Составь "шпаргалку продаж" (Sales Guide) для официанта по КАЖДОМУ блюду из списка ниже.

КРИТИЧЕСКИ ВАЖНО:
- Опирайся ТОЛЬКО на эти блюда. Для upsell/crossSell/premiumOffer ссылайся ИСКЛЮЧИТЕЛЬНО на блюда из общего меню ресторана (список ниже). НЕ придумывай блюда, которых нет в меню. Если подходящего блюда нет — верни пустую строку.
- Ответ строго в формате JSON-массива, БЕЗ markdown, БЕЗ пояснений.

Общее меню ресторана (допустимые блюда для рекомендаций): ${JSON.stringify(allTitles)}

Блюда для генерации (верни массив в ТОМ ЖЕ порядке и количестве):
${JSON.stringify(batch.map((d) => ({ title: d.title, description: d.description || '', price: d.price || '', category: d.category || '' })))}

Структура каждого элемента массива:
{
  "title": "точное название блюда как во входе",
  "sellingPhrase": "как вкусно презентовать блюдо гостю (1-2 предложения)",
  "upsell": "что предложить дороже/больше из меню (или пустая строка)",
  "crossSell": "что хорошо сочетается из меню (или пустая строка)",
  "premiumOffer": "более премиальная альтернатива из меню (или пустая строка)",
  "guestQuestions": ["частый вопрос гостя 1", "вопрос 2"],
  "guestAnswers": ["ответ на вопрос 1", "ответ на вопрос 2"],
  "keyAdvantages": ["преимущество 1", "преимущество 2", "преимущество 3"]
}
ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON-МАССИВ.`;

    let parsed = null;
    for (let attempt = 1; attempt <= MAX_RETRIES && !parsed; attempt++) {
      try {
        const text = await callGeminiText(prompt);
        const arr = parseStrictJSON(text);
        if (Array.isArray(arr) && arr.length > 0) parsed = arr;
      } catch (err) {
        console.warn(`[AI SalesGuide] batch попытка ${attempt} неуспешна:`, err.message);
      }
    }

    batch.forEach((dish, j) => {
      const g = parsed
        ? parsed.find((x) => String(x.title).trim().toLowerCase() === dish.title.trim().toLowerCase()) || parsed[j]
        : null;
      results[dish._idx] = g
        ? {
            title: dish.title,
            sellingPhrase: g.sellingPhrase || '',
            upsell: g.upsell || '',
            crossSell: g.crossSell || '',
            premiumOffer: g.premiumOffer || '',
            guestQuestions: Array.isArray(g.guestQuestions) ? g.guestQuestions : [],
            guestAnswers: Array.isArray(g.guestAnswers) ? g.guestAnswers : [],
            keyAdvantages: Array.isArray(g.keyAdvantages) ? g.keyAdvantages : [],
            status: 'ok',
          }
        : { title: dish.title, status: 'failed' };
    });
  }

  return results;
};

/**
 * Генерация вопросов теста по блюдам (≥3 на блюдо), разные типы:
 * SINGLE | MULTIPLE | TRUE_FALSE | SCENARIO. Возвращает плоский массив
 * вопросов в формате createCourse: { content, type, answers:[{content,is_correct}] }.
 * Блюда, по которым не удалось — пропускаются (изоляция ошибок).
 */
const generateMenuQuiz = async (dishes) => {
  const SIZE = 8;
  const MAX_RETRIES = 2;
  const questions = [];
  const batches = chunk(dishes, SIZE);

  for (const batch of batches) {
    const prompt = `Ты — тренер по продажам в ресторане. Составь тестовые вопросы для проверки официантов по КАЖДОМУ блюду ниже. Минимум 3 вопроса на блюдо.

Используй разные типы вопросов:
- "SINGLE" — один правильный ответ (4 варианта, 1 верный)
- "MULTIPLE" — несколько правильных (4 варианта, 2-3 верных)
- "TRUE_FALSE" — утверждение (2 варианта: Верно/Неверно, 1 верный)
- "SCENARIO" — ситуация в зале + выбор действия (4 варианта, 1 верный)

Вопросы — практические: что предложить к блюду (upsell/cross-sell), как презентовать, преимущества, ответ гостю.

Ответ СТРОГО в JSON-массиве, БЕЗ markdown. Структура:
[
  {
    "dishTitle": "точное название блюда",
    "questions": [
      {
        "content": "текст вопроса",
        "type": "SINGLE | MULTIPLE | TRUE_FALSE | SCENARIO",
        "answers": [ { "content": "вариант", "is_correct": true|false } ]
      }
    ]
  }
]

Блюда (с подсказками из Sales Guide):
${JSON.stringify(batch.map((d) => ({ title: d.title, description: d.description || '', guide: d.guide || null })))}
ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON-МАССИВ.`;

    let parsed = null;
    for (let attempt = 1; attempt <= MAX_RETRIES && !parsed; attempt++) {
      try {
        const text = await callGeminiText(prompt);
        const arr = parseStrictJSON(text);
        if (Array.isArray(arr) && arr.length > 0) parsed = arr;
      } catch (err) {
        console.warn(`[AI Quiz] batch попытка ${attempt} неуспешна:`, err.message);
      }
    }
    if (!parsed) continue;

    for (const dishBlock of parsed) {
      const qs = Array.isArray(dishBlock.questions) ? dishBlock.questions : [];
      for (const q of qs) {
        const answers = Array.isArray(q.answers)
          ? q.answers
              .filter((a) => a && a.content)
              .map((a) => ({ content: String(a.content), is_correct: !!a.is_correct }))
          : [];
        const correctCount = answers.filter((a) => a.is_correct).length;
        // Валидация: минимум 2 варианта и хотя бы 1 верный
        if (!q.content || answers.length < 2 || correctCount < 1) continue;
        const type = ['SINGLE', 'MULTIPLE', 'TRUE_FALSE', 'SCENARIO'].includes(q.type) ? q.type : 'SINGLE';
        questions.push({ content: String(q.content), type, answers });
      }
    }
  }

  return questions;
};

module.exports = {
  generateCourseContent,
  generateCoverImage,
  parseMenuTextToJSON,
  callGeminiText,
  parseStrictJSON,
  generateSalesGuide,
  generateMenuQuiz,
};
