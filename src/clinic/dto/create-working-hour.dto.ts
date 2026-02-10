import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

/**
 * CreateWorkingHourDto - One availability slot for a doctor
 * -------------------------------------------------------------------------
 * dayOfWeek: 0 = Sunday, 1 = Monday, ... 6 = Saturday.
 * startMinutes / endMinutes: minutes from midnight (e.g. 540 = 09:00, 1020 = 17:00).
 * Doctors can POST multiple times to add multiple slots (e.g. morning + afternoon).
 */
export class CreateWorkingHourDto {
  @ApiProperty({
    example: 1,
    description: 'Day of week: 0=Sun, 1=Mon, ... 6=Sat',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: 540,
    description: 'Start time as minutes from midnight (e.g. 540 = 09:00)',
    minimum: 0,
    maximum: 1439,
  })
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinutes: number;

  @ApiProperty({
    example: 1020,
    description: 'End time as minutes from midnight (e.g. 1020 = 17:00)',
    minimum: 0,
    maximum: 1439,
  })
  @IsInt()
  @Min(0)
  @Max(1439)
  endMinutes: number;
}
