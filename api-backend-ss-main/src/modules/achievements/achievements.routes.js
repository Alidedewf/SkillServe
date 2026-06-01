const express = require('express');
const achievementsController = require('./achievements.controller');

const router = express.Router();

router.get('/icons', achievementsController.getIcons);
router.get('/', achievementsController.getAchievements);
router.get('/my', achievementsController.getMyAchievements);

module.exports = router;
