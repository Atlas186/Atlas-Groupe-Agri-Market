// Fichier: backend/controllers/solanaController.js
import { solanaConnection, agCoinMintPublicKey } from '../config/solana.js';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { findUserById } from '../models/userModel.js'; // Pour récupérer l'adresse liée

export const getWalletBalances = async (req, res, next) => {
    const { walletAddress } = req.params; // L'adresse peut être passée comme paramètre ou récupérée du profil utilisateur lié

    if (!walletAddress) {
        // Tente de récupérer l'adresse liée à l'utilisateur si non fournie dans les params
        const user = await findUserById(req.user.id);
        if (user && user.solana_wallet_address) {
            walletAddress = user.solana_wallet_address;
        } else {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana manquante.' });
        }
    }

    try {
        const ownerPublicKey = new PublicKey(walletAddress);

        // Solde SOL
        const solBalanceLamports = await solanaConnection.getBalance(ownerPublicKey);
        const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;

        // Solde AG-COIN
        let agCoinBalance = 0;
        try {
            const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
                ownerPublicKey,
                { mint: agCoinMintPublicKey },
                'confirmed'
            );

            if (tokenAccounts && tokenAccounts.value.length > 0) {
                agCoinBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            }
        } catch (tokenError) {
            console.warn(`Impossible de récupérer le solde AG-COIN pour ${walletAddress}: ${tokenError.message}`);
            // Ce n'est pas une erreur critique si le compte de token n'existe pas, il aura juste 0 AG-COIN
        }

        res.status(200).json({
            solanaWalletAddress: walletAddress,
            solBalance: solBalance,
            agCoinBalance: agCoinBalance,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des soldes Solana:", error.message);
        // Spécifique si l'adresse est invalide
        if (error.message.includes('Invalid public key')) {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana invalide.' });
        }
        next(error);
    }
};

// Endpoint pour récupérer l'historique des transactions (très simplifié)
export const getTransactionHistory = async (req, res, next) => {
    const { walletAddress } = req.params; // Ou depuis req.user.solana_wallet_address

    if (!walletAddress) {
        const user = await findUserById(req.user.id);
        if (user && user.solana_wallet_address) {
            walletAddress = user.solana_wallet_address;
        } else {
            return res.status(400).json({ message: 'Adresse de portefeuille Solana manquante.' });
        }
    }

    try {
        const publicKey = new PublicKey(walletAddress);
        const signatures = await solanaConnection.getSignaturesForAddress(publicKey, { limit: 10 }); // Limite à 10 signatures

        // Pour un vrai historique, vous devrez itérer sur les signatures et récupérer les détails de chaque transaction
        // C'est une opération coûteuse en RPC, donc une bonne raison de la proxyfier via le backend
        const transactions = signatures.map(sig => ({
            signature: sig.signature,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: sig.confirmationStatus,
            // Pour obtenir les détails comme les adresses impliquées, les montants, etc., vous devriez faire:
            // const tx = await solanaConnection.getParsedTransaction(sig.signature, 'confirmed');
            // Et ensuite analyser tx.transaction.message.instructions et tx.meta.postTokenBalances
        }));

        res.status(200).json(transactions);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique des transactions:", error.message);
        next(error);
    }
};

/*
 * Note sur l'envoi de transactions:
 * Les transactions d'envoi d'AG-COIN doivent idéalement être initiées et signées par le portefeuille de l'utilisateur (Phantom, etc.) côté frontend.
 * Le backend peut servir à valider les informations (destinataire, montant) avant que le frontend ne demande à l'utilisateur de signer.
 * Si le backend doit signer, cela signifie que la clé privée du portefeuille source doit être stockée sur le backend, ce qui est EXTRÊMEMENT RISQUÉ
 * et ne devrait être fait que pour des comptes de dépôt/retrait centralisés avec des mesures de sécurité de pointe (hardware wallets, HSMs, etc.).
 * Pour les utilisateurs finaux, la signature doit rester côté client.
*/
// Exemple très simplifié d'une route pour "dépôt" si le backend est impliqué dans l'émission de AG-COIN
// Ceci est à implémenter AVEC DES MESURES DE SÉCURITÉ DRACONIENNES
// export const depositAgCoin = async (req, res, next) => {
//     const { amount } = req.body; // Adresse du portefeuille destinataire est celle de l'utilisateur
//
//     // Logique pour émettre des AG-COIN à l'utilisateur (par exemple, suite à un virement bancaire réel)
//     // Cela impliquerait un compte source contrôlé par le backend, une clé privée signataire sécurisée,
//     // et un suivi rigoureux pour éviter les doubles dépenses.
//     try {
//          // Valider amount, vérifier le KYC de l'utilisateur, etc.
//          // ...
//          // const transactionSignature = await solanaService.mintToUser(req.user.solana_wallet_address, amount);
//          // await addActivity(req.user.id, `Dépôt de ${amount} AG-COIN. Tx: ${transactionSignature}`, 'fas fa-download');
//          res.status(200).json({ message: `Dépôt de ${amount} AG-COIN réussi.`, /* txId */ });
//     } catch (error) {
//         next(error);
//     }
// };
