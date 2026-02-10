import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { Role } from '../common/constants/roles';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { BookAppointmentDto } from './dto/book-appointment.dto';

/**
 * ClinicService - Working hours and appointment booking
 * -------------------------------------------------------------------------
 * Uses Prisma transactions when creating appointments so that the unique
 * constraint (doctorId, scheduledAt) is checked atomically, preventing
 * double booking under concurrent requests (see method book()).
 *
 * For i18n: we throw keys like 'common.SLOT_ALREADY_BOOKED' so the global
 * HttpExceptionI18nFilter translates them. To translate inside the service
 * (e.g. for logging or custom payloads), use I18nContext.current()?.t('common.KEY').
 */
@Injectable()
export class ClinicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getAdminMessage(): { message: string; data: Record<string, string> } {
    return {
      message: 'Welcome to the admin area.',
      data: {
        info: 'Only users with role ADMIN can see this.',
      },
    };
  }

  /**
   * Add a working-hour slot for a doctor. Can be called multiple times (e.g. per day or shift).
   */
  async setWorkingHours(doctorId: string, dto: CreateWorkingHourDto) {
    if (dto.startMinutes >= dto.endMinutes) {
      throw new BadRequestException(
        'startMinutes must be less than endMinutes',
      );
    }
    return this.prisma.workingHour.create({
      data: {
        doctorId,
        dayOfWeek: dto.dayOfWeek,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
      },
    });
  }

  /**
   * Book an appointment. Validates doctor exists, is available at the time, and uses
   * a Prisma transaction so two patients cannot book the same slot (race condition safety).
   */
  async book(patientId: string, dto: BookAppointmentDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const durationMinutes = dto.durationMinutes ?? 30;

    // a) Check doctor exists, is DOCTOR, and has a clinic
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: dto.doctorId,
        role: Role.DOCTOR,
        isActive: true,
        clinicId: { not: null },
      },
      select: { id: true, clinicId: true },
    });
    if (!doctor?.clinicId) {
      throw new NotFoundException('common.DOCTOR_NOT_FOUND');
    }
    const clinicId = doctor.clinicId;

    // b) Check the chosen time is within the doctor's working hours
    const dayOfWeek = scheduledAt.getUTCDay(); // 0 = Sun, 6 = Sat
    const slotMinutes =
      scheduledAt.getUTCHours() * 60 + scheduledAt.getUTCMinutes();

    const workingSlots = await this.prisma.workingHour.findMany({
      where: {
        doctorId: dto.doctorId,
        dayOfWeek,
        startMinutes: { lte: slotMinutes },
        endMinutes: { gt: slotMinutes },
      },
    });
    if (workingSlots.length === 0) {
      // Example: translate inside the service using I18nContext (request language is already set by i18n middleware)
      const i18n = I18nContext.current();
      const message = i18n
        ? i18n.t('common.DOCTOR_NOT_AVAILABLE')
        : 'common.DOCTOR_NOT_AVAILABLE';
      throw new BadRequestException(message);
    }

    // c) & d) Create inside a transaction. If another request creates the same slot first,
    // the unique constraint (doctorId, scheduledAt) will cause Prisma to throw; we catch and return i18n key.
    try {
      const appointment = await this.prisma.$transaction(async (tx) => {
        // Optional: explicit check inside transaction (redundant with unique constraint but documents intent)
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId: dto.doctorId,
            scheduledAt,
            status: { not: AppointmentStatus.CANCELLED },
          },
        });
        if (existing) {
          throw new ConflictException('common.SLOT_ALREADY_BOOKED');
        }
        return tx.appointment.create({
          data: {
            patientId,
            doctorId: dto.doctorId,
            clinicId,
            scheduledAt,
            durationMinutes,
          },
          include: {
            doctor: { select: { id: true, name: true, email: true } },
            patient: { select: { email: true } },
            clinic: { select: { id: true, name: true } },
          },
        });
      });
      // Fire-and-forget: confirmation email is sent in the background (see AppointmentEventsListener)
      this.eventEmitter.emit('appointment.booked', {
        appointmentId: appointment.id,
        patientEmail: appointment.patient.email,
        doctorName: appointment.doctor.name,
        scheduledAt: appointment.scheduledAt,
      });
      return appointment;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      // Prisma unique constraint violation (P2002) = slot was taken by a concurrent request
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('common.SLOT_ALREADY_BOOKED');
      }
      throw err;
    }
  }

  /**
   * Search doctors by name or by clinic name (for booking flow).
   */
  async searchDoctors(query: string) {
    const term = query.trim();
    if (!term) {
      return this.prisma.user.findMany({
        where: { role: Role.DOCTOR, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          clinic: { select: { id: true, name: true } },
        },
        take: 20,
      });
    }
    const q = term.toLowerCase();
    return this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { clinic: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        clinic: { select: { id: true, name: true, address: true } },
      },
      take: 20,
    });
  }
}
