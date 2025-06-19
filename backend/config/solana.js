// Fichier : ~/Atlas-Groupe-Agri-Market/backend/config/solana.js

// FIX: Ensure 'import' is all lowercase here
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

let solanaConnection;
// FIX: Ensure agCoinMintPublicKey is declared with 'let' at the top
// and consistently named throughout.
let agCoinMintPublicKey;

const initializeSolana = () => {
    try {
        const network = process.env.SOLANA_NETWORK || 'mainnet-beta';
        solanaConnection = new Connection(`https://api.${network}.solana.com`, 'confirmed');

        // L'adresse de la mint de votre jeton AG-COIN
        // FIX: Read from AG_COIN_MINT_ADDRESS (not _STR)
        const agCoinMintAddressString = process.env.AG_COIN_MINT_ADDRESS; 
        
        if (!agCoinMintAddressString) {
            console.error("Erreur: AG_COIN_MINT_ADDRESS n'est pas défini dans les variables d'environnement.");
            // Potentiellement lancer une erreur ou sortir si Solana est critique
            return; 
        }

        // FIX: Assign the PublicKey object to the globally declared variable
        agCoinMintPublicKey = new PublicKey(agCoinMintAddressString);

        console.log(`Connecté au réseau Solana: ${network}`);
        console.log(`Adresse du jeton AG-COIN: ${agCoinMintPublicKey.toBase58()}`); 

    } catch (error) {
        console.error(`Erreur d'initialisation Solana: ${error.message}`);
        // Ne pas appeler process.exit(1) ici si Solana n'est pas critique au démarrage
    }
};

initializeSolana(); // Call the initialization function when the module loads

// FIX: Export both variables as named exports
export { solanaConnection, agCoinMintPublicKey };
