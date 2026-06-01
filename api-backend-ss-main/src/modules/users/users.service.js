const prisma = require('../../prisma');
const { notFound } = require('../../common/utils/errors');

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      language: true,
      restaurant_id: true,
      position_id: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          logo_url: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
          department_id: true,
        },
      },
    },
  });
  if (!user) throw notFound('Пользователь');
  return user;
};

const updateProfile = async (userId, { name, language, avatar_url, position_id }) => {
  const data = {};
  if (name !== undefined) data.name = name;
  if (language !== undefined) data.language = language;
  if (avatar_url !== undefined) data.avatar_url = avatar_url;
  
  if (position_id !== undefined) {
    if (position_id) {
      // Проверяем существование должности
      const pos = await prisma.position.findUnique({ where: { id: position_id } });
      if (!pos) throw notFound('Должность');
      data.position_id = position_id;
    } else {
      data.position_id = null;
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      language: true,
      restaurant_id: true,
      position_id: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          logo_url: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
          department_id: true,
        },
      },
    },
  });
};

const getNotifications = async (userId, restaurantId) => {
  // В старой системе возвращался хардкод заглушка. Сохраним поведение, но вернем его в сервисе.
  return [
    {
      id: 1,
      title: 'Добро пожаловать!',
      message: 'Добро пожаловать в StaffMenu! Обучение теперь работает полностью на реальном API бэкенде.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ];
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
};
