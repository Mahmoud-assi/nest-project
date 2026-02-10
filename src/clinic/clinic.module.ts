import { Module } from '@nestjs/common';
import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentEventsListener } from './listeners/appointment-events.listener';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicController],
  providers: [ClinicService, PermissionsGuard, AppointmentEventsListener],
})
export class ClinicModule {}
