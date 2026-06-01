const ratingService = require('./rating.service');

const getLeaderboard = async (req, res) => {
  try {
    const data = await ratingService.getLeaderboard(req.user.id, req.restaurantId);
    res.json(data);
  } catch (err) {
    console.error('[rating.getLeaderboard]', err);
    res.status(500).json({ error: 'Ошибка получения рейтинга из БД' });
  }
};

module.exports = {
  getLeaderboard,
};
