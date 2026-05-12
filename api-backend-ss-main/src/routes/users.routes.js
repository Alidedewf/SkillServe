const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../prisma');

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar_url: true, position: true, language: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// PATCH /api/users/profile
router.patch('/profile', authMiddleware, async (req, res) => {
  const { name, position, language, avatar_url } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, position, language, avatar_url },
      select: { id: true, name: true, email: true, role: true, avatar_url: true, position: true, language: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

// GET /api/users/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  res.json([
    { id: 1, title: 'Добро пожаловать!', message: 'Добро пожаловать в StaffMenu! Обучение теперь работает полностью на реальном API бэкенде.', is_read: false, created_at: new Date().toISOString() }
  ]);
});

module.exports = router;
