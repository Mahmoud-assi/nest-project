import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - Protects routes so only authenticated users can access
 * -------------------------------------------------------------------------
 * WHY: Apply @UseGuards(JwtAuthGuard) on any route that requires login.
 * If the request has no valid JWT (or invalid/expired), Passport returns 401.
 *
 * WHEN TO USE: Add @UseGuards(JwtAuthGuard) on controller methods or the
 * whole controller. Optionally add @ApiBearerAuth() for Swagger to show the lock icon.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
