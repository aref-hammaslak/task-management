import { format, transports } from 'winston';

type LogFormat = {
  timestamp: string;
  level: string;
  stack: string;
  message: string;
  context?: string;
};

const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
);

const consoleFormat = format.combine(
  baseFormat,
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, stack, message, context }: LogFormat) => {
    const logMessage =
      typeof message === 'object' ? JSON.stringify(message) : message;
    const contextStr = context ? `[${context}] ` : '';
    const stackStr = stack ? `\n${stack}` : '';
    const messageContent = `${timestamp} - [${level.padEnd(7)}] - ${contextStr}${logMessage}${stackStr}`;
    return messageContent;
  }),
);

// Production format
const prodFormat = format.combine(baseFormat, format.json());

export default () => ({
  logger: {
    devConfig: {
      level: 'debug',
      format: consoleFormat,
      transports: [
        new transports.Console({
          level: 'debug',
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    },
    prodConfig: {
      level: 'info',
      format: prodFormat,
      transports: [
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          handleExceptions: true,
          handleRejections: true,
        }),
        new transports.File({
          filename: 'logs/combined.log',
          handleExceptions: true,
          handleRejections: true,
        }),
        new transports.Console({
          level: 'info',
          format: consoleFormat,
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    },
  },
});
