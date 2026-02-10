import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClinicModule } from './clinic/clinic.module';
import { UploadModule } from './upload/upload.module';
import { HealthModule } from './health/health.module';
import { AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

/**
 * AppModule - Root module (like the main App in React)
 * -------------------------------------------------------------------------
 * - EventEmitterModule: for background tasks (e.g. send email on appointment booked).
 * - UploadModule: medical report uploads (Multer + MedicalRecord).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        // At runtime __dirname is dist/src; lang is copied to dist/lang by nest-cli assets
        path: path.join(__dirname, '..', 'lang'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ClinicModule,
    UploadModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
