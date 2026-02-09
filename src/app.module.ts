import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

/**
 * AppModule - Root module (like the main App in React)
 * -------------------------------------------------------------------------
 * Every Nest app has one root module. We import:
 * - ConfigModule: loads .env and gives ConfigService for JWT_SECRET, DATABASE_URL, etc.
 * - PrismaModule: global DB client (PrismaService)
 * - UsersModule: user CRUD
 * - AuthModule: login, sign-up, forgot-password, JWT
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
