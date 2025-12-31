import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from './config/database.js';
import db from './models/index.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 📁 CRÉER DOSSIER UPLOADS
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`✅ Dossier ${UPLOAD_DIR} créé`);
}

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes avec Multer
app.use('/api/superadmin', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'videoDemo', maxCount: 1 },
  { name: 'photoBoutique', maxCount: 1 },
  { name: 'logoBoutique', maxCount: 1 }
]), superAdminRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('✅ Client connecté Socket.io');
});

// 🔥 AUTO-SYNC DATABASE AU DEMARRAGE
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');
    
    await db.syncDatabase(); // 🔥 CRÉE/MODIFIE TOUTES LES TABLES
    console.log('🎄 LONGRICH Backend PRÊT !');
    
  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server LONGRICH sur port ${PORT}`);
  startServer(); // 🔥 LANCE SYNC APRÈS listen
});

export { io };
