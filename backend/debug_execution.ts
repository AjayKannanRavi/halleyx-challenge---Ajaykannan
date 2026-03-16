import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.executionLog.findMany({
    orderBy: { started_at: 'desc' },
    take: 3
  });

  logs.forEach(log => {
    console.log('--- LOG ENTRY ---');
    console.log(`ID: ${log.id}`);
    console.log(`Step: ${log.step_name}`);
    console.log(`Started: ${log.started_at}`);
    console.log(`Duration: ${log.duration}`);
    console.log(`Evaluated Rules: ${log.evaluated_rules}`);
    console.log('-----------------\n');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
