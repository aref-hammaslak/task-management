import { createLogger, Logger, LoggerOptions } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Injectable, LoggerService } from '@nestjs/common';

// Logger class
@Injectable()
export class WinstonLogger implements LoggerService {
  private static instance: Logger;
  private static configService: ConfigService;

  constructor(private readonly configService: ConfigService) {}

  private static getInstance(): Logger {
    if (!WinstonLogger.instance) {
      const env = process.env.NODE_ENV || 'development';
      const config: LoggerOptions =
        env === 'production'
          ? (WinstonLogger.configService.get(
              'logger.prodConfig',
            ) as LoggerOptions)
          : (WinstonLogger.configService.get(
              'logger.devConfig',
            ) as LoggerOptions);

      if (!config) {
        throw new Error('Logger configuration not found');
      }

      WinstonLogger.instance = createLogger(config);
    }
    return WinstonLogger.instance;
  }

  public static getLogger(configService?: ConfigService): WinstonLogger {
    WinstonLogger.configService = configService || new ConfigService();
    return new WinstonLogger(WinstonLogger.configService);
  }

  // Implement LoggerService interface methods
  log(message: any, context?: string): void {
    const formattedMessage = this.formatMessage(message);
    WinstonLogger.getInstance().info(formattedMessage, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    const formattedMessage = this.formatMessage(message);
    WinstonLogger.getInstance().error(formattedMessage, {
      context,
      trace: trace || (message instanceof Error ? message.stack : undefined),
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: any, context?: string): void {
    const formattedMessage = this.formatMessage(message);
    WinstonLogger.getInstance().warn(formattedMessage, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  debug(message: any, context?: string): void {
    const formattedMessage = this.formatMessage(message);
    WinstonLogger.getInstance().debug(formattedMessage, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  verbose(message: any, context?: string): void {
    const formattedMessage = this.formatMessage(message);
    WinstonLogger.getInstance().verbose(formattedMessage, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  private formatMessage(message: any): string {
    if (message instanceof Error) {
      return message.message;
    }

    if (typeof message === 'object') {
      return JSON.stringify(message);
    }

    return message as string;
  }
}
