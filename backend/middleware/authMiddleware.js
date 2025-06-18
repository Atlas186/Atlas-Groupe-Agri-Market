// Fichier : ~/Atlas-Groupe-Agri-Market/backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
    let token;

    // Vérifie si l'en-tête Authorization contient un token Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrait le token (partie après 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Vérifie et décode le token avec la clé secrète JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attache les informations de l'utilisateur (ex: ID) à l'objet de requête
            // Vous pouvez récupérer l'utilisateur complet depuis la DB ici si nécessaire
            req.user = { id: decoded.id }; // Assurez-vous que l'ID est bien dans le payload de votre JWT

            next(); // Passe au prochain middleware ou à la route
        } catch (error) {
            console.error('Token JWT non valide ou expiré :', error.message);
            return res.status(401).json({ message: 'Non autorisé, token invalide.' });
        }
    }

    // Si aucun token n'est trouvé dans l'en-tête
    if (!token) {
        return res.status(401).json({ message: 'Non autorisé, aucun token fourni.' });
    }
};

export { protect };
