const lessonsService = require('./lessons.service');

const getById = async (req, res) => {
  try {
    const lesson = await lessonsService.getLessonById(req.user.id, parseInt(req.params.id), req.restaurantId);
    res.json(lesson);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[lessons.getById]', err);
    res.status(500).json({ error: 'Ошибка получения урока' });
  }
};

const complete = async (req, res) => {
  try {
    const result = await lessonsService.completeLesson(req.user.id, parseInt(req.params.id), req.restaurantId);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[lessons.complete]', err);
    res.status(500).json({ error: 'Ошибка обновления прогресса урока' });
  }
};

module.exports = {
  getById,
  complete,
};
