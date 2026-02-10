import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants/roles';
import { PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';

/**
 * PermissionsGuard - Ensures the authenticated user's role is allowed
 * -------------------------------------------------------------------------
 * Reads @CheckPermissions(...roles) from the handler/class and checks
 * request.user.role (set by JwtAuthGuard + JwtStrategy from DB). If the user's
 * role is not in the list, throws ForbiddenException with i18n key so the
 * global filter can translate it.
 *
 * Use after JwtAuthGuard so req.user exists.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    const hasRole = user?.role && requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('common.FORBIDDEN');
    }
    return true;
  }
}
