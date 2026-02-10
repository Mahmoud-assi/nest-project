import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

/**
 * HttpExceptionI18nFilter - Translates exception messages that are i18n keys
 * -------------------------------------------------------------------------
 * When a service throws e.g. NotFoundException('common.USER_NOT_FOUND'), this
 * filter translates the key using the request language (set by Accept-Language
 * or ?lang=) and returns the translated message in the JSON response.
 */
@Catch(HttpException)
export class HttpExceptionI18nFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception.message;
    const rawMessage = Array.isArray(message) ? message[0] : message;

    const i18n = I18nContext.current(host);
    const translatedMessage =
      i18n && typeof rawMessage === 'string' && this.looksLikeKey(rawMessage)
        ? (i18n.t as (k: string) => string)(rawMessage)
        : rawMessage;

    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? { ...(exceptionResponse as object), message: translatedMessage }
        : { statusCode: status, message: translatedMessage };

    res.status(status).json(body);
  }

  private looksLikeKey(msg: string): boolean {
    return /^common\.\w+$/.test(msg);
  }
}
