import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ─── Global Validation Pipe ──────────────────────────────────────
  // Strips unknown properties and automatically validates all
  // incoming request DTOs decorated with class-validator decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip props not in DTO
      forbidNonWhitelisted: true, // throw if extra props are sent
      transform: true, // auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // convert primitives (e.g. '1' → 1)
      },
    }),
  );

  // ─── CORS ────────────────────────────────────────────────────────
  // Allows the Next.js frontend to communicate with this API.
  // Tighten `origin` to your production domain(s) before go-live.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Global prefix (optional) ────────────────────────────────────
  // Uncomment to prefix every route with /api (e.g. /api/users)
  // app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Eduverse API is running on: http://localhost:${port}`);
}

bootstrap();
