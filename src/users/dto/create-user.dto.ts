import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from '../../common/constants/roles';

/**
 * CreateUserDto - Data Transfer Object for creating a user
 * -------------------------------------------------------------------------
 * WHY DTOs: In Nest (and many backends), we don't accept raw body. We validate
 * and type the input with a DTO. I18nValidationPipe uses these message keys
 * so validation errors are returned in the request language (Accept-Language or ?lang=).
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email (unique)',
  })
  @IsEmail({}, { message: i18nValidationMessage('common.INVALID_EMAIL') })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    minLength: 8,
    description: 'Password (min 8 chars)',
  })
  @IsString()
  @MinLength(8, { message: i18nValidationMessage('common.PASSWORD_MIN_LENGTH') })
  password: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Role (default: PATIENT)' })
  @IsOptional()
  @IsEnum(Role, { message: i18nValidationMessage('common.ROLE_INVALID') })
  role?: Role;
}
