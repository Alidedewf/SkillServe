const express = require('express');
const adminController = require('./admin.controller');

const router = express.Router();

// Статистика
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getDashboard);

// Управление курсами (CRUD)
router.get('/courses', adminController.getCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Управление пользователями (CRUD)
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Управление достижениями (Achievements)
router.get('/achievements', adminController.getAchievements);
router.post('/achievements', adminController.createAchievement);
router.put('/achievements/:id', adminController.updateAchievement);
router.delete('/achievements/:id', adminController.deleteAchievement);
router.post('/achievements/:id/grant', adminController.grantAchievement);

module.exports = router;
