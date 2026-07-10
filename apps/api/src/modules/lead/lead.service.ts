import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { config as appConfig } from '@trail/config';
import {
  createLead,
  getLeadByTryonRequestId,
  getLeadByPhone,
  updateLead,
  getLeadsForTenant,
  getTryonRequest,
} from '@trail/db';
import { getSignedReadUrl } from '@trail/storage';
import { CreateLeadDto, UnlockTryonDto, LeadResponse } from './lead.dto';

@Injectable()
export class LeadService {
  private readonly logger: Logger;
  private redis: Redis;

  constructor() {
    this.logger = new Logger(LeadService.name);
    this.redis = new Redis(appConfig.redis.url, { maxRetriesPerRequest: null });
  }

  async generateUnlockToken(tenantId: string, tryonRequestId: string): Promise<string> {
    // Check if token already generated for this tryon job to remain stable across polling/retries
    const existingTokenKey = `tryon:${tryonRequestId}:unlock_token`;
    const cachedToken = await this.redis.get(existingTokenKey);
    if (cachedToken) {
      // Refresh TTL
      await this.redis.expire(`unlock:${cachedToken}`, 86400);
      await this.redis.expire(existingTokenKey, 86400);
      return cachedToken;
    }

    const token = `${uuidv4()}-${uuidv4().slice(0, 8)}`;
    const payload = JSON.stringify({ tenantId, tryonRequestId });

    await this.redis.set(`unlock:${token}`, payload, 'EX', 86400); // 24 hours
    await this.redis.set(existingTokenKey, token, 'EX', 86400);

    return token;
  }

  async createOrUpdateLead(tenantId: string, dto: CreateLeadDto): Promise<LeadResponse> {
    // 1. Validate TryOnRequest ownership & status
    const tryon = await getTryonRequest(dto.tryonRequestId);
    if (!tryon || tryon.tenantId !== tenantId) {
      throw new NotFoundException(`TryOnRequest ${dto.tryonRequestId} not found or tenant mismatch`);
    }
    if (tryon.status !== 'completed') {
      throw new BadRequestException('Try-On job must be completed before capturing lead details');
    }

    // 2. Idempotency Check — if lead already captured for this specific tryonRequestId, return immediately
    const existingByTryon = await getLeadByTryonRequestId(dto.tryonRequestId);
    if (existingByTryon) {
      this.logger.debug(`[Idempotent Lead] Lead already exists for tryonRequestId: ${dto.tryonRequestId}`);
      const unlockToken = await this.generateUnlockToken(tenantId, tryon.id);
      return {
        success: true,
        leadId: existingByTryon.id,
        unlockToken,
        requiresLeadCapture: false,
      };
    }

    // 3. Deduplication by Phone across the tenant
    const existingByPhone = await getLeadByPhone(tenantId, dto.countryCode, dto.phoneNumber);
    const now = new Date();
    const consentDate = dto.marketingConsent !== false ? now : null;

    let leadId: string;

    if (existingByPhone) {
      this.logger.log(`[Lead Deduplication] Existing contact found for phone ${dto.countryCode}${dto.phoneNumber} on tenant ${tenantId}. Consolidating profile.`);
      // Update existing lead contact info & increment interaction activity
      await updateLead(existingByPhone.id, {
        customerName: dto.customerName,
        marketingConsentAt: consentDate ?? existingByPhone.marketingConsentAt,
        campaignCount: { increment: 1 },
      });

      // Create distinct Lead record for this tryon job so 1:1 relation is preserved for image history
      const newJobLead = await createLead({
        tenantId,
        tryonRequestId: tryon.id,
        customerName: dto.customerName,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        marketingConsentAt: consentDate,
        status: existingByPhone.status || 'NEW',
      });
      leadId = newJobLead.id;
    } else {
      // Create fresh lead profile
      const newLead = await createLead({
        tenantId,
        tryonRequestId: tryon.id,
        customerName: dto.customerName,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        marketingConsentAt: consentDate,
        status: 'NEW',
      });
      leadId = newLead.id;
    }

    // Clear cached response so polling getStatus returns full imageUrl now that lead is captured
    await this.redis.del(`tryon:${tryon.id}:response`);

    // 4. Generate Unlock Token for revealing final high-res image
    const unlockToken = await this.generateUnlockToken(tenantId, tryon.id);


    return {
      success: true,
      leadId,
      unlockToken,
      requiresLeadCapture: false,
    };
  }

  async unlockTryon(tenantId: string, dto: UnlockTryonDto): Promise<{
    status: string;
    imageUrl: string;
    downloadUrl: string;
    compliment?: string;
    styleScore?: number;
  }> {
    const cached = await this.redis.get(`unlock:${dto.unlockToken}`);
    if (!cached) {
      throw new UnauthorizedException('Invalid or expired unlock token');
    }

    const { tenantId: tokenTenantId, tryonRequestId } = JSON.parse(cached);
    if (tokenTenantId !== tenantId) {
      this.logger.warn(`[Cross-Tenant Attempt] Unlock token tenant ${tokenTenantId} mismatched with requester ${tenantId}`);
      throw new UnauthorizedException('Cross-tenant unlock token access forbidden');
    }

    // Verify lead actually exists for this job before granting R2 URL access
    const lead = await getLeadByTryonRequestId(tryonRequestId);
    if (!lead) {
      throw new UnauthorizedException('Lead capture is required prior to unlocking generated image');
    }

    const tryon = await getTryonRequest(tryonRequestId);
    if (!tryon || !tryon.generatedImageKey) {
      throw new NotFoundException('Generated Try-On image not found in storage');
    }

    const imageUrl = await getSignedReadUrl(tryon.generatedImageKey);

    return {
      status: tryon.status,
      imageUrl,
      downloadUrl: imageUrl,
      compliment: tryon.compliment ?? undefined,
      styleScore: tryon.styleScore ?? undefined,
    };
  }

  async getLeadsByTenant(tenantId: string, options?: { productId?: string; status?: string }) {
    return getLeadsForTenant(tenantId, options);
  }
}
