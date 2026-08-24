const prisma = require('../../prisma');
const { notFound, badRequest } = require('../../common/utils/errors');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { parseMenuTextToJSON } = require('../ai/ai.service');
const menuAiPipeline = require('./menuAiPipeline.service');

const getMenu = async (userId, restaurantId) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { position: true },
  });
  const userPosition = dbUser?.position?.name || '';

  // Получаем PDF ресторана
  let pdfUrl = null;
  if (restaurantId) {
    const pdfSetting = await prisma.restaurantSetting.findUnique({
      where: {
        restaurant_id_key: {
          restaurant_id: restaurantId,
          key: 'menu_pdf_url',
        },
      },
    });
    pdfUrl = pdfSetting ? pdfSetting.value : null;
  }

  // Получаем категории
  const categories = restaurantId
    ? await prisma.menuCategory.findMany({
        where: { restaurant_id: restaurantId },
        orderBy: { order: 'asc' },
        include: {
          items: true,
        },
      })
    : [];

  // Фильтруем блюда по должности (если visible_to пустой — видят все, иначе только те, у кого должность совпадает)
  const filteredCategories = categories
    .map((cat) => {
      const filteredItems = cat.items.filter((item) => {
        if (!item.visible_to || item.visible_to.length === 0) return true;
        return item.visible_to.includes(userPosition);
      });
      return { ...cat, items: filteredItems };
    })
    .filter((cat) => cat.items.length > 0);

  return {
    pdf_url: pdfUrl,
    categories: filteredCategories,
  };
};

const adminGetCategories = async (restaurantId) => {
  if (!restaurantId) return [];
  return prisma.menuCategory.findMany({
    where: { restaurant_id: restaurantId },
    orderBy: { order: 'asc' },
    include: { items: true },
  });
};

const adminCreateCategory = async (restaurantId, { name, order = 0 }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  if (!name) throw badRequest('Название категории обязательно');

  return prisma.menuCategory.create({
    data: {
      restaurant_id: restaurantId,
      name,
      order,
    },
  });
};

const adminDeleteCategory = async (restaurantId, categoryId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId }
  });

  if (!category || category.restaurant_id !== restaurantId) {
    throw notFound('Категория меню');
  }

  await prisma.menuCategory.delete({ where: { id: categoryId } });
  return { message: 'Категория удалена' };
};

const adminCreateItem = async (restaurantId, { category_id, title, description, price, portion, image_url, visible_to, sales_guide }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  if (!category_id || !title) throw badRequest('Категория и название обязательны');

  // Убеждаемся, что категория принадлежит ресторану
  const category = await prisma.menuCategory.findFirst({
    where: { id: category_id, restaurant_id: restaurantId },
  });
  if (!category) throw notFound('Категория');

  return prisma.menuItem.create({
    data: {
      category_id,
      title,
      description,
      price,
      portion,
      image_url,
      visible_to: visible_to || [],
      sales_guide: sales_guide || undefined,
    },
  });
};

const adminUpdateItem = async (restaurantId, itemId, { category_id, title, description, price, portion, image_url, visible_to, sales_guide }) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: true },
  });

  if (!item || (restaurantId && item.category.restaurant_id !== restaurantId)) {
    throw notFound('Позиция меню');
  }

  const data = {
    title,
    description,
    price,
    portion,
    image_url,
    visible_to: visible_to !== undefined ? visible_to : undefined,
    sales_guide: sales_guide !== undefined ? sales_guide : undefined,
  };

  if (category_id !== undefined) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: category_id, restaurant_id: restaurantId },
    });
    if (!category) throw notFound('Указанная категория');
    data.category_id = category_id;
  }

  return prisma.menuItem.update({
    where: { id: itemId },
    data,
  });
};

const adminDeleteItem = async (restaurantId, itemId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: true },
  });

  if (!item || (restaurantId && item.category.restaurant_id !== restaurantId)) {
    throw notFound('Позиция меню');
  }

  await prisma.menuItem.delete({ where: { id: itemId } });
  return { message: 'Позиция удалена' };
};

const adminUploadPdf = async (restaurantId, fileBuffer) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');

  let pdfText = '';
  try {
    const pdfData = await pdfParse(fileBuffer);
    pdfText = pdfData.text;
  } catch (err) {
    console.error('Ошибка чтения PDF:', err);
    throw badRequest('Не удалось прочитать загруженный PDF файл.');
  }

  let menuData = [];
  try {
    menuData = await parseMenuTextToJSON(pdfText);
  } catch (err) {
    console.error('Ошибка Gemini:', err);
    throw badRequest(err.message);
  }

  // Просто возвращаем распознанные данные на фронтенд (без сохранения в БД)
  return { 
    message: 'PDF успешно проанализирован', 
    parsedMenu: menuData
  };
};

const adminConfirmParsedMenu = async (restaurantId, menuData) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  if (!menuData || !Array.isArray(menuData)) throw badRequest('Некорректные данные меню');

  // Сохраняем меню за 3 запроса (вместо 2N+1), чтобы уверенно укладываться
  // в таймаут даже на больших меню (300+ блюд) при высокой латентности БД.
  await prisma.$transaction(async (tx) => {
    await tx.menuCategory.deleteMany({ where: { restaurant_id: restaurantId } });

    // Все категории одним запросом; order = индекс в menuData (для сопоставления).
    const createdCats = await tx.menuCategory.createManyAndReturn({
      data: menuData.map((cat, i) => ({
        restaurant_id: restaurantId,
        name: cat.category || 'Без категории',
        order: i,
      })),
    });
    const catIdByOrder = new Map(createdCats.map((c) => [c.order, c.id]));

    // Все блюда одним createMany.
    const allItems = [];
    menuData.forEach((cat, i) => {
      const categoryId = catIdByOrder.get(i);
      if (categoryId == null || !Array.isArray(cat.items)) return;
      for (const item of cat.items) {
        allItems.push({
          category_id: categoryId,
          title: item.title || 'Без названия',
          description: item.description || null,
          price: item.price ? String(item.price) : null,
          portion: item.portion ? String(item.portion) : null,
          visible_to: [],
        });
      }
    });

    if (allItems.length > 0) {
      await tx.menuItem.createMany({ data: allItems });
    }
  }, { maxWait: 15000, timeout: 60000 });

  // Генерация обучения НЕ запускается автоматически — только вручную
  // (кнопка «Сгенерировать обучение» → /generate-training).
  return { message: 'Меню успешно сохранено' };
};

// ─── AI Pipeline (статус и повторная генерация) ─────────────────────
const getAiStatus = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  return (await menuAiPipeline.getStatus(restaurantId)) || { stage: 'idle' };
};

const regenerateSalesGuide = async (restaurantId, itemId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  const guide = await menuAiPipeline.regenerateDishSalesGuide(restaurantId, itemId);
  return { message: 'Sales Guide перегенерирован', sales_guide: guide };
};

const regenerateCourse = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  if (await menuAiPipeline.isRunning(restaurantId)) {
    throw badRequest('Генерация уже идёт — дождитесь завершения.');
  }
  menuAiPipeline.startRegenerateCourse(restaurantId);
  return { message: 'Перегенерация курса запущена' };
};

// Полная генерация обучающих материалов по ТЕКУЩЕМУ сохранённому меню
// (без повторной загрузки PDF) — Sales Guide + курс + тесты.
const generateTraining = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  if (await menuAiPipeline.isRunning(restaurantId)) {
    throw badRequest('Генерация уже идёт — дождитесь завершения.');
  }
  const totalDishes = await prisma.menuItem.count({
    where: { category: { restaurant_id: restaurantId } },
  });
  if (totalDishes === 0) throw badRequest('Меню пустое — сначала добавьте блюда');

  const initialStatus = {
    stage: 'generating_sales_guide',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalDishes,
    processedDishes: 0,
    salesGuidesOk: 0,
    salesGuidesFailed: 0,
    lessons: 0,
    tests: 0,
    questions: 0,
    errors: [],
    regenCount: 0,
    courseId: null,
  };
  await prisma.restaurantSetting.upsert({
    where: { restaurant_id_key: { restaurant_id: restaurantId, key: 'menu_ai_status' } },
    update: { value: JSON.stringify(initialStatus) },
    create: { restaurant_id: restaurantId, key: 'menu_ai_status', value: JSON.stringify(initialStatus) },
  });
  menuAiPipeline.startMenuAiPipeline(restaurantId);

  return { message: 'Генерация обучающих материалов запущена', totalDishes };
};

module.exports = {
  getMenu,
  adminGetCategories,
  adminCreateCategory,
  adminDeleteCategory,
  adminCreateItem,
  adminUpdateItem,
  adminDeleteItem,
  adminUploadPdf,
  adminConfirmParsedMenu,
  getAiStatus,
  regenerateSalesGuide,
  regenerateCourse,
  generateTraining,
};
