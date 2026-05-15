import { prisma } from './libs/db/src/index';

async function main() {
  try {
    const tenants = await prisma.tenant.findMany({ include: { config: true } });
    console.log('Tenants:', JSON.stringify(tenants, null, 2));

    const products = await prisma.product.findMany();
    console.log('Products:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
