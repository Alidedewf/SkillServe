const prisma = require('../../prisma');
const { notFound, badRequest } = require('../../common/utils/errors');

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

const adminGetPdf = async (restaurantId) => {
  if (!restaurantId) return { url: null };
  const setting = await prisma.restaurantSetting.findUnique({
    where: {
      restaurant_id_key: {
        restaurant_id: restaurantId,
        key: 'menu_pdf_url',
      },
    },
  });
  return { url: setting ? setting.value : null };
};

const adminUploadPdf = async (restaurantId, fileUrl) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  await prisma.restaurantSetting.upsert({
    where: {
      restaurant_id_key: {
        restaurant_id: restaurantId,
        key: 'menu_pdf_url',
      },
    },
    update: { value: fileUrl },
    create: {
      restaurant_id: restaurantId,
      key: 'menu_pdf_url',
      value: fileUrl,
    },
  });
  return { message: 'PDF успешно загружен', url: fileUrl };
};

const adminDeletePdf = async (restaurantId) => {
  if (!restaurantId) throw badRequest('Не указан ресторан');
  try {
    await prisma.restaurantSetting.delete({
      where: {
        restaurant_id_key: {
          restaurant_id: restaurantId,
          key: 'menu_pdf_url',
        },
      },
    });
    return { message: 'PDF удален' };
  } catch (err) {
    return { message: 'Уже удалено' };
  }
};

module.exports = {
  getMenu,
  adminGetCategories,
  adminCreateCategory,
  adminDeleteCategory,
  adminCreateItem,
  adminUpdateItem,
  adminDeleteItem,
  adminGetPdf,
  adminUploadPdf,
  adminDeletePdf,
};
