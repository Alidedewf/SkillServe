const achievementsService = require('./achievements.service');
const asyncHandler = require('../../common/utils/asyncHandler');

const getIcons = asyncHandler(
  (req) => achievementsService.getIcons(req.protocol, req.get('host')),
  'Ошибка получения списка иконок'
);

const getAchievements = asyncHandler(
  (req) => achievementsService.getAchievements(req.restaurantId),
  'Ошибка получения достижений'
);

const getMyAchievements = asyncHandler(
  (req) => achievementsService.getMyAchievements(req.user.id, req.restaurantId),
  'Ошибка получения ваших достижений'
);

module.exports = {
  getIcons,
  getAchievements,
  getMyAchievements,
};

