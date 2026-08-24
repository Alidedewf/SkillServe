const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../prisma');
const config = require('../../config');
const { notFound, unauthorized, conflict } = require('../../common/utils/errors');

/**
 * Генерация JWT-токена с restaurantId.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id || null,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Логин пользователя.
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized('Неверный email или пароль');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw unauthorized('Неверный email или пароль');

  const token = generateToken(user);
  const { exp } = jwt.decode(token); // unix-секунды, отдаём фронту для UI-гвардов
  const { password: _, ...userWithoutPassword } = user;

  return { token, expiresAt: exp, user: userWithoutPassword };
};

/**
 * Получение текущего пользователя по ID.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      language: true,
      restaurant_id: true,
      position_id: true,
      position: { select: { id: true, name: true } },
      restaurant: { select: { id: true, name: true, slug: true, logo_url: true } },
    },
  });

  if (!user) throw notFound('Пользователь');
  return user;
};

module.exports = { login, getMe, generateToken };
