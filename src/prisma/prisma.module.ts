import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - makes PrismaService available everywhere
 * -------------------------------------------------------------------------
 * WHY: We want to inject PrismaService in UserService, AuthService, etc.
 * without importing PrismaModule in every module. @Global() does that:
 * once AppModule imports PrismaModule, any service can inject PrismaService.
 *
 * WHEN TO USE: Import PrismaModule only in AppModule (root). Then any
 * feature module can use PrismaService without importing this module again.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
