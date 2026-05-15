import { Controller, Get } from '@nestjs/common';
import { prisma } from '@trail/db';

@Controller()
export class AppController {
  @Get('health')
  async getHealth() {
    // Basic check
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch (e) {
      return { status: 'error', db: 'down' };
    }
  }
}
