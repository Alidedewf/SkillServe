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
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  // Если уведомлений нет — создаём приветственное один раз
  if (notifications.length === 0) {
    const welcome = await prisma.notification.create({
      data: {
        user_id: userId,
        restaurant_id: restaurantId || null,
        title: 'Добро пожаловать!',
        message: 'Добро пожаловать в SkillServe! Начните обучение в разделе «Курсы».',
      },
    });
    return [welcome];
  }

  return notifications;
};


module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
};
