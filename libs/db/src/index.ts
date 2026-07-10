import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '@trail/config';

export * from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

// Repository functions

export async function createTenant(data: Prisma.TenantCreateInput) {
  return prisma.tenant.create({ data });
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { config: true },
  });
}

export async function getTenantByDomain(shopifyDomain: string) {
  return prisma.tenant.findUnique({
    where: { shopifyDomain },
    include: { config: true },
  });
}

export async function getTenantConfig(tenantId: string) {
  return prisma.tenantConfig.findUnique({
    where: { tenantId },
  });
}

export async function createTryonRequest(data: Prisma.TryonRequestUncheckedCreateInput) {
  return prisma.tryonRequest.create({ data });
}

export async function updateTryonRequest(id: string, data: Prisma.TryonRequestUpdateInput) {
  return prisma.tryonRequest.update({
    where: { id },
    data,
  });
}

export async function getTryonRequest(id: string) {
  return prisma.tryonRequest.findUnique({
    where: { id },
    include: { product: true },
  });
}

export async function getTenantWithConfig(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { config: true },
  });
}

export async function getProductByTenantAndShopifyId(tenantId: string, shopifyProductId: string) {
  return prisma.product.findUnique({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId,
      },
    },
  });
}

export async function createProduct(data: Prisma.ProductUncheckedCreateInput) {
  return prisma.product.create({ data });
}

export async function updateProductGarmentImageOverride(tenantId: string, shopifyProductId: string, imageUrl: string | null) {
  return prisma.product.update({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId,
      },
    },
    data: {
      preferredGarmentImage: imageUrl,
    },
  });
}

export async function updateProductSyncedImages(tenantId: string, shopifyProductId: string, images: any[]) {
  return prisma.product.update({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId,
      },
    },
    data: {
      images: images as any,
    },
  });
}

export async function createAuditLog(data: Prisma.AuditLogUncheckedCreateInput) {
  return prisma.auditLog.create({ data });
}

export async function getTryonRequestsForCleanup(userImageOlderThanMs: number, generatedImageOlderThanMs: number) {
  const now = new Date();
  const userCutoff = new Date(now.getTime() - userImageOlderThanMs);
  const generatedCutoff = new Date(now.getTime() - generatedImageOlderThanMs);

  return prisma.tryonRequest.findMany({
    where: {
      OR: [
        {
          userImageKey: { not: null },
          createdAt: { lt: userCutoff },
        },
        {
          generatedImageKey: { not: null },
          createdAt: { lt: generatedCutoff },
        },
      ],
    },
  });
}

export async function getTryonRequestsForTenant(tenantId: string) {
  return prisma.tryonRequest.findMany({
    where: { tenantId },
  });
}

export async function purgeTenantFromDb(id: string) {
  return prisma.tenant.delete({
    where: { id },
  });
}

// Lead Repository functions

export async function createLead(data: Prisma.LeadUncheckedCreateInput) {
  return prisma.lead.create({ data });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      tryonRequest: {
        include: { product: true },
      },
    },
  });
}

export async function getLeadByTryonRequestId(tryonRequestId: string) {
  return prisma.lead.findUnique({
    where: { tryonRequestId },
    include: {
      tryonRequest: {
        include: { product: true },
      },
    },
  });
}

export async function getLeadsForTenant(tenantId: string, options?: { productId?: string; status?: string }) {
  const where: Prisma.LeadWhereInput = { tenantId };
  if (options?.productId) {
    where.tryonRequest = { productId: options.productId };
  }
  if (options?.status) {
    where.status = options.status;
  }

  return prisma.lead.findMany({
    where,
    include: {
      tryonRequest: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateLeadStatus(id: string, status: string) {
  return prisma.lead.update({
    where: { id },
    data: { status },
  });
}

export async function getLeadByPhone(tenantId: string, countryCode: string, phoneNumber: string) {
  return prisma.lead.findFirst({
    where: {
      tenantId,
      countryCode,
      phoneNumber,
    },
    include: {
      tryonRequest: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({
    where: { id },
    data,
  });
}



