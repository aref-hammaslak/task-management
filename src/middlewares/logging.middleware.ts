import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from '../logger/winston.logger';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestTime = Date.now();
    res.on('finish', () => {
      const responseTime = Date.now() - requestTime;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;

      if (res.statusCode >= 400) {
        this.logger.error(message, undefined, 'LogMiddleware');
      } else {
        this.logger.log(message, 'LogMiddleware');
      }
    });
    next();
  }
}
