const coursesService = require('./courses.service');
const asyncHandler = require('../../common/utils/asyncHandler');

const getCourses = asyncHandler(
  (req) => coursesService.getCourses(req.user.id, req.restaurantId),
  'Ошибка получения списка курсов'
);

const getInProgress = asyncHandler(
  (req) => coursesService.getInProgress(req.user.id, req.restaurantId),
  'Ошибка получения курсов в процессе'
);

const getNewCourses = asyncHandler(
  (req) => coursesService.getNewCourses(req.user.id, req.restaurantId),
  'Ошибка получения новых курсов'
);

const getArchived = asyncHandler(
  (req) => coursesService.getArchived(req.user.id, req.restaurantId),
  'Ошибка получения архива'
);

const getCourseById = asyncHandler(
  (req) => coursesService.getCourseById(parseInt(req.params.id), req.restaurantId),
  'Ошибка получения курса'
);

const getCourseLessons = asyncHandler(
  (req) => coursesService.getCourseLessons(req.user.id, parseInt(req.params.id), req.restaurantId),
  'Ошибка получения уроков курса'
);

const getCourseTests = asyncHandler(
  (req) => coursesService.getCourseTests(parseInt(req.params.id), req.restaurantId),
  'Ошибка получения тестов курса'
);

const resetCourseProgress = asyncHandler(
  (req) => coursesService.resetCourseProgress(req.user.id, parseInt(req.params.id), req.restaurantId),
  'Ошибка сброса прогресса курса'
);

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

