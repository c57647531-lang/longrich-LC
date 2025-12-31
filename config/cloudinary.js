import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const uploadFile = async (filePath) => {
  try {
    // Test connexion internet
    const online = await fetch('https://api.cloudinary.com', { method: 'HEAD', mode: 'no-cors' })
      .then(() => true)
      .catch(() => false);

    if (online && process.env.CLOUDINARY_CLOUD_NAME) {
      // Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'longrich/boutiques'
      });
      // Supprime local
      fs.unlinkSync(filePath);
      return result.secure_url;
    } else {
      // Local
      const filename = Date.now() + path.basename(filePath);
      const destPath = path.join(UPLOAD_DIR, filename);
      fs.renameSync(filePath, destPath);
      return `/uploads/${filename}`;
    }
  } catch (error) {
    // Fallback local
    const filename = Date.now() + path.basename(filePath);
    const destPath = path.join(UPLOAD_DIR, filename);
    fs.renameSync(filePath, destPath);
    return `/uploads/${filename}`;
  }
};
