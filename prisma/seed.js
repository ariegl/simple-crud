import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { id: 1, name: 'super_admin' },
    { id: 2, name: 'admin' },
    { id: 3, name: 'moderator' },
    { id: 4, name: 'support' },
    { id: 5, name: 'user' },
    { id: 6, name: 'guest' },
  ];

  console.log('Seeding roles...');

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: role,
    });
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
