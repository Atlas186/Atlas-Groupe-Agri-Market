// Fichier: backend/controllers/userController.js
import { findUserById, updateUser, linkSolanaAddress } from '../models/userModel.js';
import { addActivity } from '../models/activityModel.js';

export const getUserProfile = async (req, res, next) => {
    try {
        // req.user est défini par le middleware `protect`
        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Retourne les données du profil (sans le hash du mot de passe)
        res.status(200).json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            birthDate: user.birth_date,
            country: user.country,
            documentType: user.document_type,
            membershipDate: user.membership_date,
            kycVerified: user.kyc_verified,
            profileImageUrl: user.profile_image_url,
            solanaWalletAddress: user.solana_wallet_address,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    const { firstName, lastName, birthDate, country, documentType, profileImageUrl } = req.body;

    try {
        // Préparer un objet avec seulement les champs à mettre à jour
        const updateFields = {};
        if (firstName !== undefined) updateFields.first_name = firstName;
        if (lastName !== undefined) updateFields.last_name = lastName;
        if (birthDate !== undefined) updateFields.birth_date = birthDate;
        if (country !== undefined) updateFields.country = country;
        if (documentType !== undefined) updateFields.document_type = documentType;
        if (profileImageUrl !== undefined) updateFields.profile_image_url = profileImageUrl;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Aucune donnée fournie pour la mise à jour.' });
        }

        const updatedUser = await updateUser(req.user.id, updateFields);

        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        await addActivity(req.user.id, 'Profil utilisateur mis à jour.', 'fas fa-user-edit');

        res.status(200).json({
            message: 'Profil mis à jour avec succès',
            profile: {
                id: updatedUser.id,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                email: updatedUser.email,
                birthDate: updatedUser.birth_date,
                country: updatedUser.country,
                documentType: updatedUser.document_type,
                profileImageUrl: updatedUser.profile_image_url,
                kycVerified: updatedUser.kyc_verified,
            }
        });
    } catch (error) {
        next(error);
    }
};

// Optionnel: Endpoint pour lier une adresse Solana au profil utilisateur
export const linkSolanaWallet = async (req, res, next) => {
    const { solanaWalletAddress } = req.body;

    if (!solanaWalletAddress) {
        return res.status(400).json({ message: 'Veuillez fournir une adresse de portefeuille Solana.' });
    }

    try {
        const updatedUser = await linkSolanaAddress(req.user.id, solanaWalletAddress);
        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        await addActivity(req.user.id, `Portefeuille Solana ${solanaWalletAddress} lié.`, 'fas fa-wallet');
        res.status(200).json({
            message: 'Adresse Solana liée avec succès.',
            solanaWalletAddress: updatedUser.solana_wallet_address,
        });
    } catch (error) {
        // Gérer l'erreur si l'adresse est déjà utilisée par un autre utilisateur (contrainte UNIQUE)
        if (error.code === '23505' && error.constraint === 'users_solana_wallet_address_key') {
            return res.status(409).json({ message: 'Cette adresse de portefeuille Solana est déjà liée à un autre compte.' });
        }
        next(error);
    }
};

// Les fonctions pour la vérification KYC (upload de documents, mise à jour du statut) iraient ici ou dans un kycController.js dédié.
// Exemple de placeholder:
export const requestKycVerification = async (req, res, next) => {
    // Logique pour gérer la demande de vérification KYC
    // (ex: enregistrer les documents téléchargés, mettre le statut KYC en "pending")
    // Cela impliquera l'upload de fichiers (nécessite une librairie comme `multer`)
    // Mettre à jour `kyc_verified` dans la DB une fois le processus terminé
    try {
        // Exemple simplifié: Mettre à jour le statut KYC à "pending"
        // Vous devrez implémenter la logique d'upload de fichiers et de traitement ici
        const updatedUser = await updateUser(req.user.id, { kyc_verified: false }); // Ou un statut `pending` si vous ajoutez une colonne d'état KYC plus détaillée

        await addActivity(req.user.id, 'Demande de vérification KYC initiée.', 'fas fa-user-check');
        res.status(200).json({ message: 'Votre demande de vérification KYC a été soumise. Elle sera examinée sous peu.' });
    } catch (error) {
        next(error);
    }
};
