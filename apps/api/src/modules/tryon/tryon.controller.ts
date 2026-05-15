import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TenantGuard } from '../../guards/tenant.guard';
import { TryonService } from './tryon.service';
import { CreateTryonDto, TryonResponse, TryonStatusResponse } from './tryon.dto';

@Controller('v1/tryon')
export class TryonController {
  constructor(private readonly tryonService: TryonService) {}

  @Post()
  @UseGuards(TenantGuard)
  async create(
    @Body() dto: CreateTryonDto,
    @Req() req: any,
  ): Promise<TryonResponse> {
    const requestId = req.requestId;
    return this.tryonService.create(dto, requestId);
  }

  @Get(':jobId')
  @UseGuards(TenantGuard)
  async getStatus(
    @Param('jobId') jobId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<TryonStatusResponse> {
    return this.tryonService.getStatus(jobId, tenantId);
  }
}
