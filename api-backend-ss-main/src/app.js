const express = require('express');
const cors = require('cors');

const authMiddleware = require('./common/middleware/auth.middleware');
const tenantMiddleware = require('./common/middleware/tenant.middleware');
const requireRole = require('./common/middleware/role.middleware');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/public', express.static('public'));

// ─── Routes ─────────────────────────────────────────────────────────

// Публичные (без авторизации)
app.use('/api/auth', require('./modules/auth/auth.routes'));

// Защищённые (авторизация + tenant isolation)
app.use('/api/users',        authMiddleware, tenantMiddleware, require('./modules/users/users.routes'));
app.use('/api/courses',      authMiddleware, tenantMiddleware, require('./modules/courses/courses.routes'));
app.use('/api/lessons',      authMiddleware, tenantMiddleware, require('./modules/courses/lessons.routes'));
app.use('/api/tests',        authMiddleware, tenantMiddleware, require('./modules/tests/tests.routes'));
app.use('/api/rating',       authMiddleware, tenantMiddleware, require('./modules/rating/rating.routes'));
app.use('/api/achievements', authMiddleware, tenantMiddleware, require('./modules/achievements/achievements.routes'));
app.use('/api/menu',         authMiddleware, tenantMiddleware, require('./modules/menu/menu.routes'));

// Настраиваемая оргструктура ресторана (только для ADMIN конкретного ресторана)
app.use('/api/org',          authMiddleware, tenantMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), require('./modules/org-structure/org.routes'));

// Админ-панель ресторана (только для ADMIN)
app.use('/api/admin',        authMiddleware, tenantMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), require('./modules/admin/admin.routes'));
app.use('/api/admin/menu',   authMiddleware, tenantMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), require('./modules/menu/menu.admin.routes'));
app.use('/api/admin/ai',     authMiddleware, tenantMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), require('./modules/ai/ai.routes'));

// Управление ресторанами (только для SUPER_ADMIN всей платформы)
app.use('/api/restaurants',  authMiddleware, requireRole('SUPER_ADMIN'), require('./modules/restaurant/restaurant.routes'));

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillServe API is running' });
});

// ─── 404 handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
