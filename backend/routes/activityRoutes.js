// Fichier: backend/routes/activityRoutes.js
import express from 'express';
import { getUserActivities } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-activities', protect, getUserActivities);

export default router;
