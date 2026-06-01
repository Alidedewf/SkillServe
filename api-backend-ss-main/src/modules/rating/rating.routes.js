const express = require('express');
const ratingController = require('./rating.controller');

const router = express.Router();

router.get('/', ratingController.getLeaderboard);

module.exports = router;
