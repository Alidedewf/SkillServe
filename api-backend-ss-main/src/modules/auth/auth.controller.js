const { validationResult } = require('express-validator');
const authService = require('./auth.service');

// Опции httpOnly-cookie с JWT. secure включается только в production (HTTPS).
const COOKIE_NAME = 'token';
const cookieOptions = () => ({
  httpOnly: true,
  // По умолчанию secure в production. Можно переопределить COOKIE_SECURE
  // (например, Docker-деплой по HTTP без TLS → COOKIE_SECURE=false).
  secure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  path: '/',
});

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token, expiresAt, user } = await authService.login(req.body.email, req.body.password);
    // Токен уходит ТОЛЬКО в httpOnly-cookie — JS на фронте его не видит (защита от XSS).
    res.cookie(COOKIE_NAME, token, cookieOptions());
    // В теле — несекретные данные пользователя и срок действия для клиентских гвардов.
    res.json({ user, expiresAt });
  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('[auth.login]', err);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('[auth.me]', err);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
};

const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'Вы вышли из системы' });
};

module.exports = { login, me, logout };
