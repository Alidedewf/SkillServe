const usersService = require('./users.service');

const getProfile = async (req, res) => {
  try {
    const profile = await usersService.getProfile(req.user.id);
    
    // Если это SUPER_ADMIN и передан X-Restaurant-Id, подтягиваем инфо о ресторане
    if (req.user.role === 'SUPER_ADMIN' && req.restaurantId) {
      const prisma = require('../../prisma');
      const rest = await prisma.restaurant.findUnique({
        where: { id: req.restaurantId },
        select: { id: true, name: true, logo_url: true }
      });
      if (rest) {
        profile.restaurant = rest;
      }
    }
    
    res.json(profile);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[users.getProfile]', err);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await usersService.updateProfile(req.user.id, req.body);
    
    if (req.user.role === 'SUPER_ADMIN' && req.restaurantId) {
      const prisma = require('../../prisma');
      const rest = await prisma.restaurant.findUnique({
        where: { id: req.restaurantId },
        select: { id: true, name: true, logo_url: true }
      });
      if (rest) {
        profile.restaurant = rest;
      }
    }
    
    res.json(profile);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[users.updateProfile]', err);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await usersService.getNotifications(req.user.id, req.restaurantId);
    res.json(notifications);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[users.getNotifications]', err);
    res.status(500).json({ error: 'Ошибка получения уведомлений' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
};
