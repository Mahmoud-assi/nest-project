import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants/roles';

export const PERMISSIONS_KEY = 'permissions';

/**
 * @CheckPermissions - Restrict route access by role (from DB, set by JwtAuthGuard)
 * -------------------------------------------------------------------------
 * Use after @UseGuards(JwtAuthGuard) so req.user is set. The guard checks
 * req.user.role (loaded in JwtStrategy) against the allowed roles.
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @CheckPermissions(Role.ADMIN)
 * @Get('admin-only')
 * adminOnly() { ... }
 */
export const CheckPermissions = (...roles: Role[]) =>
  SetMetadata(PERMISSIONS_KEY, roles);
