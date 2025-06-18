// Fichier: backend/controllers/activityController.js
import { getActivitiesByUserId } from '../models/activityModel.js';

export const getUserActivities = async (req, res, next) => {
    try {
        const activities = await getActivitiesByUserId(req.user.id, 20); // Limite à 20 activités

        res.status(200).json(activities.map(activity => ({
            description: activity.description,
            icon: activity.icon,
            timestamp: activity.timestamp,
        })));
    } catch (error) {
        next(error);
    }
};
