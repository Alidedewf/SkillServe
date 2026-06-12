const express = require('express');
const orgController = require('./org.controller');

const router = express.Router();

router.get('/departments', orgController.getDepartments);
router.patch('/departments/reorder', orgController.reorderStructure);
router.post('/departments', orgController.createDepartment);
router.put('/departments/:id', orgController.updateDepartment);
router.delete('/departments/:id', orgController.deleteDepartment);

router.get('/positions', orgController.getPositions);
router.post('/positions', orgController.createPosition);
router.put('/positions/:id', orgController.updatePosition);
router.delete('/positions/:id', orgController.deletePosition);

module.exports = router;
