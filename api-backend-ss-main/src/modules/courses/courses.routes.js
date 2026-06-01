const express = require('express');
const coursesController = require('./courses.controller');

const router = express.Router();

router.get('/', coursesController.getCourses);
router.get('/in-progress', coursesController.getInProgress);
router.get('/new', coursesController.getNewCourses);
router.get('/archived', coursesController.getArchived);
router.get('/:id', coursesController.getCourseById);
router.get('/:id/lessons', coursesController.getCourseLessons);
router.get('/:id/tests', coursesController.getCourseTests);
router.post('/:id/reset', coursesController.resetCourseProgress);

module.exports = router;
