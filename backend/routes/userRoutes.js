// Fichier: backend/routes/userRoutes.js
import express from 'express';
import { getUserProfile, updateProfile, linkSolanaWallet, requestKycVerification } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes ces routes nécessitent que l'utilisateur soit authentifié
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateProfile);

router.put('/profile/link-solana', protect, linkSolanaWallet); // Endpoint pour lier une adresse Solana
router.post('/kyc/request', protect, requestKycVerification); // Endpoint pour initier une demande KYC

export default router;
