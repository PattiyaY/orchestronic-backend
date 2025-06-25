import { PrismaClient, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const usersData = Array.from({ length: 10 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement([Role.Admin, Role.IT, Role.Developer]),
  }));

  await prisma.user.createMany({ data: usersData });
}

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
