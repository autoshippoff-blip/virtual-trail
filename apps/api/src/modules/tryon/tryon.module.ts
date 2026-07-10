import { Module } from '@nestjs/common';
import { TryonController } from './tryon.controller';
import { TryonService } from './tryon.service';
import { LeadModule } from '../lead/lead.module';

@Module({
  imports: [LeadModule],
  controllers: [TryonController],
  providers: [TryonService],
})
export class TryonModule {}

