import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  }
};

export function createUploadMiddleware(folderName: string, fields: { name: string; maxCount: number }[]) {
  const uploadDir = path.join(__dirname, '../../uploads', folderName);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${file.originalname}`;
      cb(null, unique);
    },
  });

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 5 } }).fields(fields);
}

export function deleteFileFromDisk(filePath: string): void {
  const absolutePath = path.join(process.cwd(), filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

export function getImageUrlPath(file: Express.Multer.File) {
  const relativePath = file.destination.split('/uploads/')[1];
  return { imageUrl: `/uploads/${relativePath}/${file.filename}` };
}
