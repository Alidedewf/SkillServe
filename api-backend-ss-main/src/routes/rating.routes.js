const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        testAttempts: true
      }
    });

    const getAvatar = (seed) => {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
    };

    // Рассчитываем XP для каждого пользователя на основе его успешных попыток
    const usersWithXp = users.map(user => {
      const xp = user.testAttempts.reduce((sum, attempt) => {
        return sum + (attempt.correct_count * 10);
      }, 0) + 100; // 100 - базовые XP при регистрации

      return {
        id: user.id,
        name: user.name,
        xp,
        avatar_url: user.avatar_url || getAvatar(user.name.replace(/\s+/g, '_'))
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
      photo: u.avatar_url
    }));

    // Находим информацию по текущему авторизованному юзеру
    const currentUserRankIndex = leaderboard.findIndex(u => u.id === req.user.id);
    const currentUserInfo = {
      rank: currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : 1,
      xp: leaderboard[currentUserRankIndex]?.xp || 100,
      message: currentUserRankIndex === 0 
        ? "Вы лидер лиги! Так держать!" 
        : `У вас получается лучше, чем у ${Math.round((leaderboard.length - currentUserRankIndex - 1) / leaderboard.length * 100)}% других игроков!`
    };

    res.json({
      currentUserInfo,
      leaderboard
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения рейтинга из БД' });
  }
});

module.exports = router;
