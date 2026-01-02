// middleware/auth.js
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

export const authSuperAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token requis' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const superadmin = await db.SuperAdmin.findByPk(decoded.id);
    if (!superadmin) return res.status(401).json({ message: 'SuperAdmin invalide' });

    req.user = { role: 'superadmin', id: superadmin.id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token SuperAdmin invalide' });
  }
};
