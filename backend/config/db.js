// Fichier : ~/Atlas-Groupe-Agri-Market/backend/config/db.js

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv'; // Important : le dotenv doit être appelé ici aussi
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Souvent nécessaire pour les services DB cloud qui utilisent des certificats auto-signés
    } : false // Pas de SSL en dev si vous êtes en local
});

pool.on('connect', () => {
    console.log('Connecté à PostgreSQL.');
});

pool.on('error', (err) => {
    console.error('Erreur de connexion à PostgreSQL:', err);
    process.exit(1); // Arrête l'application si la connexion DB échoue critiquement
});

export default pool; // Exportez le pool pour l'utiliser dans vos routes

