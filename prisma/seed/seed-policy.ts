import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.policyVM.deleteMany({});
  await prisma.policyDatabase.deleteMany({});
  await prisma.policyStorage.deleteMany({});

  await prisma.policyVM.create({
    data: {
      name: 'Standard_B1ls',
      numberOfCores: 1,
      memoryInMB: 512,
      cloudProvider: 'AZURE',
    },
  });
  await prisma.policyDatabase.create({
    data: {
      maxStorage: 100,
      cloudProvider: 'AZURE',
    },
  });
  await prisma.policyStorage.create({
    data: {
      maxStorage: 200,
      cloudProvider: 'AZURE',
    },
  });
}

main()
  .catch((e) => {
    console.error('Error seeding policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
