-- Fichier: backend/sql/init.sql

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Utilisation de UUID pour les IDs
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birth_date DATE,
    country VARCHAR(100),
    document_type VARCHAR(100),
    membership_date TIMESTAMPTZ DEFAULT NOW(), -- Date d'inscription
    kyc_verified BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    solana_wallet_address VARCHAR(255) UNIQUE, -- Adresse du portefeuille Solana liée (peut être null)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour une recherche rapide par email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Table des activités (pour l'historique utilisateur)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    icon VARCHAR(50), -- ex: "fas fa-user-edit"
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour mettre à jour 'updated_at' automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
