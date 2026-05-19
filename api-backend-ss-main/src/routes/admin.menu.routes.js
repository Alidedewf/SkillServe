const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка загрузки PDF-меню
const uploadDir = path.join(__dirname, '../../public/menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Сохраняем всегда под одним именем для простоты, или с таймстемпом
    cb(null, `menu_${Date.now()}.pdf`);
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Только PDF файлы'));
  }
});

// ─── 1. КАТЕГОРИИ МЕНЮ ────────────────────────────────────────────────────────
// GET /api/admin/menu/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { order: 'asc' },
      include: { items: true }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
});

// POST /api/admin/menu/categories
router.post('/categories', async (req, res) => {
  const { name, order } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const category = await prisma.menuCategory.create({
      data: { name, order: order || 0 }
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// ─── 2. ПОЗИЦИИ МЕНЮ ──────────────────────────────────────────────────────────
// POST /api/admin/menu/items
router.post('/items', async (req, res) => {
  const { category_id, title, description, price, image_url, visible_to } = req.body;
  if (!category_id || !title) return res.status(400).json({ error: 'Категория и название обязательны' });
  try {
    const item = await prisma.menuItem.create({
      data: {
        category_id: parseInt(category_id),
        title,
        description,
        price,
        image_url,
        visible_to: visible_to || []
      }
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания позиции меню' });
  }
});

// PUT /api/admin/menu/items/:id
router.put('/items/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { category_id, title, description, price, image_url, visible_to } = req.body;
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        category_id: category_id ? parseInt(category_id) : undefined,
        title,
        description,
        price,
        image_url,
        visible_to: visible_to || []
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления позиции меню' });
  }
});

// DELETE /api/admin/menu/items/:id
router.delete('/items/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Позиция удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления позиции' });
  }
});

// ─── 3. PDF МЕНЮ (НАСТРОЙКИ) ──────────────────────────────────────────────────
// GET /api/admin/menu/pdf
router.get('/pdf', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'menu_pdf_url' } });
    res.json({ url: setting ? setting.value : null });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки настроек' });
  }
});

// POST /api/admin/menu/upload-pdf
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  
  try {
    const fileUrl = `${req.protocol}://${req.get('host')}/public/menu/${req.file.filename}`;
    
    // Сохраняем ссылку в Settings
    await prisma.setting.upsert({
      where: { key: 'menu_pdf_url' },
      update: { value: fileUrl },
      create: { key: 'menu_pdf_url', value: fileUrl }
    });

    res.json({ message: 'PDF успешно загружен', url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения PDF' });
  }
});

// DELETE /api/admin/menu/pdf
router.delete('/pdf', async (req, res) => {
  try {
    await prisma.setting.delete({ where: { key: 'menu_pdf_url' } });
    res.json({ message: 'PDF удален' });
  } catch (err) {
    // Игнорируем ошибку если записи не было
    res.json({ message: 'Уже удалено' });
  }
});

module.exports = router;
