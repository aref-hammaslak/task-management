import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  use(req: Request, res: Response, next: NextFunction) {
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
