const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true }});
  console.log('ALL USERS:');
  users.forEach(u => console.log(u.role, u.email));

  // Reset all admins and super admins to 123456
  const newHash = await bcrypt.hash('123456', 10);
  for (const u of users) {
    if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.role.includes('ADMIN')) {
      await prisma.user.update({ where: { id: u.id }, data: { password: newHash } });
      console.log(`Updated password for ${u.email} to 123456`);
    }
  }

  await prisma.$disconnect();
}
main();
