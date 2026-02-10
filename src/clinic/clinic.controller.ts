import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPermissions } from '../common/decorators/check-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Role } from '../common/constants/roles';
import { ClinicService } from './clinic.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';

type RequestWithUser = Request & { user: { id: string; role: Role } };

/**
 * ClinicController - Working hours, booking, and admin demo
 * -------------------------------------------------------------------------
 * POST /clinic/working-hours: DOCTOR only, set availability.
 * POST /clinic/book: PATIENT only, book appointment (with transaction).
 */
@ApiTags('clinic')
@Controller('clinic')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only route (ADMIN role required)' })
  @ApiResponse({
    status: 200,
    description: 'Admin welcome message (wrapped in { success, data }).',
  })
  @ApiResponse({ status: 401, description: 'common.UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'common.FORBIDDEN (not ADMIN)' })
  adminOnly() {
    return this.clinicService.getAdminMessage();
  }

  @Post('working-hours')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions(Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a working-hour slot (DOCTOR only)' })
  @ApiResponse({
    status: 201,
    description:
      'Working hour created. Body: dayOfWeek (0-6), startMinutes, endMinutes.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or startMinutes >= endMinutes.',
  })
  @ApiResponse({ status: 401, description: 'common.UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'common.FORBIDDEN (not DOCTOR)' })
  setWorkingHours(
    @Req() req: RequestWithUser,
    @Body() dto: CreateWorkingHourDto,
  ) {
    return this.clinicService.setWorkingHours(req.user.id, dto);
  }

  @Post('book')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions(Role.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book an appointment (PATIENT only)' })
  @ApiResponse({
    status: 201,
    description:
      'Appointment created (wrapped in { success, data }). Triggers background confirmation-email event.',
  })
  @ApiResponse({
    status: 400,
    description:
      'common.DOCTOR_NOT_AVAILABLE (slot not in working hours) or invalid body.',
  })
  @ApiResponse({ status: 404, description: 'common.DOCTOR_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'common.SLOT_ALREADY_BOOKED' })
  @ApiResponse({ status: 401, description: 'common.UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'common.FORBIDDEN (not PATIENT)' })
  book(@Req() req: RequestWithUser, @Body() dto: BookAppointmentDto) {
    return this.clinicService.book(req.user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search doctors by name or clinic name (public)' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search term; empty returns first 20 doctors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of doctors with id, name, email, clinic.',
  })
  search(@Query('q') q: string) {
    return this.clinicService.searchDoctors(q ?? '');
  }
}
