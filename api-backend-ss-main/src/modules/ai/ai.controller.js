const aiService = require('./ai.service');

const generateCourse = async (req, res) => {
  try {
    const courseData = await aiService.generateCourseContent(req.body);
    res.json(courseData);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[ai.generateCourse]', err);
    res.status(500).json({ error: 'Ошибка генерации курса' });
  }
};

const generateImage = async (req, res) => {
  try {
    const imageData = await aiService.generateCoverImage(req.body);
    res.json(imageData);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[ai.generateImage]', err);
    res.status(500).json({ error: 'Ошибка подбора изображения' });
  }
};

module.exports = {
  generateCourse,
  generateImage,
};
