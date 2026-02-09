import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * UpdateUserDto - Partial update (PATCH) for users
 * -------------------------------------------------------------------------
 * WHY PartialType: In Nest we often use PartialType(CreateUserDto) so all
 * fields become optional. Here we define only updatable fields explicitly
 * (no email change in update for simplicity - you can add it if needed).
 *
 * WHEN TO USE: Used in PATCH /users/:id. Client sends only fields to change.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'New Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: true, description: 'Activate/deactivate user' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
