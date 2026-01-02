// server.js
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import sequelize from './config/database.js';
import db from './models/index.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// CORS vers Vercel + local
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173'],
    credentials: false,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Routes Super Admin
app.use(
  '/api/superadmin',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'videoDemo', maxCount: 1 },
    { name: 'photoBoutique', maxCount: 1 },
    { name: 'logoBoutique', maxCount: 1 },
  ]),
  superAdminRoutes,
);

// Socket.io (pour plus tard)
io.on('connection', (socket) => {
  console.log('✅ Socket connecté');
});

// Démarrage
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');
    await db.syncDatabase();
    console.log('🎄 LONGRICH Backend prêt');
  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server LONGRICH sur port ${PORT}`);
  startServer();
});

export { io };
