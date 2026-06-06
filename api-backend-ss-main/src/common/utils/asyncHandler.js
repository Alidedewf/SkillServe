/**
 * Обертка для контроллеров Express.
 * Избавляет от необходимости писать повторяющиеся try-catch блоки.
 * Автоматически возвращает результат функции в формате JSON, если он определен,
 * и обрабатывает AppError/операционные и критические ошибки.
 *
 * @param {Function} fn - Асинхронный обработчик запроса
 * @param {string} errorMessage - Сообщение об ошибке для клиента при 500 ошибке
 */
const asyncHandler = (fn, errorMessage = 'Внутренняя ошибка сервера') => async (req, res, next) => {
  try {
    const result = await fn(req, res, next);
    if (!res.headersSent && result !== undefined) {
      res.json(result);
    }
  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Для отладки выводим имя функции или переданный логгер
    console.error(`[${fn.name || 'handler'}]`, err);
    res.status(500).json({ error: errorMessage });
  }
};

module.exports = asyncHandler;
