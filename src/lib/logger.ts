import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { isProd, isTest } from '../../env.ts';

export const logger = pino({
  level: isProd() ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'otp',
      '*.password',
      '*.otp',
      '*.token',
      '*.jwt',
    ],
    censor: '[REDACTED]',
  },
  transport: isProd()
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});

// Typed helper so every module gets a consistent, discoverable pattern
export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}

export const httpLogger = pinoHttp({
  logger,
  level: isTest() ? 'silent' : 'info',
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, _) => `${req.method} ${req.url} completed`,
  customErrorMessage: (req, _, err) => `${req.method} ${req.url} message: ${err.message}`,
  customErrorObject: (_req, res, err, errorObject) => {
    // this is done so we could avoid showing err object console when faile with 500
    if (err.message === `failed with status code ${res.statusCode}`) {
      return { res: errorObject.res, responseTime: errorObject.responseTime };
    }
    return errorObject;
  },
  autoLogging: {
    ignore: req => req.url === '/api/v1/health',
  },
  serializers: {
    req: req => ({ method: req.method, url: req.url, id: req.id }),
    res: res => ({ statusCode: res.statusCode }),
  },
});
