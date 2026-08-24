require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 SkillServe API запущен на порту ${PORT}`);
});
