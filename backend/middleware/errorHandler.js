// Fichier : ~/Atlas-Groupe-Agri-Market/backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Affiche la pile d'erreur dans les logs du serveur

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    res.json({
        message: err.message,
        // En production, nous n'envoyons pas la stack complète au client pour des raisons de sécurité.
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { errorHandler };

