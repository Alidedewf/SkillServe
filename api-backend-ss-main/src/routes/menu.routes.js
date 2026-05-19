const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/menu
// Возвращает категории с их блюдами, отфильтрованными по должности юзера, и ссылку на PDF меню
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Получаем реальную должность юзера из базы данных, т.к. в JWT токене её нет
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    const userPosition = dbUser?.position || '';

    // Получаем PDF если есть
    const pdfSetting = await prisma.setting.findUnique({ where: { key: 'menu_pdf_url' } });
    const pdfUrl = pdfSetting ? pdfSetting.value : null;

    // Получаем категории
    const categories = await prisma.menuCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        items: true
      }
    });

    // Фильтруем блюда по должности (если visible_to пустой — видят все, иначе только те, у кого должность совпадает)
    const filteredCategories = categories.map(cat => {
      const filteredItems = cat.items.filter(item => {
        if (!item.visible_to || item.visible_to.length === 0) return true;
        return item.visible_to.includes(userPosition);
      });
      return { ...cat, items: filteredItems };
    }).filter(cat => cat.items.length > 0); // Убираем пустые категории

    res.json({
      pdf_url: pdfUrl,
      categories: filteredCategories
    });
  } catch (err) {
    console.error('[GET /api/menu]', err);
    res.status(500).json({ error: 'Ошибка загрузки меню' });
  }
});

module.exports = router;
