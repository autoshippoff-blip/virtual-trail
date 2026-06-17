import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@trail/db';

@Injectable()
export class TenantsService {
  async getPublicTenantAnalytics(tenantId: string) {
    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const [productsCount, requestsCount, statusGroups, successfulRequests] = await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.tryonRequest.count({ where: { tenantId } }),
      prisma.tryonRequest.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.tryonRequest.findMany({
        where: { tenantId, status: 'completed' },
        select: { processingTimeMs: true, complimentCached: true, createdAt: true },
      }),
    ]);

    const statusBreakdown = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const completedCount = statusBreakdown['completed'] || 0;
    const failedCount = statusBreakdown['failed'] || 0;
    const queuedCount = statusBreakdown['queued'] || 0;
    const processingCount = statusBreakdown['processing'] || 0;
    
    // Success rate
    const successRate = requestsCount > 0 ? (completedCount / (completedCount + failedCount || 1)) * 100 : 100;

    // Average processing time
    const validProcessingTimes = successfulRequests.filter(req => req.processingTimeMs !== null);
    const totalProcessingTime = validProcessingTimes.reduce((sum, req) => sum + (req.processingTimeMs || 0), 0);
    const avgProcessingTimeMs = validProcessingTimes.length > 0 ? totalProcessingTime / validProcessingTimes.length : 0;

    // Get requests for the current month for a chart
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const thisMonthDaily: Record<string, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      // Create date string in YYYY-MM-DD format
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      thisMonthDaily[dateStr] = 0;
    }

    let thisMonthTotal = 0;

    successfulRequests.forEach(req => {
      if (req.createdAt.getFullYear() === currentYear && req.createdAt.getMonth() === currentMonth) {
        thisMonthTotal++;
        const dateStr = req.createdAt.toISOString().split('T')[0];
        if (thisMonthDaily[dateStr] !== undefined) {
          thisMonthDaily[dateStr]++;
        }
      }
    });

    return {
      tenantName: tenant.name,
      shopifyDomain: tenant.shopifyDomain,
      totalTryons: requestsCount,
      completedCount,
      failedCount,
      queuedCount,
      processingCount,
      successRate: parseFloat(successRate.toFixed(2)),
      avgProcessingTimeMs: Math.round(avgProcessingTimeMs),
      activeProducts: productsCount,
      thisMonthTotal,
      thisMonthDaily: Object.keys(thisMonthDaily).map(date => ({ date, count: thisMonthDaily[date] })),
    };
  }
}
