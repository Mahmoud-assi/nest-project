import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * ForgotPasswordDto - Body for POST /auth/forgot-password
 * We only need email to look up the user and send a reset link (email sending can be added later).
 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
