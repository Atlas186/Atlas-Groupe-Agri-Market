// Fichier: backend/routes/solanaRoutes.js
import express from 'express';
import { getWalletBalances, getTransactionHistory } from '../controllers/solanaController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Récupérer les soldes d'une adresse spécifique (peut être la leur ou non, si exposée)
router.get('/balances/:walletAddress', getWalletBalances);
// Ou récupérer les soldes du portefeuille lié à l'utilisateur (plus sécurisé)
router.get('/my-balances', protect, getWalletBalances);

router.get('/transactions/:walletAddress', getTransactionHistory);
// Ou l'historique des transactions du portefeuille lié à l'utilisateur
router.get('/my-transactions', protect, getTransactionHistory);

// router.post('/deposit-agcoin', protect, depositAgCoin); // Exemple si le backend gère l'émission de tokens

export default router;
