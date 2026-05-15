import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { resolveTenantConfig, TenantNotFoundError } from '@trail/tenant';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check body, then query, then params
    const tenantId = 
      request.body?.tenantId || 
      request.query?.tenantId || 
      request.params?.tenantId;

    if (!tenantId) {
      return true; // Or throw 400 if you want it required everywhere
    }

    try {
      const config = await resolveTenantConfig(tenantId);
      request.tenant = config;
      return true;
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(`Tenant not found: ${tenantId}`);
      }
      throw error;
    }
  }
}
