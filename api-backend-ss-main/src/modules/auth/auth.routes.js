const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const authMiddleware = require('../../common/middleware/auth.middleware');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
  authController.login
);

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
