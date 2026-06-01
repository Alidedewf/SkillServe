const fs = require('fs');
const path = require('path');
const prisma = require('../../prisma');

const getIcons = async (protocol, host) => {
  const iconsDir = path.join(__dirname, '../../../public/achievements');
  if (!fs.existsSync(iconsDir)) {
    return [];
  }
  const files = fs.readdirSync(iconsDir);
  return files
    .filter((file) => /\.(png|jpg|jpeg|svg|webp)$/i.test(file))
    .map((file) => ({
      id: file,
      url: `${protocol}://${host}/public/achievements/${file}`,
    }));
};

const getAchievements = async (restaurantId) => {
  const where = {};
  if (restaurantId) where.restaurant_id = restaurantId;

  return prisma.achievement.findMany({
    where,
    orderBy: { id: 'asc' },
  });
};

const getMyAchievements = async (userId, restaurantId) => {
  const achievementFilter = restaurantId ? { restaurant_id: restaurantId } : {};
  const userAchievements = await prisma.userAchievement.findMany({
    where: {
      user_id: userId,
      achievement: achievementFilter,
    },
    include: { achievement: true },
    orderBy: { earned_at: 'desc' },
  });

  return userAchievements.map((ua) => ({
    id: ua.achievement.id,
    title: ua.achievement.title,
    description: ua.achievement.description,
    image_url: ua.achievement.image_url,
    earned_at: ua.earned_at,
  }));
};

module.exports = {
  getIcons,
  getAchievements,
  getMyAchievements,
};
