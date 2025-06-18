// js/profil.js

// --- Configurations Globales ---
// Adresse du token AG-COIN (utilisée pour l'exemple, à remplacer par votre adresse réelle)
const AG_COIN_MINT_ADDRESS_STR = "74Fs11K6HVfWAZFCsUT72ffAugcRksTtHqW4XgmeuUx4";
// URL de votre API Backend (EXEMPLE: doit être une vraie URL de votre serveur en production)
const API_BASE_URL = 'http://localhost:5000/api'; // Remplacez par l'URL de votre backend en production

// Vérifiez si SolanaWeb3 et SPLToken sont disponibles (chargés via CDN dans HTML)
const Connection = window.SolanaWeb3 ? window.SolanaWeb3.Connection : null;
const PublicKey = window.SolanaWeb3 ? window.SolanaWeb3.PublicKey : null;
const LAMPORTS_PER_SOL = window.SolanaWeb3 ? window.SolanaWeb3.LAMPORTS_PER_SOL : null;
const Token = window.SPLToken ? window.SPLToken.Token : null;
const TOKEN_PROGRAM_ID = window.SPLToken ? window.SPLToken.TOKEN_PROGRAM_ID : null;

let connection = null;
if (Connection) {
    // Utilisez un nœud Solana stable pour la production (ex: Helius, QuickNode)
    // Pour cet exemple, nous utilisons un nœud public.
    const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"; // Changez pour devnet/testnet si vous testez
    connection = new Connection(SOLANA_RPC_URL, 'confirmed');
} else {
    console.warn("SolanaWeb3 n'est pas chargé. Les fonctionnalités Solana seront désactivées.");
}

// Données par défaut pour un profil (utilisées si pas de backend ou échec de chargement)
const defaultProfileData = {
    firstName: "Thierry Joël",
    lastName: "Yougma",
    birthDate: "1990-07-13",
    country: "BF", // Code pour Burkina Faso
    documentType: "Carte d'identité",
    membershipDate: "2024-01-15T10:00:00Z", // Date d'adhésion fictive
    kycVerified: false, // Statut KYC initial
    profileImageUrl: "https://i.imgur.com/RFmrZ6x.jpeg"
};

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

// --- Éléments du DOM (mis en cache pour de meilleures performances) ---
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
    messageContainer: document.getElementById('message-container') // Cache le conteneur de messages
};

let currentProfileData = null; // Stocke les données du profil de l'utilisateur
let connectedWalletPublicKey = null; // Stocke la clé publique du portefeuille connecté

// --- Fonctions Utilitaires ---

/**
 * Formate une chaîne de date en format lisible (ex: 15 janvier 2023).
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
        return dateString;
    }
}

/**
 * Formate un timestamp en format lisible (ex: 15 janv. 2023 à 10:30:00).
 * @param {string} timestamp - Le timestamp ISO.
 * @returns {string} Timestamp formaté ou chaîne vide.
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Inconnu';
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
 * Affiche un message de notification (toast) à l'utilisateur.
 * @param {string} message - Le texte du message.
 * @param {'success'|'error'|'info'} type - Le type de message (influence le style).
 * @param {number} duration - Durée d'affichage du message en ms.
 */
function showToast(message, type, duration = 5000) {
    if (!DOMElements.messageContainer) {
        console.warn("Conteneur de message non trouvé. Impossible d'afficher le toast.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    DOMElements.messageContainer.prepend(toast); // Ajoute le nouveau message en haut

    setTimeout(() => {
        toast.remove(); // Supprime le message après la durée spécifiée
    }, duration);
}

/**
 * Tronque une adresse Solana pour un affichage plus lisible.
 * @param {string} address - L'adresse complète.
 * @param {number} startLength - Nombre de caractères au début.
 * @param {number} endLength - Nombre de caractères à la fin.
 * @returns {string} Adresse tronquée ou complète si trop courte.
 */
function truncateAddress(address, startLength = 6, endLength = 4) {
    if (!address || address.length <= startLength + endLength) {
        return address;
    }
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}

/**
 * Récupère le jeton d'authentification du localStorage.
 * En production, ce jeton serait obtenu après une connexion réussie.
 * @returns {string|null} Le jeton d'authentification ou null.
 */
function getAuthToken() {
    return localStorage.getItem('authToken'); // Remplacez par votre mécanisme réel de stockage de jeton
}

/**
 * Gère les erreurs de requête API et affiche un toast.
 * @param {Response} response - L'objet Response de la requête fetch.
 * @returns {Promise<Error>} Une promesse rejetée avec un objet Error.
 */
async function handleApiResponseError(response) {
    let errorMsg = `Erreur (${response.status}): `;
    try {
        const errorData = await response.json();
        errorMsg += errorData.message || response.statusText;
    } catch (e) {
        errorMsg += response.statusText || 'Réponse inattendue du serveur.';
    }
    showToast(errorMsg, 'error');
    return Promise.reject(new Error(errorMsg));
}

// --- Fonctions de Gestion du Profil (Interaction avec le Backend SIMULÉ) ---

/**
 * Charge les données du profil utilisateur depuis le backend.
 * En l'absence de backend, utilise des données par défaut.
 */
async function loadUserProfile() {
    const authToken = getAuthToken();
    if (!authToken) {
        // Utilisateur non connecté, afficher un profil par défaut ou rediriger
        console.log("Aucun jeton d'authentification trouvé. Chargement du profil par défaut.");
        currentProfileData = { ...defaultProfileData, firstName: "Invité", lastName: "" };
        updateProfileUI(currentProfileData);
        populateEditForm(currentProfileData);
        addActivity({ description: "Page de profil chargée (mode invité).", icon: "fas fa-sync-alt" });
        return;
    }

    try {
        showToast("Chargement du profil...", "info", 2000);
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}` // Envoie le jeton d'authentification
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showToast("Votre session a expiré ou n'est pas valide. Veuillez vous reconnecter.", "error");
                // Redirection vers la page de connexion
                setTimeout(() => window.location.href = '/connect.html', 2000);
                return;
            }
            await handleApiResponseError(response);
            return;
        }

        currentProfileData = await response.json();
        updateProfileUI(currentProfileData);
        populateEditForm(currentProfileData);
        addActivity({ description: "Profil chargé depuis le serveur.", icon: "fas fa-sync-alt" });
        showToast("Profil chargé avec succès !", "success");

    } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        showToast("Impossible de charger le profil. Veuillez réessayer.", "error");
        // En cas d'erreur réseau ou serveur, on peut afficher un profil par défaut ou vide
        currentProfileData = { ...defaultProfileData, firstName: "Erreur", lastName: "" };
        updateProfileUI(currentProfileData);
    }
}

/**
 * Met à jour l'interface utilisateur avec les données du profil.
 * @param {object} profileData - Les données du profil à afficher.
 */
function updateProfileUI(profileData) {
    const welcomeNameText = `Bienvenue, ${profileData.firstName || 'Utilisateur'} ${profileData.lastName || ''}`.trim();
    DOMElements.welcomeName.textContent = welcomeNameText || 'Bienvenue dans votre Compte AGRI-MARKET';
    DOMElements.fullName.textContent = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Non renseigné';
    DOMElements.birthDate.textContent = formatDate(profileData.birthDate) || 'Non renseigné';
    const countryName = africanCountries.find(c => c.code === profileData.country)?.name || profileData.country || 'Non renseigné';
    DOMElements.country.textContent = countryName;
    DOMElements.documentType.textContent = profileData.documentType || 'Non renseigné';
    DOMElements.membershipDate.textContent = formatDate(profileData.membershipDate) || 'Inconnu';
    DOMElements.profileAvatar.src = profileData.profileImageUrl || 'https://i.imgur.com/RFmrZ6x.jpeg';

    // Mise à jour du statut KYC
    if (profileData.kycVerified) {
        DOMElements.kycStatusText.textContent = 'Vérifié';
        DOMEElements.kycStatusText.classList.remove('unverified');
        DOMElements.kycStatusText.classList.add('verified');
    } else {
        DOMElements.kycStatusText.textContent = 'Non vérifié';
        DOMElements.kycStatusText.classList.remove('verified');
        DOMElements.kycStatusText.classList.add('unverified');
    }
}

/**
 * Remplit le formulaire d'édition avec les données du profil actuel.
 * @param {object} profileData - Les données du profil pour pré-remplir le formulaire.
 */
function populateEditForm(profileData) {
    DOMElements.editFirstName.value = profileData.firstName || '';
    DOMElements.editLastName.value = profileData.lastName || '';
    // Format YYYY-MM-DD pour l'input type="date"
    DOMElements.editBirthDate.value = profileData.birthDate ? new Date(profileData.birthDate).toISOString().split('T')[0] : '';
    DOMElements.editCountry.value = profileData.country || '';
    DOMElements.editDocumentType.value = profileData.documentType || '';
}

/**
 * Gère la soumission du formulaire d'édition de profil.
 * Envoie les données mises à jour au backend.
 * @param {Event} event - L'événement de soumission du formulaire.
 */
async function handleSaveProfile(event) {
    event.preventDefault();

    const authToken = getAuthToken();
    if (!authToken) {
        showToast("Vous devez être connecté pour modifier votre profil.", "error");
        return;
    }

    const formData = {
        firstName: DOMElements.editFirstName.value.trim(),
        lastName: DOMElements.editLastName.value.trim(),
        birthDate: DOMElements.editBirthDate.value,
        country: DOMElements.editCountry.value,
        documentType: DOMElements.editDocumentType.value.trim(),
        // membershipDate et kycVerified sont gérés par le backend, ne les envoyez pas depuis le frontend
    };

    // Validation simple côté client
    if (!formData.firstName || !formData.lastName || !formData.country) {
        showToast("Veuillez remplir tous les champs obligatoires (Prénom, Nom, Pays).", "error");
        return;
    }

    try {
        showToast("Sauvegarde du profil en cours...", "info", 3000);
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT', // Utiliser PUT pour remplacer le profil complet, ou PATCH pour une mise à jour partielle
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            await handleApiResponseError(response);
            return;
        }

        const updatedProfile = await response.json(); // Le backend devrait renvoyer le profil mis à jour
        currentProfileData = updatedProfile;
        updateProfileUI(currentProfileData); // Rafraîchir l'interface utilisateur
        toggleEditProfile(); // Revenir à l'affichage du profil
        addActivity({ description: "Profil mis à jour sur le serveur.", icon: "fas fa-user-edit" });
        showToast('Profil mis à jour avec succès !', 'success');

    } catch (error) {
        console.error("Erreur lors de l'enregistrement du profil:", error);
        showToast(`Échec de la mise à jour du profil: ${error.message || error}`, "error");
    }
}

/**
 * Affiche ou cache la section d'édition du profil.
 */
function toggleEditProfile() {
    if (DOMElements.editProfileSection.style.display === 'block') {
        DOMElements.editProfileSection.style.display = 'none';
        DOMElements.profileDetailsSection.style.display = 'block';
    } else {
        DOMElements.profileDetailsSection.style.display = 'none';
        DOMElements.editProfileSection.style.display = 'block';
        // Pré-remplir le formulaire avec les données actuelles si disponible
        if (currentProfileData) {
            populateEditForm(currentProfileData);
        }
    }
}

// --- Fonctions de Gestion de l'Activité (Interaction avec le Backend SIMULÉ) ---

/**
 * Récupère les activités de l'utilisateur depuis le backend.
 */
async function loadUserActivity() {
    const authToken = getAuthToken();
    if (!authToken) {
        console.log("Pas de jeton d'authentification pour charger les activités.");
        updateRecentActivity([]); // Afficher vide si non connecté
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/activity`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            await handleApiResponseError(response);
            return;
        }
        const activities = await response.json();
        updateRecentActivity(activities);
    } catch (error) {
        console.error("Erreur lors du chargement de l'activité:", error);
        DOMElements.recentActivityList.innerHTML = '<li>Impossible de charger l\'activité.</li>';
    }
}

/**
 * Ajoute une nouvelle activité au backend.
 * @param {object} activity - L'objet activité à ajouter.
 */
async function addActivity(activity) {
    const authToken = getAuthToken();
    if (!authToken) {
        console.warn("Pas de jeton d'authentification pour ajouter l'activité. Ajout local uniquement.");
        // Fallback local si pas de backend ou pas authentifié (pour la démo)
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        const newActivity = { ...activity, timestamp: new Date().toISOString() };
        activities.unshift(newActivity);
        localStorage.setItem('userActivities', JSON.stringify(activities.slice(0, 10))); // Limite à 10 pour le local
        updateRecentActivity(activities);
        return;
    }

    try {
        await fetch(`${API_BASE_URL}/activity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(activity)
        });
        loadUserActivity(); // Recharger les activités pour inclure la nouvelle
    } catch (error) {
        console.error("Échec de l'ajout d'activité au serveur:", error);
        showToast("Erreur lors de l'enregistrement de l'activité.", "error");
    }
}

/**
 * Met à jour la liste des activités récentes dans l'interface utilisateur.
 * @param {Array<object>} activityData - Tableau des objets activité.
 */
function updateRecentActivity(activityData) {
    DOMElements.recentActivityList.innerHTML = ''; // Vide la liste

    if (activityData && activityData.length > 0) {
        activityData.forEach(activity => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span class="activity-icon"><i class="${activity.icon}"></i></span> ${activity.description} <span class="activity-timestamp">${formatTimestamp(activity.timestamp)}</span>`;
            DOMElements.recentActivityList.appendChild(listItem);
        });
    } else {
        DOMElements.recentActivityList.innerHTML = '<li>Aucune activité récente.</li>';
    }
}

// --- Fonctions d'Intégration Solana ---

/**
 * Tente de récupérer l'objet portefeuille Phantom.
 * @returns {object|null} L'objet solana (Phantom) si disponible, sinon null.
 */
function getSolanaWallet() {
    // S'assurer que window.solana existe et est bien le portefeuille Phantom
    if ("solana" in window && window.solana.isPhantom) {
        return window.solana;
    }
    return null;
}

/**
 * Connecte le portefeuille Solana de l'utilisateur.
 */
async function connectSolanaWallet() {
    const wallet = getSolanaWallet();
    if (!wallet || !Connection || !PublicKey || !LAMPORTS_PER_SOL) {
        showToast("Portefeuille Solana (ex: Phantom) non détecté ou bibliothèques Solana non chargées. Veuillez installer une extension de portefeuille.", 'error', 7000);
        return;
    }
    if (!connection) {
        showToast("Connexion au réseau Solana non établie.", 'error');
        return;
    }

    try {
        if (wallet.isConnected) {
            showToast("Portefeuille déjà connecté.", "info");
            connectedWalletPublicKey = wallet.publicKey.toString();
            await updateSolanaBalances(connectedWalletPublicKey);
            toggleSolanaButtons(true);
            return;
        }

        showToast("Connexion au portefeuille Solana en cours...", "info", 3000);
        const resp = await wallet.connect();
        connectedWalletPublicKey = resp.publicKey.toString();

        DOMElements.solanaWalletAddress.textContent = truncateAddress(connectedWalletPublicKey);
        DOMElements.solanaConnectionStatus.textContent = 'Connecté';
        DOMElements.solanaConnectionStatus.classList.remove('unverified');
        DOMElements.solanaConnectionStatus.classList.add('verified');

        await updateSolanaBalances(connectedWalletPublicKey);
        toggleSolanaButtons(true);
        addActivity({ description: "Portefeuille Solana connecté.", icon: "fas fa-plug" });
        showToast('Portefeuille Solana connecté avec succès !', 'success');

        // Écouteurs pour les changements de compte ou de déconnexion du portefeuille
        wallet.on('accountChanged', async (newPublicKey) => {
            if (newPublicKey) {
                connectedWalletPublicKey = newPublicKey.toString();
                DOMElements.solanaWalletAddress.textContent = truncateAddress(connectedWalletPublicKey);
                await updateSolanaBalances(connectedWalletPublicKey);
                showToast('Portefeuille Solana changé. Solde mis à jour.', 'info');
                addActivity({ description: "Portefeuille Solana changé.", icon: "fas fa-sync-alt" });
            } else {
                await disconnectSolanaWallet();
                showToast('Portefeuille Solana déconnecté via l\'extension.', 'error');
                addActivity({ description: "Portefeuille Solana déconnecté (extension).", icon: "fas fa-power-off" });
            }
        });

        wallet.on('disconnect', async () => {
            await disconnectSolanaWallet();
            showToast('Portefeuille Solana déconnecté.', 'error');
            addActivity({ description: "Portefeuille Solana déconnecté.", icon: "fas fa-power-off" });
        });

    } catch (error) {
        console.error("Erreur de connexion au portefeuille Solana:", error);
        showToast(`Échec de la connexion au portefeuille Solana: ${error.message || 'Assurez-vous qu\'un portefeuille est installé et déverrouillé.'}`, 'error', 7000);
        connectedWalletPublicKey = null;
        updateSolanaUIDisconnected();
        toggleSolanaButtons(false);
    }
}

/**
 * Déconnecte le portefeuille Solana.
 */
async function disconnectSolanaWallet() {
    const wallet = getSolanaWallet();
    if (wallet && wallet.isConnected) {
        try {
            await wallet.disconnect();
            showToast('Portefeuille Solana déconnecté.', 'info');
        } catch (error) {
            console.error("Erreur lors de la déconnexion du portefeuille:", error);
            showToast(`Échec de la déconnexion du portefeuille: ${error.message}`, 'error');
        }
    }
    connectedWalletPublicKey = null;
    updateSolanaUIDisconnected();
    toggleSolanaButtons(false);
    addActivity({ description: "Déconnexion du portefeuille Solana.", icon: "fas fa-power-off" });
}

/**
 * Met à jour les soldes SOL et AG-COIN dans l'interface utilisateur.
 * @param {string} publicKeyString - La clé publique du portefeuille connecté.
 */
async function updateSolanaBalances(publicKeyString) {
    if (!connection || !PublicKey || !LAMPORTS_PER_SOL || !Token || !TOKEN_PROGRAM_ID) {
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
 * @param {PublicKey} ownerPublicKey - La clé publique du propriétaire du compte.
 */
async function getAgCoinBalance(ownerPublicKey) {
    try {
        const agCoinMintPublicKey = new PublicKey(AG_COIN_MINT_ADDRESS_STR);

        // Cette méthode trouve tous les comptes de token pour un mint spécifique et un propriétaire
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            ownerPublicKey,
            { mint: agCoinMintPublicKey },
            'confirmed'
        );

        let agCoinAmount = 0;
        if (tokenAccounts && tokenAccounts.value.length > 0) {
            // Prend le premier compte de token trouvé pour ce mint/propriétaire
            const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
            agCoinAmount = accountInfo.tokenAmount.uiAmount;
        }
        DOMElements.agCoinBalance.textContent = `${agCoinAmount.toFixed(2)} AG-COIN`;
    } catch (error) {
        console.error("Erreur lors de la récupération du solde AG-COIN:", error);
        DOMElements.agCoinBalance.textContent = 'Erreur (Token non trouvé)';
    }
}

/**
 * Met à jour l'interface utilisateur Solana en mode déconnecté.
 */
function updateSolanaUIDisconnected() {
    DOMElements.solanaWalletAddress.textContent = 'Non connecté';
    DOMElements.solBalance.textContent = '0.00 SOL';
    DOMElements.agCoinBalance.textContent = '0.00 AG-COIN';
    DOMElements.solanaConnectionStatus.textContent = 'Déconnecté';
    DOMElements.solanaConnectionStatus.classList.remove('verified');
    DOMElements.solanaConnectionStatus.classList.add('unverified');
}

/**
 * Affiche/cache les boutons de connexion/déconnexion Solana.
 * @param {boolean} isConnected - Vrai si le portefeuille est connecté, faux sinon.
 */
function toggleSolanaButtons(isConnected) {
    if (isConnected) {
        DOMElements.connectSolanaButton.style.display = 'none';
        DOMElements.disconnectSolanaButton.style.display = 'inline-flex';
        DOMElements.sendAgCoinButton.style.display = 'inline-flex'; // Affiche "Envoyer AG-COIN" si connecté
    } else {
        DOMElements.connectSolanaButton.style.display = 'inline-flex';
        DOMElements.disconnectSolanaButton.style.display = 'none';
        DOMElements.sendAgCoinButton.style.display = 'none'; // Cache "Envoyer AG-COIN" si déconnecté
    }
}

/**
 * Placeholder pour la fonction d'envoi d'AG-COIN.
 * En production, cela interagirait avec un backend sécurisé.
 */
async function sendAgCoin() {
    if (!connectedWalletPublicKey) {
        showToast("Veuillez d'abord connecter votre portefeuille Solana.", "error");
        return;
    }
    // Idéalement, rediriger vers une page ou ouvrir une modale pour saisir les détails de la transaction
    showToast("La fonctionnalité 'Envoyer AG-COIN' est en cours de développement. Vous serez bientôt en mesure d'envoyer vos tokens !", "info", 8000);
    addActivity({ description: "Tentative d'envoi d'AG-COIN (fonctionnalité à venir).", icon: "fas fa-paper-plane" });

    // *** POUR LA PRODUCTION : ***
    // Cette partie doit envoyer une requête au backend avec l'adresse du destinataire et le montant.
    // Le backend validera la transaction, la construira, et la renverra au frontend pour signature par Phantom.
    // Après signature, le frontend renverra la transaction signée au backend pour soumission finale au réseau Solana.
    // Cela protège contre la falsification des transactions côté client.
}

// --- Initialisation de l'Application ---

/**
 * Initialise l'application après le chargement du DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Remplir le sélecteur de pays
    africanCountries.sort((a, b) => a.name.localeCompare(b.name));
    africanCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        DOMElements.editCountry.appendChild(option);
    });

    // 2. Initialiser les données et les écouteurs d'événements
    await initApp();
});

/**
 * Fonctions d'initialisation asynchrones.
 */
async function initApp() {
    await loadUserProfile(); // Tente de charger le profil depuis le backend
    await loadUserActivity(); // Tente de charger l'activité depuis le backend

    addEventListeners(); // Attache tous les gestionnaires d'événements

    // Tente de connecter le portefeuille au chargement si l'utilisateur l'a déjà autorisé
    const wallet = getSolanaWallet();
    if (wallet && wallet.isConnected && wallet.publicKey) {
        connectedWalletPublicKey = wallet.publicKey.toString();
        await connectSolanaWallet(); // Reconnecte et met à jour les soldes
    } else {
        toggleSolanaButtons(false); // S'assurer que les boutons sont dans l'état déconnecté
    }
}

/**
 * Attache tous les écouteurs d'événements aux éléments du DOM.
 */
function addEventListeners() {
    DOMElements.editProfileButton.addEventListener('click', toggleEditProfile);
    DOMElements.cancelEditButton.addEventListener('click', toggleEditProfile);
    DOMElements.editProfileForm.addEventListener('submit', handleSaveProfile);
    DOMElements.connectSolanaButton.addEventListener('click', connectSolanaWallet);
    DOMElements.disconnectSolanaButton.addEventListener('click', disconnectSolanaWallet);
    DOMElements.sendAgCoinButton.addEventListener('click', sendAgCoin);
}
