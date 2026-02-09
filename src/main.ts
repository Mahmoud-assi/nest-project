import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * bootstrap() - Entry point of the Nest app (like index.js in Express)
 * -------------------------------------------------------------------------
 * We create the app, enable global validation (so DTOs are validated on every request),
 * set up Swagger docs, then listen on a port. ValidationPipe with whitelist: true
 * strips any property not in the DTO (security); forbidNonWhitelisted returns 400
 * if client sends extra fields.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation: class-validator runs on every request body that has a DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (OpenAPI) docs - available at /api when the app is running
  const config = new DocumentBuilder()
    .setTitle('Nest Tutorial API')
    .setDescription('User CRUD + Auth (login, sign-up, forgot-password). Try endpoints from here.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}
bootstrap();
