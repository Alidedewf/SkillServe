const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const coursesRoutes = require('./routes/courses.routes');
const lessonsRoutes = require('./routes/lessons.routes');
const testsRoutes = require('./routes/tests.routes');
const ratingRoutes = require('./routes/rating.routes');
const achievementsRoutes = require('./routes/achievements.routes');
const adminRoutes = require('./routes/admin.routes');
const aiRoutes = require('./routes/ai.routes');
const adminMenuRoutes = require('./routes/admin.menu.routes');
const menuRoutes = require('./routes/menu.routes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/public', express.static('public'));

// ─── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/ai', aiRoutes);
const authMiddleware = require('./middleware/auth.middleware');
const adminMiddleware = require('./middleware/admin.middleware');

app.use('/api/admin/menu', authMiddleware, adminMiddleware, adminMenuRoutes);
app.use('/api/menu', menuRoutes);

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
