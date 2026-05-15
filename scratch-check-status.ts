import { prisma } from './libs/db/src/index';

async function main() {
  const request = await prisma.tryonRequest.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Latest Request Status:', JSON.stringify(request, null, 2));
  await prisma.$disconnect();
}

main();
