const adminService = require('./admin.service');

const getStats = async (req, res) => {
  try {
    const stats = await adminService.getStats(req.restaurantId);
    res.json(stats);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.getStats]', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await adminService.getCourses(req.restaurantId);
    res.json(courses);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.getCourses]', err);
    res.status(500).json({ error: 'Ошибка получения курсов' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await adminService.getCourseById(req.restaurantId, parseInt(req.params.id));
    res.json(course);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.getCourseById]', err);
    res.status(500).json({ error: 'Ошибка получения данных курса' });
  }
};

const createCourse = async (req, res) => {
  try {
    const result = await adminService.createCourse(req.restaurantId, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.createCourse]', err);
    res.status(500).json({ error: 'Ошибка создания курса в БД' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const result = await adminService.updateCourse(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.updateCourse]', err);
    res.status(500).json({ error: 'Ошибка обновления курса в БД' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const result = await adminService.deleteCourse(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.deleteCourse]', err);
    res.status(500).json({ error: 'Ошибка удаления курса' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers(req.restaurantId);
    res.json(users);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.getUsers]', err);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await adminService.createUser(req.restaurantId, req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.createUser]', err);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(user);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.updateUser]', err);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.deleteUser]', err);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
};

const getAchievements = async (req, res) => {
  try {
    const achievements = await adminService.getAchievements(req.restaurantId);
    res.json(achievements);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.getAchievements]', err);
    res.status(500).json({ error: 'Ошибка получения достижений' });
  }
};

const createAchievement = async (req, res) => {
  try {
    const achievement = await adminService.createAchievement(req.restaurantId, req.body);
    res.status(201).json(achievement);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.createAchievement]', err);
    res.status(500).json({ error: 'Ошибка создания достижения' });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const achievement = await adminService.updateAchievement(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(achievement);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.updateAchievement]', err);
    res.status(500).json({ error: 'Ошибка обновления достижения' });
  }
};

const deleteAchievement = async (req, res) => {
  try {
    const result = await adminService.deleteAchievement(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.deleteAchievement]', err);
    res.status(500).json({ error: 'Ошибка удаления достижения' });
  }
};

const grantAchievement = async (req, res) => {
  try {
    const result = await adminService.grantAchievement(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[admin.grantAchievement]', err);
    res.status(500).json({ error: 'Ошибка выдачи достижения' });
  }
};

module.exports = {
  getStats,
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
