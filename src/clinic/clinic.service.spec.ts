import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClinicService } from './clinic.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

/**
 * Unit tests for ClinicService.book()
 * -------------------------------------------------------------------------
 * Jest mocks the Prisma service so we don't hit a real DB. We replace
 * PrismaService with a fake object that has the same methods (findFirst,
 * findMany, $transaction). Each test sets mockResolvedValue or
 * mockImplementation so the service gets the data we want—e.g. "doctor
 * not found" or "slot already taken"—and we assert the right exception
 * or return value.
 */
describe('ClinicService', () => {
  let service: ClinicService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const patientId = 'patient-1';
  const doctorId = 'doctor-1';
  const clinicId = 'clinic-1';
  const scheduledAt = new Date('2025-02-17T09:00:00.000Z'); // Monday 09:00 UTC
  const validDto: BookAppointmentDto = {
    doctorId,
    scheduledAt: scheduledAt.toISOString(),
    durationMinutes: 30,
  };

  const mockAppointment = {
    id: 'apt-1',
    patientId,
    doctorId,
    clinicId,
    scheduledAt,
    durationMinutes: 30,
    status: AppointmentStatus.PENDING,
    doctor: { id: doctorId, name: 'Dr. Smith', email: 'doc@clinic.com' },
    patient: { email: 'patient@example.com' },
    clinic: { id: clinicId, name: 'Main Clinic' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn(),
      },
      workingHour: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const mockEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();

    service = module.get(ClinicService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
    jest.clearAllMocks();
  });

  describe('book()', () => {
    it('a) should create an appointment when doctor exists, is available, and slot is free', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: doctorId, clinicId });
      (prisma.workingHour.findMany as jest.Mock).mockResolvedValue([{ id: 'wh-1' }]);

      const mockTx = {
        appointment: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockAppointment),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: typeof mockTx) => unknown) =>
        cb(mockTx),
      );

      const result = await service.book(patientId, validDto);

      expect(result).toEqual(mockAppointment);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: doctorId, role: 'DOCTOR', isActive: true, clinicId: { not: null } },
        select: { id: true, clinicId: true },
      });
      expect(prisma.workingHour.findMany).toHaveBeenCalled();
      expect(mockTx.appointment.findFirst).toHaveBeenCalled();
      expect(mockTx.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            patientId,
            doctorId,
            clinicId,
            scheduledAt,
            durationMinutes: 30,
          },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('appointment.booked', {
        appointmentId: mockAppointment.id,
        patientEmail: mockAppointment.patient.email,
        doctorName: mockAppointment.doctor.name,
        scheduledAt: mockAppointment.scheduledAt,
      });
    });

    it('b) should throw NotFoundException when doctor does not exist or has no clinic', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.book(patientId, validDto)).rejects.toThrow(NotFoundException);
      await expect(service.book(patientId, validDto)).rejects.toThrow('common.DOCTOR_NOT_FOUND');

      expect(prisma.workingHour.findMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('b) should throw BadRequestException when doctor is not available at the chosen time', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: doctorId, clinicId });
      (prisma.workingHour.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.book(patientId, validDto)).rejects.toThrow(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('c) should throw ConflictException when slot is already taken (existing in transaction)', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: doctorId, clinicId });
      (prisma.workingHour.findMany as jest.Mock).mockResolvedValue([{ id: 'wh-1' }]);

      const mockTx = {
        appointment: {
          findFirst: jest.fn().mockResolvedValue({ id: 'existing-apt' }),
          create: jest.fn(),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: typeof mockTx) => unknown) =>
        cb(mockTx),
      );

      await expect(service.book(patientId, validDto)).rejects.toThrow(ConflictException);
      await expect(service.book(patientId, validDto)).rejects.toThrow('common.SLOT_ALREADY_BOOKED');

      expect(mockTx.appointment.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('c) should throw ConflictException when Prisma throws P2002 (unique constraint)', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: doctorId, clinicId });
      (prisma.workingHour.findMany as jest.Mock).mockResolvedValue([{ id: 'wh-1' }]);

      const mockTx = {
        appointment: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: typeof mockTx) => unknown) =>
        cb(mockTx),
      );

      await expect(service.book(patientId, validDto)).rejects.toThrow(ConflictException);
      await expect(service.book(patientId, validDto)).rejects.toThrow('common.SLOT_ALREADY_BOOKED');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
