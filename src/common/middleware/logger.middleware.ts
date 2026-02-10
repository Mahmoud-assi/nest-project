import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware - Log every request (method, URL, status code)
 * -------------------------------------------------------------------------
 * Like the browser Network tab: you see method, URL, and when the response
 * finishes you see the status code. We use res.on('finish') so we log after
 * the response is sent (status code is available then).
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`,
      );
    });
    next();
  }
}
