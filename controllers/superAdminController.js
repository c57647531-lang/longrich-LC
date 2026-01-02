// controllers/superAdminController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { uploadFile } from '../config/cloudinary.js';

// AUTH
export const registerSuperAdmin = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const existing = await db.SuperAdmin.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Super admin déjà enregistré' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const superadmin = await db.SuperAdmin.create({ nom, email, password: hashed });

    const token = jwt.sign({ id: superadmin.id, role: 'superadmin' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ token, role: 'superadmin', superadmin: superadmin.toJSON() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const superadmin = await db.SuperAdmin.findOne({ where: { email } });
    if (!superadmin) return res.status(400).json({ message: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, superadmin.password);
    if (!ok) return res.status(400).json({ message: 'Identifiants invalides' });

    const token = jwt.sign({ id: superadmin.id, role: 'superadmin' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ token, role: 'superadmin', superadmin: superadmin.toJSON() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ADMIN SECONDAIRE CRUD + permissions
export const createAdminSecondaire = async (req, res) => {
  try {
    const { nom, email, password, telephone, permissions = [] } = req.body;
    const hashed = await bcrypt.hash(password, 12);

    const admin = await db.AdminSecondaire.create({
      nom,
      email,
      password: hashed,
      telephone,
    });

    if (permissions.length) {
      const perms = await db.Permission.findAll({ where: { nom: permissions } });
      for (const p of perms) {
        await db.AdminSecondairePermission.create({
          AdminSecondaireId: admin.id,
          PermissionId: p.id,
        });
      }
    }

    res.status(201).json({ message: 'AdminSecondaire créé', admin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllAdminSecondaire = async (req, res) => {
  const admins = await db.AdminSecondaire.findAll({
    include: [
      {
        model: db.AdminSecondairePermission,
        include: [db.Permission],
      },
    ],
  });
  res.json(admins);
};

export const updatePermissionsAdminSecondaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body;

    await db.AdminSecondairePermission.destroy({ where: { AdminSecondaireId: id } });

    if (permissions.length) {
      const perms = await db.Permission.findAll({ where: { nom: permissions } });
      for (const p of perms) {
        await db.AdminSecondairePermission.create({
          AdminSecondaireId: id,
          PermissionId: p.id,
        });
      }
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

// BOUTIQUES
export const createBoutique = async (req, res) => {
  try {
    const {
      adminId,      // ⬅️ un Admin (boutiquier)
      nom,
      type,
      typeAutre,
      quartier,
      ville,
      numeroTel,
      active,
      autoriseAjoutProduits,
    } = req.body;

    let photoBoutique = null;
    let logoBoutique = null;

    if (req.files?.photoBoutique) {
      photoBoutique = await uploadFile(req.files.photoBoutique[0].path);
    }
    if (req.files?.logoBoutique) {
      logoBoutique = await uploadFile(req.files.logoBoutique[0].path);
    }

    const slug = slugify(nom, { lower: true, strict: true });
    const lienVitrine = `/boutique/${slug}-${Date.now()}`;

    const boutique = await db.Boutique.create({
      AdminId: adminId,     // ⬅️ rattachement au boutiquier
      nom,
      type,
      typeAutre,
      quartier,
      ville,
      numeroTel,
      active,
      autoriseAjoutProduits,
      photoBoutique,
      logoBoutique,
      lienVitrine,
    });

    res.status(201).json({ message: 'Boutique créée', boutique });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllBoutiques = async (req, res) => {
  const boutiques = await db.Boutique.findAll({
    include: [
      {
        model: db.Admin,
      },
      {
        model: db.AdminSecondaire,
        as: 'proprietaire',
        include: [
          {
            model: db.AdminSecondairePermission,
            include: [db.Permission],
          },
        ],
      },
    ],
  });
  res.json(boutiques);
};


export const updateBoutique = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.files?.photoBoutique) {
      updates.photoBoutique = await uploadFile(req.files.photoBoutique[0].path);
    }
    if (req.files?.logoBoutique) {
      updates.logoBoutique = await uploadFile(req.files.logoBoutique[0].path);
    }

    await db.Boutique.update(updates, { where: { id } });
    const boutique = await db.Boutique.findByPk(id, {
      include: [{ model: db.AdminSecondaire, as: 'proprietaire' }],
    });
    res.json({ message: 'Boutique mise à jour', boutique });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBoutique = async (req, res) => {
  const { id } = req.params;
  await db.Boutique.destroy({ where: { id } });
  res.json({ message: 'Boutique supprimée' });
};

// PRODUITS LONGRICH
export const createProduitLongrich = async (req, res) => {
  try {
    const { boutiqueId, nom, categorie, prixPartenaire, prixClient, prixPromo, quantiteStock, enPromo } =
      req.body;

    let photo = null;
    let videoDemo = null;
    if (req.files?.photo) photo = await uploadFile(req.files.photo[0].path);
    if (req.files?.videoDemo) videoDemo = await uploadFile(req.files.videoDemo[0].path);

    const produit = await db.ProduitLongrich.create({
      BoutiqueId: boutiqueId,
      nom,
      categorie,
      prixPartenaire,
      prixClient,
      prixPromo,
      quantiteStock,
      photo,
      videoDemo,
      enPromo,
    });

    res.status(201).json({ message: 'Produit créé', produit });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProduitsByBoutique = async (req, res) => {
  const { boutiqueId } = req.params;
  const produits = await db.ProduitLongrich.findAll({ where: { BoutiqueId: boutiqueId } });
  res.json(produits);
};

export const updateProduitLongrich = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.files?.photo) updates.photo = await uploadFile(req.files.photo[0].path);
    if (req.files?.videoDemo) updates.videoDemo = await uploadFile(req.files.videoDemo[0].path);

    await db.ProduitLongrich.update(updates, { where: { id } });
    const produit = await db.ProduitLongrich.findByPk(id);
    res.json({ message: 'Produit mis à jour', produit });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduitLongrich = async (req, res) => {
  const { id } = req.params;
  await db.ProduitLongrich.destroy({ where: { id } });
  res.json({ message: 'Produit supprimé' });
};

export const duplicateProduitsBoutique = async (req, res) => {
  try {
    const { boutiqueId, sourceBoutiqueId } = req.params;
    const produitsSource = await db.ProduitLongrich.findAll({ where: { BoutiqueId: sourceBoutiqueId } });

    for (const p of produitsSource) {
      const data = p.toJSON();
      delete data.id;
      data.BoutiqueId = boutiqueId;
      await db.ProduitLongrich.create(data);
    }

    res.json({ message: `${produitsSource.length} produits dupliqués` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// STATS
export const getStatsCA = async (req, res) => {
  const stats = await db.Boutique.findAll({
    attributes: ['id', 'nom', 'lienVitrine'],
    include: [
      {
        model: db.ChiffreAffaire,
        attributes: [[db.sequelize.fn('SUM', db.sequelize.col('montant')), 'totalCA']],
      },
    ],
    group: ['Boutique.id'],
  });
  res.json(stats);
};




// === ADMIN (boutiquier) ===
export const createAdmin = async (req, res) => {
  try {
    const { nom, email, telephone, password } = req.body;

    const existingTel = await db.Admin.findOne({ where: { telephone } });
    if (existingTel) {
      return res.status(400).json({ message: 'Téléphone déjà utilisé' });
    }

    if (email) {
      const existingMail = await db.Admin.findOne({ where: { email } });
      if (existingMail) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    const admin = await db.Admin.create({
      nom,
      email: email || null,
      telephone,
      password: hashed,
    });

    res.status(201).json({ message: 'Admin créé', admin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllAdmins = async (req, res) => {
  const admins = await db.Admin.findAll();
  res.json(admins);
};

export const suspendAdmin = async (req, res) => {
  const { id } = req.params;
  await db.Admin.update({ suspendu: true }, { where: { id } });
  res.json({ message: 'Admin suspendu' });
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  await db.Admin.destroy({ where: { id } });
  res.json({ message: 'Admin supprimé' });
};