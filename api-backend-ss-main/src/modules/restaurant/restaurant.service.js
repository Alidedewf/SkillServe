const bcrypt = require('bcrypt');
const prisma = require('../../prisma');
const { notFound, conflict, badRequest } = require('../../common/utils/errors');

/**
 * Генерация slug из названия ресторана.
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now().toString(36);
};

/**
 * Создание ресторана с админом и дефолтной оргструктурой.
 */
const createRestaurant = async ({ name, adminEmail, adminPassword, adminName, logo_url }) => {
  if (!name || !adminEmail || !adminPassword || !adminName) {
    throw badRequest('Все поля обязательны: name, adminEmail, adminPassword, adminName');
  }

  // Проверяем уникальность email
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) throw conflict('Пользователь с таким email уже существует');

  return prisma.$transaction(async (tx) => {
    // 1. Создаём ресторан
    const restaurant = await tx.restaurant.create({
      data: { name, slug: generateSlug(name), logo_url },
    });

    // 2. Дефолтные отделы
    const deptNames = ['Зал', 'Кухня', 'Бар'];
    const departments = [];
    for (let i = 0; i < deptNames.length; i++) {
      const dept = await tx.department.create({
        data: { restaurant_id: restaurant.id, name: deptNames[i], order: i },
      });
      departments.push(dept);
    }

    // 3. Дефолтные должности
    const defaultPositions = [
      { name: 'Официант', deptName: 'Зал' },
      { name: 'Хостес', deptName: 'Зал' },
      { name: 'Старший официант', deptName: 'Зал' },
      { name: 'Повар', deptName: 'Кухня' },
      { name: 'Шеф-повар', deptName: 'Кухня' },
      { name: 'Су-шеф', deptName: 'Кухня' },
      { name: 'Бармен', deptName: 'Бар' },
      { name: 'Старший бармен', deptName: 'Бар' },
    ];

    for (let i = 0; i < defaultPositions.length; i++) {
      const pos = defaultPositions[i];
      const dept = departments.find((d) => d.name === pos.deptName);
      await tx.position.create({
        data: {
          restaurant_id: restaurant.id,
          department_id: dept ? dept.id : null,
          name: pos.name,
          order: i,
        },
      });
    }

    // 4. Создаём админа ресторана
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        restaurant_id: restaurant.id,
      },
    });

    const { password: _, ...adminWithoutPassword } = admin;
    return { restaurant, admin: adminWithoutPassword };
  });
};

/**
 * Список всех ресторанов.
 */
const getAllRestaurants = async () => {
  return prisma.restaurant.findMany({
    include: {
      _count: { select: { users: true, courses: true } },
    },
    orderBy: { id: 'desc' },
  });
};

/**
 * Получение ресторана по ID.
 */
const getRestaurantById = async (id) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      departments: { include: { positions: true }, orderBy: { order: 'asc' } },
      _count: { select: { users: true, courses: true } },
    },
  });
  if (!restaurant) throw notFound('Ресторан');
  return restaurant;
};

/**
 * Обновление ресторана.
 */
const updateRestaurant = async (id, data) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw notFound('Ресторан');

  return prisma.restaurant.update({
    where: { id },
    data: {
      name: data.name,
      logo_url: data.logo_url,
      is_active: data.is_active,
    },
  });
};

/**
 * Удаление ресторана (каскадно удалит всех пользователей, курсы и т.д.).
 */
const deleteRestaurant = async (id) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw notFound('Ресторан');

  await prisma.restaurant.delete({ where: { id } });
  return { message: 'Ресторан и все его данные удалены' };
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
};
