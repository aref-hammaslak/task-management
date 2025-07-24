import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WinstonLogger } from '../logger/winston.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.getExceptionMessage(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(stack, JSON.stringify(message), 'AllExceptionsFilter');

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      trace: process.env.NODE_ENV === 'development' ? stack : undefined,
    });
  }

  getExceptionMessage(exception: unknown): string | string[] {
    if (process.env.NODE_ENV === 'development') {
      return exception instanceof HttpException
        ? (exception.getResponse() as { message: string | string[] }).message
        : 'Internal server error';
    }
    return 'Internal server error';
  }
}
