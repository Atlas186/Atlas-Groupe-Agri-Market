// Fichier : ~/Atlas-Groupe-Agri-Market/public/backend/controllers/solanaController.js

// Ligne corrigée : "import" est en minuscules, et les exports nommés sont corrects.
import { solanaConnection, agCoinMintPublicKey } from '../config/solana.js'; 
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'; // Assurez-vous que cette dépendance est bien installée si elle est utilisée.
import { findUserById } from '../models/userModel.js';

export const getWalletBalances = async (req, res, next) => {
    let { walletAddress } = req.params; // Utiliser 'let' car walletAddress peut être réassigné

    if (!walletAddress) {
        // Cette partie du code dépend de req.user.id, assurez-vous que le middleware d'authentification est en place
        const user = await findUserById(req.user.id); 
        if (user && user.solana_wallet_address) {
            walletAddress = user.solana_wallet_address;
        } else {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana manquante.' });
        }
    }

    try {
        const ownerPublicKey = new PublicKey(walletAddress);
        const solBalanceLamports = await solanaConnection.getBalance(ownerPublicKey);
        const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
        let agCoinBalance = 0; // Initialiser à 0 en cas d'erreur ou d'absence de token
        
        try {
            // Utiliser agCoinMintPublicKey directement comme objet PublicKey
            const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
                ownerPublicKey,
                { mint: agCoinMintPublicKey }, 
                'confirmed'
            );

            if (tokenAccounts && tokenAccounts.value.length > 0) {
                // S'assurer que le chemin d'accès aux données du token est correct
                agCoinBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            }
        } catch (tokenError) {
            // Afficher un avertissement au lieu d'une erreur bloquante si le solde du token ne peut pas être récupéré
            console.warn(`Impossible de récupérer le solde AG-COIN pour ${walletAddress}: ${tokenError.message}`);
        }

        res.status(200).json({
            solanaWalletAddress: walletAddress,
            solBalance: solBalance,
            agCoinBalance: agCoinBalance,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des soldes Solana:", error.message);
        if (error.message.includes('Invalid public key')) {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana invalide.' });
        }
        next(error); // Passer l'erreur au prochain middleware de gestion des erreurs
    }
};

export const getTransactionHistory = async (req, res, next) => {
    let { walletAddress } = req.params; // Utiliser 'let' ici aussi

    if (!walletAddress) {
        // Vérification de l'adresse du portefeuille pour l'utilisateur authentifié
        const user = await findUserById(req.user.id);
        if (user && user.solana_wallet_address) {
            walletAddress = user.solana_wallet_address;
        } else {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana manquante.' });
        }
    }

    try {
        const publicKey = new PublicKey(walletAddress);
        // Limiter le nombre de transactions pour éviter des réponses trop grandes
        const signatures = await solanaConnection.getSignaturesForAddress(publicKey, { limit: 10 }); 
        
        const transactions = signatures.map(sig => ({
            signature: sig.signature,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: sig.confirmationStatus,
            // Vous pouvez ajouter plus de détails ici si nécessaire, par exemple, des informations sur les montants
        }));

        res.status(200).json(transactions);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique des transactions:", error.message);
        next(error); // Passer l'erreur au prochain middleware de gestion des erreurs
    }
};
