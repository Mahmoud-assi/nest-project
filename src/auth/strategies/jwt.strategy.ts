import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JwtStrategy - Validates JWT and attaches user to request
 * -------------------------------------------------------------------------
 * WHY: When a request has "Authorization: Bearer <token>", Passport runs
 * this strategy. It decodes the JWT, checks signature, and calls validate().
 * Whatever you return from validate() is set on request.user (so controllers
 * can use @Req() req and req.user).
 *
 * WHEN TO USE: Used automatically by JwtAuthGuard. You don't call this directly.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      // Where to get the token from (header: Bearer <token>)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'default-secret-change-in-production',
    });
  }

  /**
   * Called after JWT is decoded. Payload = { sub: userId, email }. We load
   * full user and return it so request.user is the user object.
   */
  async validate(payload: { sub: string; email: string }) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
