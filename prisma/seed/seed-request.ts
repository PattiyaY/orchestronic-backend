// prisma/seed.ts
import { faker } from '@faker-js/faker/.';
import { PrismaClient } from '@prisma/client';
import { generateRepoName } from 'src/lib/utils';

const prisma = new PrismaClient();

async function main() {}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error('❌ Seeding error:', e.message);
    } else {
      console.error('❌ Seeding error:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
``;
