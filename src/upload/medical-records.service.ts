import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * MedicalRecordsService - Persists file metadata (path, name, mime) in DB
 * -------------------------------------------------------------------------
 * The actual file is stored on disk by Multer; we only store the path and
 * metadata in the MedicalRecord model for lookup and audit.
 */
@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    uploadedById: string;
    filePath: string;
    originalName?: string;
    mimeType?: string;
  }) {
    return this.prisma.medicalRecord.create({
      data: {
        uploadedById: data.uploadedById,
        filePath: data.filePath,
        originalName: data.originalName ?? null,
        mimeType: data.mimeType ?? null,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
