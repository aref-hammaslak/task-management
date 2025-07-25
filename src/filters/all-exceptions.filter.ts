import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger();
  constructor() {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const stack = exception instanceof Error ? exception.stack : undefined;
    const trace = process.env.NODE_ENV === 'development' ? stack : undefined;
    const message = this.getExceptionMessage(exception);
    this.logger.error(stack, JSON.stringify(message), 'AllExceptionsFilter');

    if (
      exception instanceof QueryFailedError ||
      exception instanceof ValidationError
    ) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: new Date().toISOString(),
        trace,
      });
    } else if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        success: false,
        statusCode: exception.getStatus(),
        timestamp: new Date().toISOString(),
        trace,
      });
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
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
