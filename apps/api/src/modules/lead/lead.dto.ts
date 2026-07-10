import { IsString, IsNotEmpty, IsBoolean, IsOptional, Matches } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsOptional()
  tenantApiKey?: string;

  @IsString()
  @IsNotEmpty()
  tryonRequestId!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'PhoneNumber must be a valid phone format (digits only or leading +)' })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?\d{1,4}$/, { message: 'CountryCode must be a valid dial code (e.g., +1, +91)' })
  countryCode!: string;

  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;
}

export class UnlockTryonDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsOptional()
  tenantApiKey?: string;

  @IsString()
  @IsNotEmpty()
  unlockToken!: string;
}

export interface LeadResponse {
  success: boolean;
  leadId: string;
  unlockToken: string;
  requiresLeadCapture: boolean;
}
