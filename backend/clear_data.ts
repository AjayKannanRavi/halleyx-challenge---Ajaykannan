import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.executionLog.deleteMany();
  await prisma.execution.deleteMany();
  console.log('Cleared executions and logs.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
