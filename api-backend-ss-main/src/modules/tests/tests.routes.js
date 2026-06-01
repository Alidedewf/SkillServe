const express = require('express');
const testsController = require('./tests.controller');

const router = express.Router();

router.get('/:id', testsController.getById);
router.post('/:id/submit', testsController.submit);

module.exports = router;
