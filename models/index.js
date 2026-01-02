// models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// SUPER ADMIN
db.SuperAdmin = sequelize.define('SuperAdmin', {
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
});

// ADMIN SECONDAIRE
db.AdminSecondaire = sequelize.define('AdminSecondaire', {
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  telephone: { type: DataTypes.STRING, unique: true, allowNull: false },
  suspendu: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// ADMIN (boutiquier)
db.Admin = sequelize.define('Admin', {
  nom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  telephone: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  suspendu: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// BOUTIQUE
db.Boutique = sequelize.define('Boutique', {
  nom: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('boutique', 'supermarche', 'entreprise', 'autre'), allowNull: false },
  typeAutre: { type: DataTypes.STRING },
  quartier: { type: DataTypes.STRING },
  ville: { type: DataTypes.STRING },
  numeroTel: { type: DataTypes.STRING, allowNull: false },
  photoBoutique: { type: DataTypes.STRING },
  logoBoutique: { type: DataTypes.STRING },
  lienVitrine: { type: DataTypes.STRING, unique: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: false },
  autoriseAjoutProduits: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// PRODUIT LONGRICH
db.ProduitLongrich = sequelize.define('ProduitLongrich', {
  nom: { type: DataTypes.STRING, allowNull: false },
  categorie: { type: DataTypes.STRING, allowNull: false },
  prixPartenaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  prixClient: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  prixPromo: { type: DataTypes.DECIMAL(10, 2) },
  quantiteStock: { type: DataTypes.INTEGER },
  photo: { type: DataTypes.STRING },
  videoDemo: { type: DataTypes.STRING },
  enPromo: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// AUTRE PRODUIT
db.AutreProduit = sequelize.define('AutreProduit', {
  nom: { type: DataTypes.STRING },
  prixClient: { type: DataTypes.DECIMAL(10, 2) },
  prixPromo: { type: DataTypes.DECIMAL(10, 2) },
  photo: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
});

// LIVREUR
db.Livreur = sequelize.define('Livreur', {
  nom: { type: DataTypes.STRING },
  telephone: { type: DataTypes.STRING, unique: true },
  disponible: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// COMMANDE
db.Commande = sequelize.define('Commande', {
  clientNom: { type: DataTypes.STRING },
  clientTel: { type: DataTypes.STRING },
  items: { type: DataTypes.JSONB },
  total: { type: DataTypes.DECIMAL(10, 2) },
  statut: {
    type: DataTypes.ENUM('en_attente', 'prete', 'en_cours', 'livree'),
    defaultValue: 'en_attente',
  },
  confirmePar: {
    type: DataTypes.ENUM('superadmin', 'adminsecondaire', 'admin', 'livreur'),
    allowNull: true,
  },
});

// CHIFFRE D'AFFAIRE
db.ChiffreAffaire = sequelize.define('ChiffreAffaire', {
  montant: { type: DataTypes.DECIMAL(10, 2) },
  valide: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// PERMISSIONS
db.Permission = sequelize.define('Permission', {
  nom: { type: DataTypes.STRING, unique: true },
  description: { type: DataTypes.STRING },
});

db.AdminSecondairePermission = sequelize.define('AdminSecondairePermission', {});

// ASSOCIATIONS
db.SuperAdmin.hasMany(db.AdminSecondaire);
db.AdminSecondaire.belongsTo(db.SuperAdmin);

db.AdminSecondaire.hasMany(db.Admin);
db.Admin.belongsTo(db.AdminSecondaire);

db.AdminSecondaire.hasMany(db.Boutique, { as: 'proprietaire' });
db.Boutique.belongsTo(db.AdminSecondaire, { as: 'proprietaire' });
db.Admin.hasOne(db.Boutique);
db.Boutique.belongsTo(db.Admin);

db.Boutique.hasMany(db.ProduitLongrich);
db.ProduitLongrich.belongsTo(db.Boutique);

db.Boutique.hasMany(db.AutreProduit);
db.AutreProduit.belongsTo(db.Boutique);

db.Boutique.hasMany(db.Commande);
db.Commande.belongsTo(db.Boutique);

db.Boutique.hasMany(db.ChiffreAffaire);
db.ChiffreAffaire.belongsTo(db.Boutique);

db.Commande.belongsTo(db.Livreur);
db.Livreur.hasMany(db.Commande);

db.AdminSecondaire.hasMany(db.AdminSecondairePermission);
db.AdminSecondairePermission.belongsTo(db.AdminSecondaire);
db.Permission.hasMany(db.AdminSecondairePermission);
db.AdminSecondairePermission.belongsTo(db.Permission);

// INIT PERMISSIONS + SYNC
const initPermissions = async () => {
  const permissions = [
    'create_admin',
    'suspend_admin',
    'delete_admin',
    'create_boutique',
    'activate_boutique',
    'delete_boutique',
    'manage_produits_longrich',
    'duplicate_produits',
    'manage_autres_produits',
    'view_stats_ca',
    'manage_commandes',
    'confirm_livraisons',
  ];

  for (const nom of permissions) {
    const exists = await db.Permission.findOne({ where: { nom } });
    if (!exists) {
      await db.Permission.create({ nom, description: nom.replace(/_/g, ' ') });
      console.log(`✅ Permission: ${nom}`);
    }
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées (Postgres)');
    await initPermissions();
    console.log('✅ Permissions initialisées');
  } catch (error) {
    console.error('❌ Erreur sync:', error);
  }
};

db.syncDatabase = syncDatabase;

export default db;
