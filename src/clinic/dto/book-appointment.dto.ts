import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/**
 * BookAppointmentDto - Request body for booking an appointment
 * -------------------------------------------------------------------------
 * scheduledAt: ISO 8601 datetime (e.g. "2025-02-15T09:00:00.000Z") for the slot start.
 * The doctor must be available at that time (within their working hours) and the slot
 * must not already be booked.
 */
export class BookAppointmentDto {
  @ApiProperty({
    example: 'clxxxxxxxxxxxxxxxxx',
    description: 'ID of the doctor to book with',
  })
  @IsString()
  @MinLength(1)
  doctorId: string;

  @ApiProperty({
    example: '2025-02-15T09:00:00.000Z',
    description: 'Start time of the appointment (ISO 8601)',
  })
  @IsISO8601(
    {},
    { message: 'scheduledAt must be a valid ISO 8601 date-time (e.g. 2025-02-15T09:00:00.000Z)' },
  )
  scheduledAt: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Duration in minutes (default: 30)',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;
}
