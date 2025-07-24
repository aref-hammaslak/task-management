import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './configs/database.config';
import { AuthModule } from './modules/auth/auth.module';
import authConfig from './configs/auth.config';
import apiConfig from './configs/api.config';
import loggerConfig from './configs/logger.config';
import { WinstonLogger } from './logger/winston.logger';
import { LoggingMiddleware } from './middlewares/logging.middleware';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, authConfig, apiConfig, loggerConfig],
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WinstonLogger,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
