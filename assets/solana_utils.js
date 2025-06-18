// assets/js/solana_utils.js

// Importations des fonctions d'UI/utilitaires depuis script.js
import { showToast, truncateAddress, addActivity, DOMElements, toggleSolanaButtons, updateSolanaUIDisconnected } from './script.js';

// Globales pour Solana
const AG_COIN_MINT_ADDRESS_STR = "74Fs11K6HVfWAZFCsUT72ffAugcRksTtHqW4XgmeuUx4"; // Adresse du token AG-COIN
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"; // Utilisez un RPC public ou votre propre nœud Hélius/QuickNode

let connection = null;
let PublicKey = null;
let LAMPORTS_PER_SOL = null;
let Token = null;
let TOKEN_PROGRAM_ID = null;

export let connectedWalletPublicKey = null; // Exporté pour être utilisé dans script.js

// Initialise les objets Solana si les scripts CDN sont chargés
function initializeSolanaObjects() {
    if (window.SolanaWeb3 && window.SPLToken) {
        Connection = window.SolanaWeb3.Connection;
        PublicKey = window.SolanaWeb3.PublicKey;
        LAMPORTS_PER_SOL = window.SolanaWeb3.LAMPORTS_PER_SOL;
        Token = window.SPLToken.Token;
        TOKEN_PROGRAM_ID = window.SPLToken.TOKEN_PROGRAM_ID;

        connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        console.log("Bibliothèques Solana chargées et connexion établie.");
    } else {
        console.warn("SolanaWeb3 ou SPLToken n'est pas chargé. Les fonctionnalités Solana seront désactivées.");
    }
}

// Assurez-vous que les objets Solana sont initialisés une fois les scripts CDN chargés
// Ceci est crucial car les scripts sont chargés avec 'defer'.
window.addEventListener('load', initializeSolanaObjects);


/**
 * Vérifie si un portefeuille Solana (ex: Phantom) est détecté dans le navigateur.
 * @returns {object|null} L'objet portefeuille s'il est détecté, sinon null.
 */
export function getSolanaWallet() {
    if ("solana" in window && window.solana.isPhantom) {
        return window.solana;
    }
    return null;
}

/**
 * Tente de connecter le portefeuille Solana de l'utilisateur.
 * @returns {Promise<boolean>} Vrai si la connexion est réussie, faux sinon.
 */
export async function connectSolanaWallet() {
    const wallet = getSolanaWallet();
    if (!wallet || !connection || !PublicKey || !LAMPORTS_PER_SOL) {
        showToast("Portefeuille Solana (ex: Phantom) non détecté ou bibliothèques Solana non chargées. Veuillez installer une extension de portefeuille.", 'error', 7000);
        return false;
    }

    try {
        if (wallet.isConnected && wallet.publicKey) {
            connectedWalletPublicKey = wallet.publicKey.toString();
            showToast("Portefeuille déjà connecté.", "info");
            return true;
        }

        showToast("Connexion au portefeuille Solana en cours...", "info", 3000);
        const resp = await wallet.connect();
        connectedWalletPublicKey = resp.publicKey.toString();

        DOMElements.solanaWalletAddress.textContent = truncateAddress(connectedWalletPublicKey);
        DOMElements.solanaConnectionStatus.textContent = 'Connecté';
        DOMElements.solanaConnectionStatus.classList.remove('unverified');
        DOMElements.solanaConnectionStatus.classList.add('verified');

        addActivity({ description: "Portefeuille Solana connecté.", icon: "fas fa-plug" });
        showToast('Portefeuille Solana connecté avec succès !', 'success');

        // Écouteurs pour les changements de compte ou de déconnexion
        if (!wallet._listeners || !wallet._listeners.accountChanged) { // Empêche d'ajouter plusieurs fois les listeners
             wallet.on('accountChanged', async (newPublicKey) => {
                if (newPublicKey) {
                    connectedWalletPublicKey = newPublicKey.toString();
                    DOMElements.solanaWalletAddress.textContent = truncateAddress(connectedWalletPublicKey);
                    await updateSolanaBalances(connectedWalletPublicKey);
                    showToast('Portefeuille Solana changé. Solde mis à jour.', 'info');
                    addActivity({ description: "Portefeuille Solana changé.", icon: "fas fa-sync-alt" });
                } else {
                    await disconnectSolanaWallet(); // Déconnexion si la clé est null
                    showToast('Portefeuille Solana déconnecté via l\'extension.', 'error');
                    addActivity({ description: "Portefeuille Solana déconnecté (extension).", icon: "fas fa-power-off" });
                }
            });

            wallet.on('disconnect', async () => {
                await disconnectSolanaWallet();
                showToast('Portefeuille Solana déconnecté.', 'error');
                addActivity({ description: "Portefeuille Solana déconnecté.", icon: "fas fa-power-off" });
            });
        }

        return true;
    } catch (error) {
        console.error("Erreur de connexion au portefeuille Solana:", error);
        showToast('Échec de la connexion au portefeuille Solana. Assurez-vous qu\'un portefeuille est installé et déverrouillé.', 'error', 7000);
        connectedWalletPublicKey = null;
        updateSolanaUIDisconnected();
        toggleSolanaButtons(false);
        return false;
    }
}

/**
 * Déconnecte le portefeuille Solana de l'utilisateur.
 */
export async function disconnectSolanaWallet() {
    const wallet = getSolanaWallet();
    if (wallet && wallet.isConnected) {
        try {
            await wallet.disconnect();
            showToast('Portefeuille Solana déconnecté.', 'info');
        } catch (error) {
            console.error("Erreur lors de la déconnexion du portefeuille:", error);
        }
    }
    connectedWalletPublicKey = null;
    updateSolanaUIDisconnected();
    toggleSolanaButtons(false);
    addActivity({ description: "Déconnexion du portefeuille Solana.", icon: "fas fa-power-off" });
}


/**
 * Met à jour les soldes SOL et AG-COIN affichés dans l'interface.
 * @param {string} publicKeyString - La clé publique du portefeuille connecté.
 */
export async function updateSolanaBalances(publicKeyString) {
    if (!connection || !PublicKey || !LAMPORTS_PER_SOL) {
        console.warn("Les bibliothèques Solana ne sont pas disponibles pour récupérer les soldes.");
        DOMElements.solBalance.textContent = 'N/A';
        DOMElements.agCoinBalance.textContent = 'N/A';
        return;
    }

    try {
        const ownerPublicKey = new PublicKey(publicKeyString);

        // Récupérer le solde SOL
        const balanceLamports = await connection.getBalance(ownerPublicKey);
        const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
        DOMElements.solBalance.textContent = `${balanceSol.toFixed(4)} SOL`;

        // Récupérer le solde AG-COIN
        await getAgCoinBalance(ownerPublicKey);

    } catch (error) {
        console.error("Erreur lors de la récupération des soldes Solana:", error);
        DOMElements.solBalance.textContent = 'Erreur';
        DOMElements.agCoinBalance.textContent = 'Erreur';
        showToast('Erreur lors de la récupération des soldes Solana.', 'error');
    }
}

/**
 * Récupère le solde AG-COIN pour une clé publique donnée.
 * @param {PublicKey} ownerPublicKey - La clé publique du propriétaire.
 */
async function getAgCoinBalance(ownerPublicKey) {
    if (!connection || !PublicKey || !Token || !TOKEN_PROGRAM_ID) {
        console.warn("Les bibliothèques SPL-Token ne sont pas disponibles pour récupérer le solde AG-COIN.");
        DOMElements.agCoinBalance.textContent = 'N/A';
        return;
    }

    try {
        const agCoinMintPublicKey = new PublicKey(AG_COIN_MINT_ADDRESS_STR);

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            ownerPublicKey,
            { mint: agCoinMintPublicKey },
            'confirmed'
        );

        let agCoinAmount = 0;
        if (tokenAccounts && tokenAccounts.value.length > 0) {
            const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
            agCoinAmount = accountInfo.tokenAmount.uiAmount;
        }
        DOMElements.agCoinBalance.textContent = `${agCoinAmount.toFixed(2)} AG-COIN`;
    } catch (error) {
        console.error("Erreur lors de la récupération du solde AG-COIN:", error);
        DOMElements.agCoinBalance.textContent = 'Erreur (Token non trouvé)';
    }
}
