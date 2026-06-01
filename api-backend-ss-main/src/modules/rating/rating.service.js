const prisma = require('../../prisma');

const getAvatar = (seed) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
};

const getLeaderboard = async (userId, restaurantId) => {
  const where = {
    role: 'USER',
  };
  if (restaurantId) where.restaurant_id = restaurantId;

  const users = await prisma.user.findMany({
    where,
    include: {
      testAttempts: true,
    },
  });

  // Рассчитываем XP для каждого пользователя на основе его успешных попыток
  const usersWithXp = users.map((user) => {
    const xp =
      user.testAttempts.reduce((sum, attempt) => {
        return sum + attempt.correct_count * 10;
      }, 0) + 100; // 100 - базовые XP при регистрации

    return {
      id: user.id,
      name: user.name,
      xp,
      avatar_url: user.avatar_url || getAvatar(user.name.replace(/\s+/g, '_')),
    };
  });

  // Сортируем пользователей по убыванию XP
  usersWithXp.sort((a, b) => b.xp - a.xp);

  // Добавляем ранги
  const leaderboard = usersWithXp.map((u, index) => ({
    id: u.id,
    rank: index + 1,
    name: u.name,
    xp: u.xp,
    photo: u.avatar_url,
  }));

  // Находим информацию по текущему авторизованному юзеру
  const currentUserRankIndex = leaderboard.findIndex((u) => u.id === userId);
  
  const currentUserInfo = {
    rank: currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : 1,
    xp: currentUserRankIndex !== -1 ? leaderboard[currentUserRankIndex].xp : 100,
    message: '',
  };

  if (leaderboard.length > 0) {
    if (currentUserRankIndex === 0) {
      currentUserInfo.message = 'Вы лидер лиги! Так держать!';
    } else if (currentUserRankIndex !== -1) {
      const pct = Math.round(((leaderboard.length - currentUserRankIndex - 1) / leaderboard.length) * 100);
      currentUserInfo.message = `У вас получается лучше, чем у ${pct}% других игроков!`;
    } else {
      currentUserInfo.message = 'Начните проходить курсы, чтобы войти в рейтинг!';
    }
  } else {
    currentUserInfo.message = 'Вы первый участник! Начните проходить курсы!';
  }

  return {
    currentUserInfo,
    leaderboard,
  };
};

module.exports = {
  getLeaderboard,
};
