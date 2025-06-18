// src/App.tsx

import { useMemo } from 'react';
import Navbar from './components/Navbar';

// Import Solana Wallet Adapter components and hooks
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// **CORRECTED IMPORTS FOR INDIVIDUAL WALLET ADAPTERS**
// Based on your previous 'ls' output, you have these installed:
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'; // Assuming you want this one
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow';       // Assuming you want this one
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';     // Assuming you want this one

// Import wallet adapter CSS (important for the UI components)
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const endpoint = "https://api.mainnet-beta.solana.com";

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }), // Specify network for Solflare
      new BackpackWalletAdapter(), // Initialize Backpack Wallet Adapter
      new GlowWalletAdapter(),     // Initialize Glow Wallet Adapter
      new TrustWalletAdapter(),    // Initialize Trust Wallet Adapter
      // Add more wallets here if you installed them and want to use them
      // new LedgerWalletAdapter(),
      // new SolletWalletAdapter({ network }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="flex items-center justify-center p-8">
              <h1 className="text-4xl font-bold text-green-700">
                Bienvenue sur Atlas-Groupe-Agri-Market !
              </h1>
            </div>
            {/* You'll add other components here later */}
            <div className="flex justify-center mt-4">
              {/* If you want a connect button, uncomment this and import WalletMultiButton from '@solana/wallet-adapter-react-ui' at the top */}
              {/* <WalletMultiButton /> */}
              <p>Wallet integration context is available.</p>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;

