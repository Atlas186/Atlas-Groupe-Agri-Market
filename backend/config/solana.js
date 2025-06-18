// Fichier : ~/Atlas-Groupe-Agri-Market/backend/config/solana.js

import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

let solanaConnection;
let agCoinMintAddress;

const initializeSolana = () => {
    try {
        const network = process.env.SOLANA_NETWORK || 'mainnet-beta';
        solanaConnection = new Connection(`https://api.${network}.solana.com`, 'confirmed');

        // L'adresse de la mint de votre jeton AG-COIN
        agCoinMintAddress = new PublicKey(process.env.AG_COIN_MINT_ADDRESS);

        console.log(`Connecté au réseau Solana: ${network}`);
        console.log(`Adresse du jeton AG-COIN: ${agCoinMintAddress.toBase58()}`);

    } catch (error) {
        console.error(`Erreur d'initialisation Solana: ${error.message}`);
        // Ne pas appeler process.exit(1) ici si Solana n'est pas critique au démarrage
    }
};

initializeSolana();

export { solanaConnection, agCoinMintAddress };

