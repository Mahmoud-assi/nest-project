import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface StandardResponse<T> {
  success: true;
  message?: string;
  data: T;
}

/**
 * ResponseWrapInterceptor - Wraps all successful responses in a standard shape
 * -------------------------------------------------------------------------
 * Like an Axios response interceptor: every handler return value becomes
 * { success: true, message?: string, data: ... }. If the handler returns
 * an object with { message, data } we use those; otherwise the whole
 * value becomes data.
 */
@Injectable()
export class ResponseWrapInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === 'object' &&
          'success' in value &&
          (value as { success: unknown }).success === true
        ) {
          return value as unknown as StandardResponse<T>;
        }
        if (
          value &&
          typeof value === 'object' &&
          'message' in value &&
          'data' in value
        ) {
          return {
            success: true,
            message: (value as { message: string }).message,
            data: (value as { data: T }).data,
          };
        }
        return {
          success: true,
          data: value as T,
        };
      }),
    );
  }
}
