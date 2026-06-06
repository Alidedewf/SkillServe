const testsService = require('./tests.service');
const asyncHandler = require('../../common/utils/asyncHandler');

const getById = asyncHandler(
  (req) => testsService.getTestById(parseInt(req.params.id), req.restaurantId),
  'Ошибка получения теста'
);

const submit = asyncHandler(
  (req) => testsService.submitTest(req.user.id, parseInt(req.params.id), req.restaurantId, req.body.answers),
  'Ошибка обработки результатов теста'
);

module.exports = {
  getById,
  submit,
};

