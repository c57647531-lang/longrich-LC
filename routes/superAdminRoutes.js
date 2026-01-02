// routes/superAdminRoutes.js
import express from 'express';
import {
  registerSuperAdmin,
  loginSuperAdmin,
  createAdminSecondaire,
  getAllAdminSecondaire,
  updatePermissionsAdminSecondaire,
  suspendAdminSecondaire,
  deleteAdminSecondaire,
  createBoutique,
  getAllBoutiques,
  updateBoutique,
  deleteBoutique,
  createProduitLongrich,
  getProduitsByBoutique,
  updateProduitLongrich,
  deleteProduitLongrich,
  duplicateProduitsBoutique,
  getStatsCA,
} from '../controllers/superAdminController.js';
import { authSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/register', registerSuperAdmin);
router.post('/login', loginSuperAdmin);

// Toutes les routes suivantes sont protégées
router.use(authSuperAdmin);

// Admin secondaires
router.post('/admins-secondaires', createAdminSecondaire);
router.get('/admins-secondaires', getAllAdminSecondaire);
router.put('/admins-secondaires/:id/permissions', updatePermissionsAdminSecondaire);
router.post('/admins-secondaires/:id/suspend', suspendAdminSecondaire);
router.delete('/admins-secondaires/:id', deleteAdminSecondaire);

// Boutiques
router.post('/boutiques', createBoutique);
router.get('/boutiques', getAllBoutiques);
router.put('/boutiques/:id', updateBoutique);
router.delete('/boutiques/:id', deleteBoutique);

// Produits Longrich
router.post('/produits-longrich', createProduitLongrich);
router.get('/boutiques/:boutiqueId/produits', getProduitsByBoutique);
router.put('/produits-longrich/:id', updateProduitLongrich);
router.delete('/produits-longrich/:id', deleteProduitLongrich);
router.post('/boutiques/:boutiqueId/duplicate-produits/:sourceBoutiqueId', duplicateProduitsBoutique);

// Stats
router.get('/stats/ca', getStatsCA);

export default router;
