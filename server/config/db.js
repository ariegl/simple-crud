import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test database connection
(async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database with Prisma!');
  } catch (err) {
    console.error('Error connecting to database with Prisma:', err);
  }
})();

export default prisma;
