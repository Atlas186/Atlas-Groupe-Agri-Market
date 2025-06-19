// Fichier: backend/models/userModel.js
import pool from '../config/db.js';

export const createUser = async (firstName, lastName, email, passwordHash) => {
    const res = await query(
        `INSERT INTO users (first_name, last_name, email, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, kyc_verified`,
        [firstName, lastName, email, passwordHash]
    );
    return res.rows[0];
};

export const findUserByEmail = async (email) => {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
};

export const findUserById = async (id) => {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
};

export const updateUser = async (id, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key in data) {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(data[key]);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        return findUserById(id); // Aucune mise à jour si aucune donnée fournie
    }

    values.push(id); // L'ID est le dernier paramètre
    const res = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex} RETURNING *`,
        values
    );
    return res.rows[0];
};

// Fonction pour lier l'adresse Solana (potentiellement utilisée lors de la connexion Phantom)
export const linkSolanaAddress = async (userId, solanaWalletAddress) => {
    const res = await query(
        `UPDATE users SET solana_wallet_address = $1, updated_at = NOW()
         WHERE id = $2 RETURNING solana_wallet_address`,
        [solanaWalletAddress, userId]
    );
    return res.rows[0];
};
