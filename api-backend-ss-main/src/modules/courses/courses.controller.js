const coursesService = require('./courses.service');

const getCourses = async (req, res) => {
  try {
    const courses = await coursesService.getCourses(req.user.id, req.restaurantId);
    res.json(courses);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getCourses]', err);
    res.status(500).json({ error: 'Ошибка получения списка курсов' });
  }
};

const getInProgress = async (req, res) => {
  try {
    const courses = await coursesService.getInProgress(req.user.id, req.restaurantId);
    res.json(courses);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getInProgress]', err);
    res.status(500).json({ error: 'Ошибка получения курсов в процессе' });
  }
};

const getNewCourses = async (req, res) => {
  try {
    const courses = await coursesService.getNewCourses(req.user.id, req.restaurantId);
    res.json(courses);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getNewCourses]', err);
    res.status(500).json({ error: 'Ошибка получения новых курсов' });
  }
};

const getArchived = async (req, res) => {
  try {
    const courses = await coursesService.getArchived(req.user.id, req.restaurantId);
    res.json(courses);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getArchived]', err);
    res.status(500).json({ error: 'Ошибка получения архива' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await coursesService.getCourseById(parseInt(req.params.id), req.restaurantId);
    res.json(course);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getCourseById]', err);
    res.status(500).json({ error: 'Ошибка получения курса' });
  }
};

const getCourseLessons = async (req, res) => {
  try {
    const lessons = await coursesService.getCourseLessons(req.user.id, parseInt(req.params.id), req.restaurantId);
    res.json(lessons);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getCourseLessons]', err);
    res.status(500).json({ error: 'Ошибка получения уроков курса' });
  }
};

const getCourseTests = async (req, res) => {
  try {
    const tests = await coursesService.getCourseTests(parseInt(req.params.id), req.restaurantId);
    res.json(tests);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.getCourseTests]', err);
    res.status(500).json({ error: 'Ошибка получения тестов курса' });
  }
};

const resetCourseProgress = async (req, res) => {
  try {
    const result = await coursesService.resetCourseProgress(req.user.id, parseInt(req.params.id), req.restaurantId);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[courses.resetCourseProgress]', err);
    res.status(500).json({ error: 'Ошибка сброса прогресса курса' });
  }
};

module.exports = {
  getCourses,
  getInProgress,
  getNewCourses,
  getArchived,
  getCourseById,
  getCourseLessons,
  getCourseTests,
  resetCourseProgress,
};
