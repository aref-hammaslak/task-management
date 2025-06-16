import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from './logger/winston.logger';
import { LoggingMiddleware } from './middlewares/logging.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logger = WinstonLogger.getLogger(configService);

  app.useLogger(logger);
  app.use(new LoggingMiddleware().use.bind(new LoggingMiddleware()));
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('api.corsOrigin'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  const port = configService.get<number>('api.port') || 3000;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
