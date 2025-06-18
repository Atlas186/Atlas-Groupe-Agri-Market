// assets/js/script.js

// Importations depuis solana_utils.js
import { connectSolanaWallet, disconnectSolanaWallet, updateSolanaBalances, getSolanaWallet, connectedWalletPublicKey } from './solana_utils.js';

// Constantes et sélecteurs d'éléments DOM
const BACKEND_URL = 'http://localhost:5000'; // À remplacer par l'URL de votre backend en production
const USER_ID = 'user_123'; // Ceci doit venir de votre système d'authentification en production

const DOMElements = {
    profileAvatar: document.getElementById('profileAvatar'),
    welcomeName: document.getElementById('welcomeName'),
    fullName: document.getElementById('fullName'),
    birthDate: document.getElementById('birthDate'),
    country: document.getElementById('country'),
    documentType: document.getElementById('documentType'),
    membershipDate: document.getElementById('membershipDate'),
    kycStatusText: document.getElementById('kycStatusText'),
    profileDetailsSection: document.getElementById('profileDetailsSection'),
    editProfileSection: document.getElementById('editProfileSection'),
    editProfileForm: document.getElementById('editProfileForm'),
    editFirstName: document.getElementById('editFirstName'),
    editLastName: document.getElementById('editLastName'),
    editBirthDate: document.getElementById('editBirthDate'),
    editCountry: document.getElementById('editCountry'),
    editDocumentType: document.getElementById('editDocumentType'),
    recentActivityList: document.getElementById('recentActivity'),
    editProfileButton: document.getElementById('editProfileButton'),
    kycVerificationButton: document.getElementById('kycVerificationButton'),
    connectSolanaButton: document.getElementById('connectSolanaButton'),
    disconnectSolanaButton: document.getElementById('disconnectSolanaButton'),
    sendAgCoinButton: document.getElementById('sendAgCoinButton'),
    solanaWalletAddress: document.getElementById('solanaWalletAddress'),
    solBalance: document.getElementById('solBalance'),
    agCoinBalance: document.getElementById('agCoinBalance'),
    solanaConnectionStatus: document.getElementById('solanaConnectionStatus'),
    cancelEditButton: document.getElementById('cancelEditButton'),
    messageContainer: document.getElementById('message-container') // Référence au conteneur de messages
};

// --- Fonctions utilitaires globales ---
/**
 * Formate une chaîne de date en format lisible par l'utilisateur.
 * @param {string} dateString - La chaîne de date ISO.
 * @returns {string} Date formatée ou chaîne vide.
 */
function formatDate(dateString) {
    if (!dateString) return 'Non renseigné';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    } catch (e) {
        console.error("Erreur de formatage de date:", e);
        return 'Format de date invalide';
    }
}

/**
 * Formate un timestamp ISO en format lisible par l'utilisateur.
 * @param {string} timestamp - Le timestamp ISO.
 * @returns {string} Timestamp formaté ou chaîne vide.
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(date);
    } catch (e) {
        console.error("Erreur de formatage du timestamp:", e);
        return timestamp;
    }
}

/**
 * Affiche un message toast à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {'success' | 'error' | 'info'} type - Le type de message.
 * @param {number} [duration=5000] - Durée d'affichage du message en ms.
 */
export function showToast(message, type, duration = 5000) {
    if (!DOMElements.messageContainer) {
        console.warn("Conteneur de message non trouvé. Impossible d'afficher le toast.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert'); // Pour l'accessibilité

    DOMElements.messageContainer.prepend(toast);

    // Supprime le toast après la durée spécifiée
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-in forwards'; // Déclenche l'animation de disparition
        setTimeout(() => toast.remove(), 500); // Supprime l'élément après l'animation
    }, duration);
}

/**
 * Tronque une adresse longue pour un affichage plus concis.
 * @param {string} address - L'adresse à tronquer.
 * @param {number} [startLength=6] - Nombre de caractères à afficher au début.
 * @param {number} [endLength=4] - Nombre de caractères à afficher à la fin.
 * @returns {string} Adresse tronquée ou originale si trop courte.
 */
export function truncateAddress(address, startLength = 6, endLength = 4) {
    if (!address || address.length < startLength + endLength) {
        return address;
    }
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}

// --- Gestion des données utilisateur (Backend et LocalStorage) ---
const LOCAL_STORAGE_ACTIVITY_KEY = 'userActivity';

/**
 * Récupère les activités stockées dans le localStorage.
 * @returns {Array<Object>} Liste des activités.
 */
function getActivities() {
    const storedActivities = localStorage.getItem(LOCAL_STORAGE_ACTIVITY_KEY);
    return storedActivities ? JSON.parse(storedActivities) : [];
}

/**
 * Ajoute une nouvelle activité à l'historique et met à jour le localStorage.
 * @param {Object} activity - L'objet activité (description, icon).
 */
function addActivity(activity) {
    const activities = getActivities();
    const newActivity = {
        description: activity.description,
        timestamp: new Date().toISOString(),
        icon: activity.icon || "fas fa-info-circle"
    };
    activities.unshift(newActivity);
    const MAX_ACTIVITIES = 10;
    if (activities.length > MAX_ACTIVITIES) {
        activities.splice(MAX_ACTIVITIES);
    }
    localStorage.setItem(LOCAL_STORAGE_ACTIVITY_KEY, JSON.stringify(activities));
    updateRecentActivity(activities);
}

/**
 * Efface l'historique d'activités.
 */
function clearActivities() {
    localStorage.removeItem(LOCAL_STORAGE_ACTIVITY_KEY);
    updateRecentActivity([]);
    showToast("Historique d'activités effacé.", "info");
}

/**
 * Récupère le profil utilisateur depuis le backend.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<Object|null>} Le profil utilisateur ou null en cas d'erreur.
 */
async function fetchUserProfile(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/profile/${userId}`, {
            headers: {
                'Accept': 'application/json',
                // 'Authorization': `Bearer ${yourAuthToken}` // Ajoutez votre token d'authentification ici
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        const profile = await response.json();
        return profile;
    } catch (error) {
        console.error("Erreur fetchUserProfile:", error);
        showToast(`Erreur de chargement du profil: ${error.message}`, 'error');
        // Retourne un profil par défaut si l'API est injoignable ou en erreur
        return {
            first_name: "Invité", last_name: "", birth_date: null, country: "",
            document_type: "", membership_date: new Date().toISOString(), kyc_verified: false,
            profile_image_url: "/assets/img/avatar_placeholder.jpeg"
        };
    }
}

/**
 * Met à jour le profil utilisateur via le backend.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {Object} profileData - Les données du profil à mettre à jour.
 * @returns {Promise<Object|null>} Le profil mis à jour ou null en cas d'erreur.
 */
async function updateUserProfile(userId, profileData) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${yourAuthToken}`
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        const updatedProfile = await response.json();
        showToast('Profil mis à jour avec succès !', 'success');
        addActivity({ description: "Profil mis à jour.", icon: "fas fa-user-edit" });
        return updatedProfile;
    } catch (error) {
        console.error("Erreur updateUserProfile:", error);
        showToast(`Échec de la mise à jour du profil: ${error.message}`, 'error');
        return null;
    }
}

// --- Logique principale de l'application ---
let currentProfileData = null; // Stocke les données du profil chargées

// Liste des pays africains pour le sélecteur
const africanCountries = [
    { code: "DZ", name: "Algérie" }, { code: "AO", name: "Angola" }, { code: "BJ", name: "Bénin" },
    { code: "BW", name: "Botswana" }, { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" },
    { code: "CM", name: "Cameroun" }, { code: "CV", name: "Cap-Vert" }, { code: "CF", name: "République Centrafricaine" },
    { code: "KM", name: "Comores" }, { code: "CG", name: "Congo (Rép.)" }, { code: "CD", name: "Congo (RDC)" },
    { code: "CI", name: "Côte d'Ivoire" }, { code: "DJ", name: "Djibouti" }, { code: "EG", name: "Égypte" },
    { code: "ER", name: "Érythrée" }, { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Éthiopie" },
    { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambie" }, { code: "GH", name: "Ghana" },
    { code: "GN", name: "Guinée" }, { code: "GQ", name: "Guinée Équatoriale" }, { code: "GW", name: "Guinée-Bissau" },
    { code: "KE", name: "Kenya" }, { code: "LS", name: "Lesotho" }, { code: "LR", name: "Libéria" },
    { code: "LY", name: "Libye" }, { code: "MG", name: "Madagascar" }, { code: "MW", name: "Malawi" },
    { code: "ML", name: "Mali" }, { code: "MR", name: "Mauritanie" }, { code: "MU", name: "Maurice" },
    { code: "MA", name: "Maroc" }, { code: "MZ", name: "Mozambique" }, { code: "NA", name: "Namibie" },
    { code: "NE", name: "Niger" }, { code: "NG", name: "Nigéria" }, { code: "UG", name: "Ouganda" },
    { code: "RW", name: "Rwanda" }, { code: "ST", name: "Sao Tomé-et-Principe" }, { code: "SN", name: "Sénégal" },
    { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SO", name: "Somalie" },
    { code: "ZA", name: "Afrique du Sud" }, { code: "SS", name: "Soudan du Sud" }, { code: "SD", name: "Soudan" },
    { code: "TZ", name: "Tanzanie" }, { code: "TG", name: "Togo" }, { code: "TN", name: "Tunisie" },
    { code: "TD", name: "Tchad" }, { code: "ZM", name: "Zambie" }, { code: "ZW", name: "Zimbabwe" }
];

/**
 * Initialise l'application après le chargement du DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Remplir le sélecteur de pays
    africanCountries.sort((a, b) => a.name.localeCompare(b.name));
    DOMElements.editCountry.innerHTML = '<option value="">Sélectionnez un pays</option>'; // Option par défaut
    africanCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        DOMElements.editCountry.appendChild(option);
    });

    await initApp();
});

async function initApp() {
    await loadUserProfile();
    loadUserActivity();
    addEventListeners();

    // Tente de reconnecter le portefeuille Solana si une session active est détectée
    const wallet = getSolanaWallet();
    if (wallet && wallet.isConnected && wallet.publicKey) {
        await handleConnectSolana(); // Réutilise la fonction de connexion existante
    } else {
        toggleSolanaButtons(false);
    }
}

/**
 * Charge le profil utilisateur et met à jour l'interface.
 */
async function loadUserProfile() {
    DOMElements.fullName.textContent = 'Chargement...';
    DOMElements.birthDate.textContent = 'Chargement...';
    DOMElements.country.textContent = 'Chargement...';
    DOMElements.documentType.textContent = 'Chargement...';
    DOMElements.membershipDate.textContent = 'Chargement...';
    DOMElements.kycStatusText.textContent = 'Chargement...';

    const userId = USER_ID;
    showToast('Chargement du profil...', 'info', 2000);
    const profileData = await fetchUserProfile(userId);

    if (profileData) {
        currentProfileData = profileData;
        updateProfileUI(currentProfileData);
        populateEditForm(currentProfileData);
        addActivity({ description: "Profil chargé.", icon: "fas fa-sync-alt" });
    } else {
        // En cas d'échec grave, affiche un message d'erreur et remet des placeholders
        showToast("Impossible de charger le profil. Veuillez vérifier la connexion au backend.", "error");
        DOMElements.fullName.textContent = 'Non disponible';
        // ... réinitialiser d'autres champs si nécessaire
    }
}

/**
 * Met à jour l'interface utilisateur avec les données du profil.
 * @param {Object} profileData - Les données du profil.
 */
function updateProfileUI(profileData) {
    const welcomeNameText = `Bienvenue, ${profileData.first_name || 'Utilisateur'}`;
    DOMElements.welcomeName.textContent = welcomeNameText;
    DOMElements.fullName.textContent = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Non renseigné';
    DOMElements.birthDate.textContent = formatDate(profileData.birth_date);
    const countryName = africanCountries.find(c => c.code === profileData.country)?.name || profileData.country || 'Non renseigné';
    DOMElements.country.textContent = countryName;
    DOMElements.documentType.textContent = profileData.document_type || 'Non renseigné';
    DOMElements.membershipDate.textContent = formatDate(profileData.membership_date);
    DOMElements.profileAvatar.src = profileData.profile_image_url || '/assets/img/avatar_placeholder.jpeg';

    // Mise à jour du statut KYC
    if (profileData.kyc_verified) {
        DOMElements.kycStatusText.textContent = 'Vérifié';
        DOMElements.kycStatusText.classList.remove('unverified');
        DOMElements.kycStatusText.classList.add('verified');
    } else {
        DOMElements.kycStatusText.textContent = 'Non vérifié';
        DOMElements.kycStatusText.classList.remove('verified');
        DOMElements.kycStatusText.classList.add('unverified');
    }
}

/**
 * Remplit le formulaire d'édition avec les données du profil actuel.
 * @param {Object} profileData - Les données du profil.
 */
function populateEditForm(profileData) {
    DOMElements.editFirstName.value = profileData.first_name || '';
    DOMElements.editLastName.value = profileData.last_name || '';
    DOMElements.editBirthDate.value = profileData.birth_date ? new Date(profileData.birth_date).toISOString().split('T')[0] : '';
    DOMElements.editCountry.value = profileData.country || '';
    DOMElements.editDocumentType.value = profileData.document_type || '';
}

/**
 * Gère la soumission du formulaire d'édition du profil.
 * @param {Event} event - L'événement de soumission.
 */
async function handleSaveProfile(event) {
    event.preventDefault();

    // Collecte des données du formulaire
    const formData = {
        first_name: DOMElements.editFirstName.value.trim(),
        last_name: DOMElements.editLastName.value.trim(),
        birth_date: DOMElements.editBirthDate.value,
        country: DOMElements.editCountry.value,
        document_type: DOMElements.editDocumentType.value.trim(),
        // Assurez-vous d'inclure les champs non modifiables du formulaire
        // si votre API de backend les attend pour une mise à jour partielle.
        membership_date: currentProfileData.membership_date,
        kyc_verified: currentProfileData.kyc_verified,
        profile_image_url: currentProfileData.profile_image_url
    };

    // Validation simple côté client
    if (!formData.first_name || !formData.last_name) {
        showToast("Le prénom et le nom sont obligatoires.", "error");
        return;
    }

    const updatedProfile = await updateUserProfile(USER_ID, formData);
    if (updatedProfile) {
        currentProfileData = updatedProfile;
        updateProfileUI(currentProfileData);
        toggleEditProfile(); // Revenir à l'affichage du profil
    }
}

/**
 * Charge l'activité utilisateur depuis localStorage et met à jour l'interface.
 */
function loadUserActivity() {
    const activities = getActivities();
    updateRecentActivity(activities);
}

/**
 * Met à jour la liste des activités récentes dans l'interface.
 * @param {Array<Object>} activityData - Les données d'activité.
 */
function updateRecentActivity(activityData) {
    DOMElements.recentActivityList.innerHTML = ''; // Nettoie le contenu existant

    if (activityData && activityData.length > 0) {
        activityData.forEach(activity => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="activity-icon"><i class="${activity.icon}" aria-hidden="true"></i></span>
                <span>${activity.description}</span>
                <span class="activity-timestamp">${formatTimestamp(activity.timestamp)}</span>
            `;
            DOMElements.recentActivityList.appendChild(listItem);
        });
    } else {
        DOMElements.recentActivityList.innerHTML = '<li>Aucune activité récente.</li>';
    }
}

/**
 * Bascule entre l'affichage du profil et le formulaire d'édition.
 */
function toggleEditProfile() {
    if (DOMElements.editProfileSection.style.display === 'block') {
        DOMElements.editProfileSection.style.display = 'none';
        DOMElements.profileDetailsSection.style.display = 'block';
    } else {
        DOMElements.profileDetailsSection.style.display = 'none';
        DOMElements.editProfileSection.style.display = 'block';
        if (currentProfileData) {
            populateEditForm(currentProfileData);
        }
    }
}

/**
 * Gère la connexion au portefeuille Solana.
 */
async function handleConnectSolana() {
    const isConnected = await connectSolanaWallet();
    toggleSolanaButtons(isConnected); // Met à jour l'UI des boutons
    if (isConnected) {
        // Appelle la fonction updateSolanaBalances importée
        await updateSolanaBalances(connectedWalletPublicKey);
    }
}

/**
 * Gère la déconnexion du portefeuille Solana.
 */
async function handleDisconnectSolana() {
    await disconnectSolanaWallet();
    toggleSolanaButtons(false);
    updateSolanaUIDisconnected(); // Met à jour l'UI après déconnexion
}

/**
 * Met à jour l'interface utilisateur Solana en état déconnecté.
 */
export function updateSolanaUIDisconnected() {
    DOMElements.solanaWalletAddress.textContent = 'Non connecté';
    DOMElements.solBalance.textContent = '0.00 SOL';
    DOMElements.agCoinBalance.textContent = '0.00 AG-COIN';
    DOMElements.solanaConnectionStatus.textContent = 'Déconnecté';
    DOMElements.solanaConnectionStatus.classList.remove('verified');
    DOMElements.solanaConnectionStatus.classList.add('unverified');
}

/**
 * Affiche/masque les boutons liés à Solana selon l'état de connexion.
 * @param {boolean} isConnected - Vrai si le portefeuille est connecté, faux sinon.
 */
export function toggleSolanaButtons(isConnected) {
    if (isConnected) {
        DOMElements.connectSolanaButton.style.display = 'none';
        DOMElements.disconnectSolanaButton.style.display = 'inline-flex';
        DOMElements.sendAgCoinButton.style.display = 'inline-flex';
    } else {
        DOMElements.connectSolanaButton.style.display = 'inline-flex';
        DOMElements.disconnectSolanaButton.style.display = 'none';
        DOMElements.sendAgCoinButton.style.display = 'none';
    }
}

/**
 * Gère le clic sur le bouton "ENVOYER AG-COIN".
 */
function handleSendAgCoin() {
    if (!connectedWalletPublicKey) {
        showToast("Veuillez d'abord connecter votre portefeuille Solana.", "error");
        return;
    }
    // Redirection vers la page d'envoi. Le `onclick` dans HTML peut être gardé
    // mais pour une meilleure pratique, l'événement est géré ici.
    window.location.href = 'envoyer-ag-coin.html';
    addActivity({ description: "Accès à la page d'envoi AG-COIN.", icon: "fas fa-paper-plane" });
}

/**
 * Ajoute tous les écouteurs d'événements nécessaires.
 */
function addEventListeners() {
    DOMElements.editProfileButton.addEventListener('click', toggleEditProfile);
    DOMElements.cancelEditButton.addEventListener('click', toggleEditProfile);
    DOMElements.editProfileForm.addEventListener('submit', handleSaveProfile);
    DOMElements.connectSolanaButton.addEventListener('click', handleConnectSolana);
    DOMElements.disconnectSolanaButton.addEventListener('click', handleDisconnectSolana);
    DOMElements.sendAgCoinButton.addEventListener('click', handleSendAgCoin);
}

// Exporte DOMElements pour utilisation dans solana_utils.js si nécessaire (e.g. pour mettre à jour l'UI directement)
// Ou mieux, passer les fonctions de mise à jour UI en paramètre aux fonctions solana_utils
export { DOMElements, africanCountries }; // Rendre DOMElements et africanCountries accessibles si d'autres modules en ont besoin
