const express = require('express');
const aiController = require('./ai.controller');

const router = express.Router();

router.post('/generate-course', aiController.generateCourse);
router.post('/generate-image', aiController.generateImage);

module.exports = router;
