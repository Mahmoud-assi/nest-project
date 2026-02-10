import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPermissions } from '../common/decorators/check-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Role } from '../common/constants/roles';
import { MedicalRecordsService } from './medical-records.service';
import { multerOptions } from './multer.options';

type RequestWithUser = Request & { user: { id: string; role: Role } };

/**
 * UploadController - Medical reports (PDF or images)
 * -------------------------------------------------------------------------
 * In React you deal with File from <input type="file"> or FormData. In Nest,
 * Multer parses multipart/form-data and gives you the file as Express.Multer.File
 * (buffer or path depending on storage). We use disk storage and get .path.
 */
@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@CheckPermissions(Role.DOCTOR, Role.PATIENT)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly medicalRecords: MedicalRecordsService) {}

  @Post('medical-report')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiOperation({ summary: 'Upload a medical report (PDF or image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'MedicalRecord created (filePath, originalName, mimeType).' })
  @ApiResponse({ status: 400, description: 'common.FILE_REQUIRED (no file) or common.INVALID_FILE_TYPE (only PDF/JPEG/PNG).' })
  @ApiResponse({ status: 401, description: 'common.UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'common.FORBIDDEN (must be DOCTOR or PATIENT)' })
  async uploadMedicalReport(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('common.FILE_REQUIRED');
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      await unlink(file.path).catch(() => {});
      throw new BadRequestException('common.INVALID_FILE_TYPE');
    }
    const record = await this.medicalRecords.create({
      uploadedById: req.user.id,
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    return record;
  }
}
