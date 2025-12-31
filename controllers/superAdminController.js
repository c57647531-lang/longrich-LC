import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { uploadFile } from '../config/cloudinary.js';

// Toutes les permissions possibles
const TOUTES_LES_PERMISSIONS = [
  'create_admin', 'suspend_admin', 'delete_admin',
  'create_boutique', 'activate_boutique', 'delete_boutique',
  'manage_produits_longrich', 'duplicate_produits', 
  'manage_autres_produits', 'view_stats_ca',
  'manage_commandes', 'confirm_livraisons'
];

export const registerSuperAdmin = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    let superadmin = await db.SuperAdmin.findOne({ where: { email } });
    if (!superadmin) {
      superadmin = await db.SuperAdmin.create({ 
        nom, email, password: hashedPassword 
      });
    }
    
    const token = jwt.sign({ id: superadmin.id, role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, superadmin: superadmin.toJSON() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔐 CRUD ADMIN SECONDAIRE + PRIVILÈGES
export const createAdminSecondaire = async (req, res) => {
  try {
    const { nom, email, password, telephone, permissions = [] } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await db.AdminSecondaire.create({
      nom, email, password: hashedPassword, telephone
    });

    // Attribuer permissions
    if (permissions.length > 0) {
      const perms = await db.Permission.findAll({ where: { nom: permissions } });
      await admin.setAdminSecondairePermissions(perms);
    }
    
    res.status(201).json({ message: 'AdminSecondaire créé avec permissions', admin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllAdminSecondaire = async (req, res) => {
  const admins = await db.AdminSecondaire.findAll({
    include: [{
      model: db.AdminSecondairePermission,
      include: [db.Permission]
    }]
  });
  res.json(admins);
};

export const updatePermissionsAdminSecondaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // ['create_boutique', 'manage_produits_longrich']
    
    const admin = await db.AdminSecondaire.findByPk(id);
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' });
    
    // Supprime anciennes permissions
    await db.AdminSecondairePermission.destroy({ where: { AdminSecondaireId: id } });
    
    // Ajoute nouvelles
    if (permissions.length > 0) {
      const perms = await db.Permission.findAll({ where: { nom: permissions } });
      await admin.setAdminSecondairePermissions(perms);
    }
    
    res.json({ message: 'Permissions mises à jour' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const suspendAdminSecondaire = async (req, res) => {
  const { id } = req.params;
  await db.AdminSecondaire.update({ suspendu: true }, { where: { id } });
  res.json({ message: 'AdminSecondaire suspendu' });
};

export const deleteAdminSecondaire = async (req, res) => {
  const { id } = req.params;
  await db.AdminSecondaire.destroy({ where: { id } });
  res.json({ message: 'AdminSecondaire supprimé' });
};

// 🏪 CRUD BOUTIQUES (SuperAdmin total)
export const createBoutique = async (req, res) => {
  try {
    const { proprietaireId, nom, type, typeAutre, quartier, ville, numeroTel, 
            photoBoutique, logoBoutique } = req.body;
    
    const lienVitrine = `/boutique-${nom.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    let photo = photoBoutique;
    let logo = logoBoutique;
    
    if (req.files?.photoBoutique) {
      photo = await uploadFile(req.files.photoBoutique[0].path);
    }
    if (req.files?.logoBoutique) {
      logo = await uploadFile(req.files.logoBoutique[0].path);
    }
    
    const boutique = await db.Boutique.create({
      proprietaireId, nom, type, typeAutre, quartier, ville, 
      numeroTel, photoBoutique: photo, logoBoutique: logo, lienVitrine
    });
    
    res.status(201).json({ message: 'Boutique créée', boutique });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllBoutiques = async (req, res) => {
  const boutiques = await db.Boutique.findAll({
    include: [{ 
      model: db.AdminSecondaire, 
      as: 'proprietaire',
      include: [{
        model: db.AdminSecondairePermission,
        include: [db.Permission]
      }]
    }]
  });
  res.json(boutiques);
};

export const updateBoutique = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (req.files?.photoBoutique) {
    updates.photoBoutique = await uploadFile(req.files.photoBoutique[0].path);
  }
  
  await db.Boutique.update(updates, { where: { id } });
  const boutique = await db.Boutique.findByPk(id, { 
    include: [{ model: db.AdminSecondaire, as: 'proprietaire' }] 
  });
  res.json({ message: 'Boutique mise à jour', boutique });
};

export const deleteBoutique = async (req, res) => {
  const { id } = req.params;
  await db.Boutique.destroy({ where: { id } });
  res.json({ message: 'Boutique supprimée' });
};

// 📦 PRODUITS LONGRICH (CRUD total)
export const createProduitLongrich = async (req, res) => {
  try {
    const { boutiqueId, nom, categorie, prixPartenaire, prixClient, prixPromo, 
            quantiteStock, enPromo } = req.body;
    
    let photo = null, videoDemo = null;
    if (req.files?.photo) photo = await uploadFile(req.files.photo[0].path);
    if (req.files?.videoDemo) videoDemo = await uploadFile(req.files.videoDemo[0].path);
    
    const produit = await db.ProduitLongrich.create({
      BoutiqueId: boutiqueId, nom, categorie, prixPartenaire, prixClient, 
      prixPromo, quantiteStock, photo, videoDemo, enPromo
    });
    
    res.status(201).json({ message: 'Produit créé', produit });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProduitsByBoutique = async (req, res) => {
  const { boutiqueId } = req.params;
  const produits = await db.ProduitLongrich.findAll({
    where: { BoutiqueId: boutiqueId }
  });
  res.json(produits);
};

export const updateProduitLongrich = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (req.files?.photo) updates.photo = await uploadFile(req.files.photo[0].path);
  if (req.files?.videoDemo) updates.videoDemo = await uploadFile(req.files.videoDemo[0].path);
  
  await db.ProduitLongrich.update(updates, { where: { id } });
  const produit = await db.ProduitLongrich.findByPk(id);
  res.json({ message: 'Produit mis à jour', produit });
};

export const deleteProduitLongrich = async (req, res) => {
  const { id } = req.params;
  await db.ProduitLongrich.destroy({ where: { id } });
  res.json({ message: 'Produit supprimé' });
};

// 🔄 DUPLIQUER PRODUITS
export const duplicateProduitsBoutique = async (req, res) => {
  try {
    const { boutiqueId, sourceBoutiqueId } = req.params;
    
    const produitsSource = await db.ProduitLongrich.findAll({ 
      where: { BoutiqueId: sourceBoutiqueId } 
    });
    
    const duplicated = await Promise.all(
      produitsSource.map(async (p) => {
        const { id, BoutiqueId, ...data } = p.toJSON();
        return db.ProduitLongrich.create({ ...data, BoutiqueId: boutiqueId });
      })
    );
    
    res.json({ message: `${duplicated.length} produits dupliqués` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📊 STATS CA
export const getStatsCA = async (req, res) => {
  const stats = await db.Boutique.findAll({
    attributes: ['id', 'nom', 'lienVitrine'],
    include: [{
      model: db.ChiffreAffaire,
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('montant')), 'totalCA']]
    }],
    group: ['Boutique.id']
  });
  res.json(stats);
};
