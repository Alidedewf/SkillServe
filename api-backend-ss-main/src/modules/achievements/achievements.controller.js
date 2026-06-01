const achievementsService = require('./achievements.service');

const getIcons = async (req, res) => {
  try {
    const icons = await achievementsService.getIcons(req.protocol, req.get('host'));
    res.json(icons);
  } catch (err) {
    console.error('[achievements.getIcons]', err);
    res.status(500).json({ error: 'Ошибка получения списка иконок' });
  }
};

const getAchievements = async (req, res) => {
  try {
    const achievements = await achievementsService.getAchievements(req.restaurantId);
    res.json(achievements);
  } catch (err) {
    console.error('[achievements.getAchievements]', err);
    res.status(500).json({ error: 'Ошибка получения достижений' });
  }
};

const getMyAchievements = async (req, res) => {
  try {
    const myAchievements = await achievementsService.getMyAchievements(req.user.id, req.restaurantId);
    res.json(myAchievements);
  } catch (err) {
    console.error('[achievements.getMyAchievements]', err);
    res.status(500).json({ error: 'Ошибка получения ваших достижений' });
  }
};

module.exports = {
  getIcons,
  getAchievements,
  getMyAchievements,
};
