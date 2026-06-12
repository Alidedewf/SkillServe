const prisma = require('../../prisma');
const { notFound, badRequest } = require('../../common/utils/errors');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { parseMenuTextToJSON } = require('../ai/ai.service');

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

const adminCreateItem = async (restaurantId, { category_id, title, description, price, portion, image_url, visible_to }) => {
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
    },
  });
};

const adminUpdateItem = async (restaurantId, itemId, { category_id, title, description, price, portion, image_url, visible_to }) => {
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

  await prisma.$transaction(async (tx) => {
    // Удаляем старое меню
    await tx.menuCategory.deleteMany({
      where: { restaurant_id: restaurantId }
    });

    for (let i = 0; i < menuData.length; i++) {
      const catData = menuData[i];
      const newCat = await tx.menuCategory.create({
        data: {
          restaurant_id: restaurantId,
          name: catData.category || 'Без категории',
          order: i,
        }
      });

      if (catData.items && Array.isArray(catData.items)) {
        const itemsToCreate = catData.items.map(item => ({
          category_id: newCat.id,
          title: item.title || 'Без названия',
          description: item.description || null,
          price: item.price ? String(item.price) : null,
          portion: item.portion ? String(item.portion) : null,
          visible_to: [],
        }));

        if (itemsToCreate.length > 0) {
          await tx.menuItem.createMany({ data: itemsToCreate });
        }
      }
    }
  });

  return { message: 'Меню успешно сохранено' };
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
};
