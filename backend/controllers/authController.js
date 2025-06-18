// Fichier: backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, updateUser } from '../models/userModel.js';
import { addActivity } from '../models/activityModel.js';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

export const registerUser = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Veuillez entrer tous les champs requis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        const userExists = await findUserByEmail(email);
        if (userExists) {
            return res.status(409).json({ message: 'L\'utilisateur existe déjà avec cet email' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await createUser(firstName, lastName, email, passwordHash);

        await addActivity(newUser.id, 'Nouvelle inscription sur la plateforme.', 'fas fa-user-plus');

        res.status(201).json({
            id: newUser.id,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: newUser.email,
            kycVerified: newUser.kyc_verified,
            token: generateToken(newUser.id),
        });
    } catch (error) {
        next(error); // Passe l'erreur au middleware de gestion d'erreurs
    }
};

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez entrer l\'email et le mot de passe' });
    }

    try {
        const user = await findUserByEmail(email);

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            await addActivity(user.id, 'Connexion réussie.', 'fas fa-sign-in-alt');
            res.status(200).json({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                kycVerified: user.kyc_verified,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }
    } catch (error) {
        next(error);
    }
};
