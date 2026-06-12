const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@matter.kz' } });
    if (admin) {
      console.log('Admin user exists:', admin.email, admin.role);
    } else {
      console.log('Admin user NOT FOUND');
    }
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
