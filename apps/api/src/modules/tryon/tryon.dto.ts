import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateTryonDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  userImage!: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsNumber()
  @IsOptional()
  timestamp?: number;
}

export interface TryonResponse {
  jobId: string;
}

export interface TryonStatusResponse {
  status: string;
  imageUrl?: string;
  compliment?: string;
  styleScore?: number;
  complimentCached?: boolean;
}
