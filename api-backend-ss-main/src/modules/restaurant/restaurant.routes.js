const express = require('express');
const restaurantController = require('./restaurant.controller');

const router = express.Router();

router.post('/', restaurantController.create);
router.get('/', restaurantController.getAll);
router.get('/:id', restaurantController.getById);
router.put('/:id', restaurantController.update);
router.delete('/:id', restaurantController.remove);

module.exports = router;
