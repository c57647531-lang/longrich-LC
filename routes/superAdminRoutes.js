import express from 'express';
import { 
  // Auth
  registerSuperAdmin,
  // AdminSecondaire CRUD + Permissions
  createAdminSecondaire, getAllAdminSecondaire, updatePermissionsAdminSecondaire,
  suspendAdminSecondaire, deleteAdminSecondaire,
  // Boutiques CRUD
  createBoutique, getAllBoutiques, updateBoutique, deleteBoutique,
  // Produits CRUD
  createProduitLongrich, getProduitsByBoutique, updateProduitLongrich, deleteProduitLongrich,
  // Autres
  duplicateProduitsBoutique, getStatsCA
} from '../controllers/superAdminController.js';
import { authSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// 🔐 AUTH SuperAdmin
router.post('/login', registerSuperAdmin);
router.use(authSuperAdmin); // TOUT après nécessite SuperAdmin

// 👥 ADMIN SECONDAIRE (CRUD + Permissions)
router.post('/admins-secondaires', createAdminSecondaire);
router.get('/admins-secondaires', getAllAdminSecondaire);
router.put('/admins-secondaires/:id/permissions', updatePermissionsAdminSecondaire);
router.post('/admins-secondaires/:id/suspend', suspendAdminSecondaire);
router.delete('/admins-secondaires/:id', deleteAdminSecondaire);

// 🏪 BOUTIQUES (CRUD total)
router.post('/boutiques', createBoutique);
router.get('/boutiques', getAllBoutiques);
router.put('/boutiques/:id', updateBoutique);
router.delete('/boutiques/:id', deleteBoutique);

// 📦 PRODUITS LONGRICH (CRUD total)
router.post('/produits-longrich', createProduitLongrich);
router.get('/boutiques/:boutiqueId/produits', getProduitsByBoutique);
router.put('/produits-longrich/:id', updateProduitLongrich);
router.delete('/produits-longrich/:id', deleteProduitLongrich);
router.post('/boutiques/:boutiqueId/duplicate-produits/:sourceBoutiqueId', duplicateProduitsBoutique);

// 📊 STATS
router.get('/stats/ca', getStatsCA);

export default router;
