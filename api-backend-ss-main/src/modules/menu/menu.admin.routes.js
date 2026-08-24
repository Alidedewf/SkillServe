const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const menuController = require('./menu.controller');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Только PDF файлы'));
  },
});

// Категории
router.get('/categories', menuController.adminGetCategories);
router.post('/categories', menuController.adminCreateCategory);
router.delete('/categories/:id', menuController.adminDeleteCategory);

// Блюда (Items)
router.post('/items', menuController.adminCreateItem);
router.put('/items/:id', menuController.adminUpdateItem);
router.delete('/items/:id', menuController.adminDeleteItem);

// PDF меню
router.post('/upload-pdf', upload.single('file'), menuController.adminUploadPdf);
router.post('/confirm-parsed', menuController.adminConfirmParsedMenu);

// AI Pipeline: статус генерации и повторная генерация
router.get('/ai-status', menuController.getAiStatus);
router.post('/generate-training', menuController.generateTraining);
router.post('/items/:id/regenerate-sales-guide', menuController.regenerateSalesGuide);
router.post('/regenerate-course', menuController.regenerateCourse);

module.exports = router;
