import { prisma } from './libs/db/src/index';

async function main() {
  const tenantId = '393c3474-7c52-4625-9d4b-6e187c11142a';
  await prisma.tenantConfig.update({
    where: { tenantId },
    data: { segmindModel: 'segfit' }
  });
  console.log('Updated segmindModel to segfit');
  await prisma.$disconnect();
}

main();
