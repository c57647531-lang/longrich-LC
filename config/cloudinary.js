// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadFile = async (filePath) => {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'longrich/boutiques',
        resource_type: 'auto',
      });
      fs.unlinkSync(filePath);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary error, fallback local:', error.message);
    }
  }

  const fileName = Date.now() + '-' + path.basename(filePath);
  const destPath = path.join(UPLOAD_DIR, fileName);
  fs.renameSync(filePath, destPath);
  return `/uploads/${fileName}`;
};
