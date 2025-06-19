// Fichier: backend/models/activityModel.js
import pool from '../config/db.js';

export const addActivity = async (userId, description, icon = null) => {
    const res = await query(
        `INSERT INTO activities (user_id, description, icon)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, description, icon]
    );
    return res.rows[0];
};

export const getActivitiesByUserId = async (userId, limit = 10) => {
    const res = await query(
        `SELECT * FROM activities
         WHERE user_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [userId, limit]
    );
    return res.rows;
};
