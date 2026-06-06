const prisma = require('../../prisma');
const { notFound } = require('./errors');

/**
 * Хелпер для поиска записи по ID с дополнительной фильтрацией по ресторану (для ADMIN доступа).
 * Автоматически выбрасывает ошибку 404, если запись не найдена.
 *
 * @param {string} model - Имя модели в Prisma (например, 'course', 'user', 'achievement')
 * @param {number} id - Идентификатор записи
 * @param {number|null} restaurantId - ID ресторана (если задан, проверяем принадлежность ресурса)
 * @param {string} label - Название сущности для текста ошибки (например, 'Курс')
 * @returns {Promise<Object>} Найденный объект
 */
const findOrFail = async (model, id, restaurantId, label) => {
  const where = { id };
  if (restaurantId) {
    where.restaurant_id = restaurantId;
  }
  const entity = await prisma[model].findFirst({ where });
  if (!entity) {
    throw notFound(label);
  }
  return entity;
};

module.exports = findOrFail;
