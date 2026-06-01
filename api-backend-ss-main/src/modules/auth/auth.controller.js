const { validationResult } = require('express-validator');
const authService = require('./auth.service');

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
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

module.exports = { login, me };
