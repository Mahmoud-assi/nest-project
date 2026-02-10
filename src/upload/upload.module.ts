import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MedicalRecordsService } from './medical-records.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [MedicalRecordsService, PermissionsGuard],
})
export class UploadModule {}
