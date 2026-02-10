import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{
    status: 'ok';
    timestamp: string;
    database: 'connected' | 'disconnected';
    uptime: number;
  }> {
    let database: 'connected' | 'disconnected' = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      // leave as disconnected
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
      uptime: process.uptime(),
    };
  }
}
