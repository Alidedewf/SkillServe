const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  let updatedCount = 0;
  for (const c of courses) {
    if (c.image_url && c.image_url.length > 2000) {
      await prisma.course.update({
        where: { id: c.id },
        data: { image_url: null }
      });
      console.log(`Cleared huge image for course ${c.id}`);
      updatedCount++;
    }
  }
  console.log(`Fixed ${updatedCount} courses.`);
  await prisma.$disconnect();
}
main();
