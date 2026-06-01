const express = require('express');
const usersController = require('./users.controller');

const router = express.Router();

router.get('/profile', usersController.getProfile);
router.patch('/profile', usersController.updateProfile);
router.get('/notifications', usersController.getNotifications);

module.exports = router;
