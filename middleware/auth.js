import jwt from 'jsonwebtoken';
import db from '../models/index.js';

export const authSuperAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token requis' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const superadmin = await db.SuperAdmin.findByPk(decoded.id);
    
    if (!superadmin) return res.status(401).json({ message: 'SuperAdmin invalide' });
    req.user = { role: 'superadmin', ...superadmin.toJSON() };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token SuperAdmin invalide' });
  }
};

export const authAdminSecondaire = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await db.AdminSecondaire.findByPk(decoded.id);
    
    if (!admin || admin.suspendu) return res.status(401).json({ message: 'AdminSecondaire suspendu' });
    req.user = { role: 'adminsecondaire', ...admin.toJSON() };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token AdminSecondaire invalide' });
  }
};

export const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await db.Admin.findByPk(decoded.id);
    
    if (!admin || admin.suspendu) return res.status(401).json({ message: 'Admin suspendu' });
    req.user = { role: 'admin', ...admin.toJSON() };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token Admin invalide' });
  }
};
