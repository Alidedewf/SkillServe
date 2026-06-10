const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  let totalLength = 0;
  for (const c of courses) {
    const len = JSON.stringify(c).length;
    totalLength += len;
    if (len > 100000) {
      console.log(`Course ${c.id} "${c.title}" length: ${Math.round(len/1024)} KB`);
    }
  }
  console.log('Total JSON length for all courses:', totalLength);
  await prisma.$disconnect();
}
main();
