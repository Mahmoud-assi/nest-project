import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

/**
 * Multer options - store files under uploads/YYYY/MM/ with a unique name
 * -------------------------------------------------------------------------
 * Like in the browser: the client sends multipart/form-data with a "file" field.
 * Multer (used by Nest's FileInterceptor) parses it and writes to disk here.
 * We store path in DB; the file stays in uploads/ for serving or later move to S3.
 */
const uploadsDir = 'uploads';

export const multerOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const now = new Date();
      const subdir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
      const dir = `${uploadsDir}/${subdir}`;
      const fs = require('fs');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname) || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
};
