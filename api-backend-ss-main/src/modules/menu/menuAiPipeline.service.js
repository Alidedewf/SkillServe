/**
 * Menu AI Pipeline (in-process, fire-and-forget).
 *
 * После сохранения меню запускает фоновую генерацию обучающих материалов:
 *   Sales Guide (по блюдам) → Уроки (по категориям) → Тесты (по блюдам) → Курс.
 *
 * Переиспользует:
 *   - ai.service.generateSalesGuide / generateMenuQuiz (Gemini + ретраи)
 *   - admin.service.createCourse (LMS-движок: курс + уроки + тесты)
 *   - RestaurantSetting (статус пайплайна и id авто-курса)
 *
 * Прогресс/достижения/рейтинги работают «из коробки», т.к. курс обычный.
 */
const prisma = require('../../prisma');
const aiService = require('../ai/ai.service');
const adminService = require('../admin/admin.service');

const STATUS_KEY = 'menu_ai_status';
const COURSE_KEY = 'menu_course_id';
const COURSE_TITLE = 'Продажи по меню';
const COURSE_DESCRIPTION = 'Автоматически созданный курс на основе меню ресторана.';

// ─── RestaurantSetting helpers ──────────────────────────────────────
const setSetting = (restaurant_id, key, value) =>
  prisma.restaurantSetting.upsert({
    where: { restaurant_id_key: { restaurant_id, key } },
    update: { value },
    create: { restaurant_id, key, value },
  });

const getSetting = async (restaurant_id, key) => {
  const s = await prisma.restaurantSetting.findUnique({
    where: { restaurant_id_key: { restaurant_id, key } },
  });
  return s ? s.value : null;
};

const setStatus = (restaurantId, status) =>
  setSetting(restaurantId, STATUS_KEY, JSON.stringify(status)).catch(() => {});

const getStatus = async (restaurantId) => {
  const v = await getSetting(restaurantId, STATUS_KEY);
  try {
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

const ACTIVE_STAGES = ['parsing_menu', 'generating_sales_guide', 'creating_training', 'creating_quizzes'];

// Идёт ли сейчас генерация? «Протухший» статус (>15 мин, завис из-за рестарта)
// активным НЕ считаем — иначе кнопка залипнет навсегда.
const isRunning = async (restaurantId) => {
  const s = await getStatus(restaurantId);
  if (!s || !ACTIVE_STAGES.includes(s.stage)) return false;
  return !!(s.startedAt && Date.now() - new Date(s.startedAt).getTime() < 15 * 60 * 1000);
};

// ─── Детерминированная сборка уроков (без AI) ───────────────────────
const dishLessonText = (d) => {
  const g = d.sales_guide && d.sales_guide.status === 'ok' ? d.sales_guide : null;
  const parts = [];
  parts.push(d.title); // короткая строка → заголовок во вьюере урока
  const meta = [d.price, d.portion].filter(Boolean).join(' · ');
  if (meta) parts.push(meta);
  if (d.description) parts.push(d.description);
  if (g) {
    if (g.sellingPhrase) parts.push('Как презентовать', g.sellingPhrase);
    const sell = [];
    if (g.upsell) sell.push(`Допродажа: ${g.upsell}`);
    if (g.crossSell) sell.push(`Сочетается: ${g.crossSell}`);
    if (g.premiumOffer) sell.push(`Премиум: ${g.premiumOffer}`);
    if (sell.length) parts.push('Продажа', sell.join('\n'));
    if (Array.isArray(g.keyAdvantages) && g.keyAdvantages.length) {
      parts.push('Преимущества', g.keyAdvantages.map((a) => `• ${a}`).join('\n'));
    }
    if (Array.isArray(g.guestQuestions) && g.guestQuestions.length) {
      const qa = g.guestQuestions
        .map((q, i) => `Гость: ${q}\nОфициант: ${(g.guestAnswers && g.guestAnswers[i]) || ''}`)
        .join('\n\n');
      parts.push('Вопросы гостей', qa);
    }
  }
  return parts.join('\n\n');
};

const buildCategoryLesson = (categoryName, dishes) => {
  const blocks = [];
  let order = 1;
  blocks.push({
    type: 'text',
    content: `${categoryName}\n\nКак продавать блюда категории «${categoryName}»: презентация, допродажа и ответы гостям.`,
    order: order++,
  });
  for (const d of dishes) {
    if (d.image_url) blocks.push({ type: 'image', content: d.image_url, order: order++ });
    blocks.push({ type: 'text', content: dishLessonText(d), order: order++ });
  }
  return { title: categoryName, type: 'text', blocks };
};

// ─── Сборка и сохранение курса (уроки + тесты) ──────────────────────
const buildAndSaveCourse = async (restaurantId, categories, status) => {
  // Уроки — детерминированно из меню + sales guide
  status.stage = 'creating_training';
  await setStatus(restaurantId, status);
  const lessons = categories
    .filter((c) => c.items.length > 0)
    .map((c) => buildCategoryLesson(c.name, c.items));
  status.lessons = lessons.length;

  // Тесты — AI, один тест на категорию
  status.stage = 'creating_quizzes';
  await setStatus(restaurantId, status);
  const tests = [];
  for (const c of categories) {
    if (c.items.length === 0) continue;
    try {
      const qs = await aiService.generateMenuQuiz(
        c.items.map((d) => ({ title: d.title, description: d.description, guide: d.sales_guide }))
      );
      if (qs.length > 0) {
        tests.push({ title: `Тест: ${c.name}`, questions: qs });
        status.questions += qs.length;
      }
    } catch (err) {
      status.errors.push(`Тест категории «${c.name}»: ${err.message}`);
    }
  }
  status.tests = tests.length;
  await setStatus(restaurantId, status);

  // Пересоздаём авто-курс. Удаляем ВСЕ прежние авто-курсы «Продажи по меню»
  // (а не только тот, что в menu_course_id) — защита от дублей при гонке.
  await prisma.course.deleteMany({ where: { restaurant_id: restaurantId, title: COURSE_TITLE } });
  const course = await adminService.createCourse(restaurantId, {
    title: COURSE_TITLE,
    description: COURSE_DESCRIPTION,
    category: 'Продажи',
    is_published: true,
    lessons,
    tests,
  });
  status.courseId = course.id;
  await setSetting(restaurantId, COURSE_KEY, String(course.id));
  return course.id;
};

// ─── Главный пайплайн ───────────────────────────────────────────────
const runMenuAiPipeline = async (restaurantId) => {
  const t0 = Date.now();
  const status = {
    stage: 'generating_sales_guide',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalDishes: 0,
    processedDishes: 0,
    salesGuidesOk: 0,
    salesGuidesFailed: 0,
    lessons: 0,
    tests: 0,
    questions: 0,
    errors: [],
    regenCount: 0,
    courseId: null,
    durationMs: 0,
  };

  try {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { order: 'asc' },
      include: { items: true },
    });
    const allItems = categories.flatMap((c) => c.items.map((it) => ({ ...it, category: c.name })));
    status.totalDishes = allItems.length;
    await setStatus(restaurantId, status);

    if (allItems.length === 0) {
      status.stage = 'ready';
      return;
    }

    // 1) Sales Guide
    const guides = await aiService.generateSalesGuide(
      allItems.map((d) => ({
        title: d.title,
        description: d.description,
        price: d.price,
        portion: d.portion,
        category: d.category,
      }))
    );

    for (let i = 0; i < allItems.length; i++) {
      const g = guides[i] || { title: allItems[i].title, status: 'failed' };
      try {
        await prisma.menuItem.update({ where: { id: allItems[i].id }, data: { sales_guide: g } });
      } catch (err) {
        status.errors.push(`Sales Guide «${allItems[i].title}»: ${err.message}`);
      }
      allItems[i].sales_guide = g;
      status.processedDishes = i + 1;
      if (g.status === 'ok') status.salesGuidesOk++;
      else status.salesGuidesFailed++;
    }
    // Прокидываем sales_guide обратно в categories.items для сборки курса
    const itemsById = new Map(allItems.map((d) => [d.id, d]));
    categories.forEach((c) => {
      c.items = c.items.map((it) => itemsById.get(it.id) || it);
    });
    await setStatus(restaurantId, status);

    // 2-4) Уроки + Тесты + Курс
    await buildAndSaveCourse(restaurantId, categories, status);

    status.stage = 'ready';
  } catch (err) {
    status.stage = 'failed';
    status.errors.push(err.message);
    console.error('[MenuAiPipeline] FATAL:', err);
  } finally {
    status.finishedAt = new Date().toISOString();
    status.durationMs = Date.now() - t0;
    await setStatus(restaurantId, status);
    console.log(
      `[MenuAiPipeline] restaurant=${restaurantId} stage=${status.stage} dishes=${status.totalDishes} salesOk=${status.salesGuidesOk} salesFailed=${status.salesGuidesFailed} lessons=${status.lessons} tests=${status.tests} questions=${status.questions} regen=${status.regenCount} duration=${status.durationMs}ms errors=${status.errors.length}`
    );
  }
};

/**
 * Запуск пайплайна в фоне (не блокирует HTTP-ответ).
 */
const startMenuAiPipeline = (restaurantId) => {
  setImmediate(() => {
    runMenuAiPipeline(restaurantId).catch((err) =>
      console.error('[MenuAiPipeline] unhandled:', err)
    );
  });
};

// ─── Повторная генерация ────────────────────────────────────────────
/**
 * Перегенерация Sales Guide одного блюда (синхронно — один AI-вызов).
 */
const regenerateDishSalesGuide = async (restaurantId, itemId) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: true },
  });
  if (!item || item.category.restaurant_id !== restaurantId) {
    const { notFound } = require('../../common/utils/errors');
    throw notFound('Позиция меню');
  }
  const [guide] = await aiService.generateSalesGuide([
    {
      title: item.title,
      description: item.description,
      price: item.price,
      portion: item.portion,
      category: item.category.name,
    },
  ]);
  await prisma.menuItem.update({ where: { id: itemId }, data: { sales_guide: guide } });

  // Учитываем повторную генерацию в статусе
  const status = (await getStatus(restaurantId)) || {};
  status.regenCount = (status.regenCount || 0) + 1;
  await setStatus(restaurantId, status);

  return guide;
};

/**
 * Перегенерация курса по уже сохранённым Sales Guide (в фоне).
 */
const startRegenerateCourse = (restaurantId) => {
  setImmediate(async () => {
    const t0 = Date.now();
    const status = (await getStatus(restaurantId)) || {
      errors: [],
      questions: 0,
      regenCount: 0,
    };
    status.errors = [];
    status.questions = 0;
    status.regenCount = (status.regenCount || 0) + 1;
    try {
      const categories = await prisma.menuCategory.findMany({
        where: { restaurant_id: restaurantId },
        orderBy: { order: 'asc' },
        include: { items: true },
      });
      await buildAndSaveCourse(restaurantId, categories, status);
      status.stage = 'ready';
    } catch (err) {
      status.stage = 'failed';
      status.errors.push(err.message);
      console.error('[MenuAiPipeline] regenerateCourse FATAL:', err);
    } finally {
      status.finishedAt = new Date().toISOString();
      status.durationMs = Date.now() - t0;
      await setStatus(restaurantId, status);
      console.log(`[MenuAiPipeline] regenerateCourse restaurant=${restaurantId} stage=${status.stage} tests=${status.tests} questions=${status.questions}`);
    }
  });
};

module.exports = {
  runMenuAiPipeline,
  startMenuAiPipeline,
  getStatus,
  isRunning,
  regenerateDishSalesGuide,
  startRegenerateCourse,
};
