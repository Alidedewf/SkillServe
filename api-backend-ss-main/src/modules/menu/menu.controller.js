const menuService = require('./menu.service');

const getMenu = async (req, res) => {
  try {
    const menu = await menuService.getMenu(req.user.id, req.restaurantId);
    res.json(menu);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.getMenu]', err);
    res.status(500).json({ error: 'Ошибка загрузки меню' });
  }
};

const adminGetCategories = async (req, res) => {
  try {
    const categories = await menuService.adminGetCategories(req.restaurantId);
    res.json(categories);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminGetCategories]', err);
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
};

const adminCreateCategory = async (req, res) => {
  try {
    const category = await menuService.adminCreateCategory(req.restaurantId, req.body);
    res.status(201).json(category);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminCreateCategory]', err);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
};

const adminCreateItem = async (req, res) => {
  try {
    const item = await menuService.adminCreateItem(req.restaurantId, req.body);
    res.status(201).json(item);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminCreateItem]', err);
    res.status(500).json({ error: 'Ошибка создания позиции меню' });
  }
};

const adminUpdateItem = async (req, res) => {
  try {
    const item = await menuService.adminUpdateItem(req.restaurantId, parseInt(req.params.id), req.body);
    res.json(item);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminUpdateItem]', err);
    res.status(500).json({ error: 'Ошибка обновления позиции меню' });
  }
};

const adminDeleteItem = async (req, res) => {
  try {
    const result = await menuService.adminDeleteItem(req.restaurantId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminDeleteItem]', err);
    res.status(500).json({ error: 'Ошибка удаления позиции' });
  }
};

const adminGetPdf = async (req, res) => {
  try {
    const result = await menuService.adminGetPdf(req.restaurantId);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminGetPdf]', err);
    res.status(500).json({ error: 'Ошибка загрузки настроек' });
  }
};

const adminUploadPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  
  try {
    const fileUrl = `${req.protocol}://${req.get('host')}/public/menu/${req.file.filename}`;
    const result = await menuService.adminUploadPdf(req.restaurantId, fileUrl);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminUploadPdf]', err);
    res.status(500).json({ error: 'Ошибка сохранения PDF' });
  }
};

const adminDeletePdf = async (req, res) => {
  try {
    const result = await menuService.adminDeletePdf(req.restaurantId);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[menu.adminDeletePdf]', err);
    res.status(500).json({ error: 'Ошибка удаления PDF' });
  }
};

module.exports = {
  getMenu,
  adminGetCategories,
  adminCreateCategory,
  adminCreateItem,
  adminUpdateItem,
  adminDeleteItem,
  adminGetPdf,
  adminUploadPdf,
  adminDeletePdf,
};
