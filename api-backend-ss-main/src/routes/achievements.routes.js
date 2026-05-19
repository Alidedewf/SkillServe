const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth.middleware');
const fs = require('fs');
const path = require('path');

// GET /api/achievements/icons
// Получить список доступных иконок для достижений
router.get('/icons', authMiddleware, async (req, res) => {
  try {
    const iconsDir = path.join(__dirname, '../../public/achievements');
    if (!fs.existsSync(iconsDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(iconsDir);
    const icons = files
      .filter(file => /\.(png|jpg|jpeg|svg|webp)$/i.test(file))
      .map(file => ({
        id: file,
        url: `${req.protocol}://${req.get('host')}/public/achievements/${file}`
      }));
    res.json(icons);
  } catch (err) {
    console.error('[GET /achievements/icons]', err);
    res.status(500).json({ error: 'Ошибка получения списка иконок' });
  }
});
// GET /api/achievements
// Получить список всех достижений
router.get('/', authMiddleware, async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(achievements);
  } catch (err) {
    console.error('[GET /achievements]', err);
    res.status(500).json({ error: 'Ошибка получения достижений' });
  }
});

// GET /api/achievements/my
// Получить достижения, заработанные текущим пользователем
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { user_id: req.user.id },
      include: { achievement: true },
      orderBy: { earned_at: 'desc' }
    });
    
    // Форматируем ответ
    const result = userAchievements.map(ua => ({
      id: ua.achievement.id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      image_url: ua.achievement.image_url,
      earned_at: ua.earned_at
    }));
    
    res.json(result);
  } catch (err) {
    console.error('[GET /achievements/my]', err);
    res.status(500).json({ error: 'Ошибка получения ваших достижений' });
  }
});

module.exports = router;
