import multer from 'multer';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

import { BadRequestError } from '../shared/errors.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG and WebP images are allowed'));
  }
};

export function createUploadMiddleware(folderName: string, fields: { name: string; maxCount: number }[]) {
  const uploadDir = path.join(__dirname, '../../uploads', folderName);

  const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err as Error, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${file.originalname}`;
      cb(null, unique);
    },
  });

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 5 } }).fields(fields);
}

export async function deleteFileFromDisk(filePath: string): Promise<void> {
  const absolutePath = path.join(process.cwd(), filePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function getImageUrlPath(file: Express.Multer.File) {
  const relativePath = file.destination.split('/uploads/')[1];
  return { imageUrl: `/uploads/${relativePath}/${file.filename}` };
}
