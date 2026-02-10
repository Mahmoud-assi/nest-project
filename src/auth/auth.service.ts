import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * AuthService - Handles login, sign-up, JWT creation, forgot/reset password
 * -------------------------------------------------------------------------
 * WHY SEPARATE FROM UsersService: Auth is a different concern (tokens, sessions,
 * password reset). Keeping it in AuthService avoids bloating UsersService and
 * follows single responsibility. AuthService uses UsersService for registration.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Sign up = create user + return JWT so they're logged in immediately.
   */
  async signUp(dto: SignUpDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    const token = await this.createToken(user.id, user.email);
    return { user, access_token: token };
  }

  /**
   * Login: find user, compare password, return JWT.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('common.UNAUTHORIZED');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('common.UNAUTHORIZED');
    }
    const token = await this.createToken(user.id, user.email);
    return {
      user: this.usersService.omitPassword(user),
      access_token: token,
    };
  }

  /**
   * Create JWT payload and sign it. Payload is available in request.user when using JwtAuthGuard.
   */
  async createToken(sub: string, email: string): Promise<string> {
    const payload = { sub, email };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Validate user by id (used by JWT strategy when decoding the token).
   */
  async validateUserById(userId: string) {
    return this.usersService.findOne(userId);
  }

  /**
   * Forgot password: create a reset token, store it, return it (in real app you'd email the link).
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Don't reveal that email doesn't exist (security)
      return { message: 'If that email exists, we sent a reset link.' };
    }
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });
    // In production: send email with link like https://yourapp.com/reset?token=xxx
    return {
      message: 'If that email exists, we sent a reset link.',
      resetToken: token,
    };
  }

  /**
   * Reset password: validate token, update password, invalidate token.
   */
  async resetPassword(token: string, dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (record.used) {
      throw new BadRequestException('This reset link was already used');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link has expired');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);
    return { message: 'Password has been reset successfully' };
  }
}
