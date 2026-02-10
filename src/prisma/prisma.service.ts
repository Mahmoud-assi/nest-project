import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - NestJS wrapper for Prisma Client
 * -------------------------------------------------------------------------
 * WHY: Prisma gives you a client to talk to the DB. In Nest we inject it as
 * a service so every module can use the same connection and we can hook into
 * lifecycle (connect on startup, disconnect on shutdown).
 * Prisma 7+ requires a driver adapter (e.g. @prisma/adapter-pg) for PostgreSQL.
 *
 * WHEN TO USE: Inject this in any service that needs to read/write the database.
 * Example: this.prisma.user.findMany()
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  /**
   * OnModuleInit - runs when the app starts (like useEffect with [] in React).
   * We connect to the database here so we're ready before handling requests.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * OnModuleDestroy - runs when the app shuts down. Disconnecting cleanly
   * avoids leaving open connections.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
