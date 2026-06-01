const testsService = require('./tests.service');

const getById = async (req, res) => {
  try {
    const test = await testsService.getTestById(parseInt(req.params.id), req.restaurantId);
    res.json(test);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[tests.getById]', err);
    res.status(500).json({ error: 'Ошибка получения теста' });
  }
};

const submit = async (req, res) => {
  try {
    const result = await testsService.submitTest(req.user.id, parseInt(req.params.id), req.restaurantId, req.body.answers);
    res.json(result);
  } catch (err) {
    if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
    console.error('[tests.submit]', err);
    res.status(500).json({ error: 'Ошибка обработки результатов теста' });
  }
};

module.exports = {
  getById,
  submit,
};
