import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * ResetPasswordDto - Body for POST /auth/reset-password
 * Token comes from the link (e.g. ?token=xxx); new password in body.
 */
export class ResetPasswordDto {
  @ApiProperty({ example: 'newSecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
