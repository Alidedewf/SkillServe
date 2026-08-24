const adminService = require('./admin.service');
const asyncHandler = require('../../common/utils/asyncHandler');

const getStats = asyncHandler(
  (req) => adminService.getStats(req.restaurantId),
  'Ошибка получения статистики'
);

const getDashboard = asyncHandler(
  (req) => adminService.getDashboard(req.restaurantId),
  'Ошибка получения дашборда'
);

const getCourses = asyncHandler(
  (req) => adminService.getCourses(req.restaurantId),
  'Ошибка получения курсов'
);

const getCourseById = asyncHandler(
  (req) => adminService.getCourseById(req.restaurantId, parseInt(req.params.id)),
  'Ошибка получения данных курса'
);

const createCourse = asyncHandler(
  async (req, res) => {
    const result = await adminService.createCourse(req.restaurantId, req.body);
    res.status(201).json(result);
  },
  'Ошибка создания курса в БД'
);

const updateCourse = asyncHandler(
  (req) => adminService.updateCourse(req.restaurantId, parseInt(req.params.id), req.body),
  'Ошибка обновления курса в БД'
);

const deleteCourse = asyncHandler(
  (req) => adminService.deleteCourse(req.restaurantId, parseInt(req.params.id)),
  'Ошибка удаления курса'
);

const getUsers = asyncHandler(
  (req) => adminService.getUsers(req.restaurantId),
  'Ошибка получения пользователей'
);

const createUser = asyncHandler(
  async (req, res) => {
    const user = await adminService.createUser(req.restaurantId, req.body);
    res.status(201).json(user);
  },
  'Ошибка создания пользователя'
);

const updateUser = asyncHandler(
  (req) => adminService.updateUser(req.restaurantId, parseInt(req.params.id), req.body),
  'Ошибка обновления пользователя'
);

const deleteUser = asyncHandler(
  (req) => adminService.deleteUser(req.restaurantId, parseInt(req.params.id)),
  'Ошибка удаления пользователя'
);

const getAchievements = asyncHandler(
  (req) => adminService.getAchievements(req.restaurantId),
  'Ошибка получения достижений'
);

const createAchievement = asyncHandler(
  async (req, res) => {
    const achievement = await adminService.createAchievement(req.restaurantId, req.body);
    res.status(201).json(achievement);
  },
  'Ошибка создания достижения'
);

const updateAchievement = asyncHandler(
  (req) => adminService.updateAchievement(req.restaurantId, parseInt(req.params.id), req.body),
  'Ошибка обновления достижения'
);

const deleteAchievement = asyncHandler(
  (req) => adminService.deleteAchievement(req.restaurantId, parseInt(req.params.id)),
  'Ошибка удаления достижения'
);

const grantAchievement = asyncHandler(
  (req) => adminService.grantAchievement(req.restaurantId, parseInt(req.params.id), req.body),
  'Ошибка выдачи достижения'
);

module.exports = {
  getStats,
  getDashboard,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  grantAchievement,
};

