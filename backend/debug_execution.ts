import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const executions = await prisma.execution.findMany({
    include: {
      logs: true,
      workflow: {
        include: {
          steps: {
            include: {
              rules: true
            }
          }
        }
      }
    },
    orderBy: { started_at: 'desc' },
    take: 1
  });

  console.log(JSON.stringify(executions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
