const usersService = require('./users.service');
const asyncHandler = require('../../common/utils/asyncHandler');

const getProfile = asyncHandler(
  (req) => usersService.getProfile(req.user.id, req.user.role, req.restaurantId),
  'Ошибка получения профиля'
);

const updateProfile = asyncHandler(
  (req) => usersService.updateProfile(req.user.id, req.body, req.user.role, req.restaurantId),
  'Ошибка обновления профиля'
);

const getNotifications = asyncHandler(
  (req) => usersService.getNotifications(req.user.id, req.restaurantId),
  'Ошибка получения уведомлений'
);

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
};

