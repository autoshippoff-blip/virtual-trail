import { IsString, IsNotEmpty, IsBase64 } from 'class-validator';

export class CreateTryonDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  userImage!: string;
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
