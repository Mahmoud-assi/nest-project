import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { HttpExceptionI18nFilter } from './common/filters/http-exception-i18n.filter';
import { ResponseWrapInterceptor } from './common/interceptors/response-wrap.interceptor';

/**
 * bootstrap() - Entry point of the Nest app (like index.js in Express)
 * -------------------------------------------------------------------------
 * We create the app, enable global validation (so DTOs are validated on every request),
 * set up Swagger docs, then listen on a port. I18nValidationPipe validates DTOs and
 * returns error messages in the request language (Accept-Language or ?lang=).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: true }); // allow all origins (tighten for production, e.g. ['https://myapp.com'])

  // Global validation with i18n: validation errors are translated (e.g. ar/en)
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter(),
    new HttpExceptionI18nFilter(),
  );
  app.useGlobalInterceptors(new ResponseWrapInterceptor());

  // Swagger (OpenAPI) - professional docs for frontend and interview demos
  const config = new DocumentBuilder()
    .setTitle('Clinic Booking API')
    .setDescription(
      'Full-stack clinic booking: Auth (JWT), Roles (ADMIN/DOCTOR/PATIENT), Appointments with Prisma transactions, Working hours, Medical record uploads, i18n (en/ar). Error messages use i18n keys (e.g. common.USER_NOT_FOUND) and are translated by Accept-Language or ?lang=.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}
void bootstrap();
