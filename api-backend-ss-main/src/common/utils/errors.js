/**
 * Стандартизированные ошибки API.
 * Кидаем AppError в сервисах, ловим в контроллерах.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const notFound = (entity = 'Ресурс') => new AppError(`${entity} не найден`, 404);
const forbidden = (msg = 'Доступ запрещён') => new AppError(msg, 403);
const badRequest = (msg = 'Некорректный запрос') => new AppError(msg, 400);
const conflict = (msg = 'Конфликт данных') => new AppError(msg, 409);
const unauthorized = (msg = 'Не авторизован') => new AppError(msg, 401);

module.exports = { AppError, notFound, forbidden, badRequest, conflict, unauthorized };
