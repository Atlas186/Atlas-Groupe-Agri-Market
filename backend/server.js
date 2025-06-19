// Fichier: server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import solanaRoutes from './routes/solanaRoutes.js';

// Importation de la connexion DB pour s'assurer qu'elle est initialisée
// (Le fichier db.js doit contenir la logique de connexion à votre base de données)
import './config/db.js';
// Pour initialiser la connexion Solana ou les variables liées
import './config/solana.js';

dotenv.config(); // Charge les variables d'environnement du fichier .env

const app = express();
const PORT = process.env.PORT || 5000; // Port par défaut 5000

// --- Middlewares ---

// Middleware CORS pour gérer les requêtes Cross-Origin
// IMPORTANT: En production, remplacez '*' par l'URL exacte de votre frontend.
// Par exemple: origin: 'https://votre-frontend-agri-market.com'
app.use(cors({
    origin: 'https://atlas-groupe-agri-market.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Autorise l'envoi de cookies/en-têtes d'authentification
}));

// Middleware pour parser les corps de requêtes au format JSON
app.use(express.json());

// --- Routes API ---
// Chaque groupe de routes est préfixé et délégué à un routeur spécifique

// Routes d'authentification (ex: /api/auth/register, /api/auth/login)
app.use('/api/auth', authRoutes);

// Routes utilisateur (ex: /api/users/profile, /api/users/:id)
app.use('/api/users', userRoutes);

// Routes d'activités (ex: /api/activities/recent, /api/activities/all)
app.use('/api/activities', activityRoutes);

// Routes Solana (ex: /api/solana/balance, /api/solana/transaction)
app.use('/api/solana', solanaRoutes);

// --- Route de test simple ---
// Pour vérifier que le serveur est bien en marche
app.get('/', (req, res) => {
    res.status(200).send('API Atlas Groupe International est en marche !');
});

// --- Middleware de gestion des erreurs ---
// Ce middleware doit être le dernier app.use() pour capturer toutes les erreurs
app.use(errorHandler);

// --- Démarrage du serveur ---
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
    console.log(`URL API: http://localhost:${PORT}`);
});
