const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const menuController = require('./menu.controller');

const router = express.Router();

// Настройка загрузки PDF-меню
const uploadDir = path.join(__dirname, '../../../public/menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `menu_${Date.now()}.pdf`);
  },
});

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
router.get('/pdf', menuController.adminGetPdf);
router.post('/upload-pdf', upload.single('file'), menuController.adminUploadPdf);
router.post('/confirm-parsed', menuController.adminConfirmParsedMenu);
router.delete('/pdf', menuController.adminDeletePdf);

module.exports = router;
