import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../guards/tenant.guard';

@Controller('v1/tenant')
export class TenantsController {
  @Get(':tenantId/config')
  @UseGuards(TenantGuard)
  async getConfig(@Req() req: any) {
    const tenant = req.tenant;
    return {
      primaryColor: tenant.primaryColor,
      complimentTone: tenant.complimentTone,
      logoUrl: tenant.logoUrl,
      features: tenant.features,
    };
  }
}
