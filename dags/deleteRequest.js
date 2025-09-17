import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteRequest(requestId) {
  try {
    const deleted = await prisma.request.delete({
      where: { id: requestId },
    });
    console.log(`Request ${requestId} deleted successfully.`);
    return deleted;
  } catch (error) {
    console.error('Error deleting request:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const requestId = process.argv[2];
if (!requestId) {
  console.error('Please provide a request ID as argument.');
  process.exit(1);
}

deleteRequest(requestId);
