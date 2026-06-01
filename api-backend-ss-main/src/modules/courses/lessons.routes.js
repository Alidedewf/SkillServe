const express = require('express');
const lessonsController = require('./lessons.controller');

const router = express.Router();

router.get('/:id', lessonsController.getById);
router.post('/:id/complete', lessonsController.complete);

module.exports = router;
