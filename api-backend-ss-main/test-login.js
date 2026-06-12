const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@matter.kz' } });
    if (admin) {
      console.log('Admin found.');
      const pwds = ['123456', '12345678', 'password', 'admin', 'admin123', 'admin@matter.kz'];
      for (const p of pwds) {
        const isMatch = await bcrypt.compare(p, admin.password);
        if (isMatch) {
          console.log(`PASSWORD IS: ${p}`);
          return;
        }
      }
      console.log('Password is none of the common ones. Hash:', admin.password);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
