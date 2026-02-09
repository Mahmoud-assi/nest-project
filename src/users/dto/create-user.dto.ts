import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * CreateUserDto - Data Transfer Object for creating a user
 * -------------------------------------------------------------------------
 * WHY DTOs: In Nest (and many backends), we don't accept raw body. We validate
 * and type the input with a DTO. class-validator decorators run automatically
 * when we use ValidationPipe (see main.ts) and return clear 400 errors.
 *
 * WHEN TO USE: This shape is used in POST /users (create). We never expose
 * internal fields like id or createdAt here - only what the client sends.
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email (unique)',
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    minLength: 8,
    description: 'Password (min 8 chars)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user', description: 'Role (default: user)' })
  @IsOptional()
  @IsString()
  role?: string;
}
