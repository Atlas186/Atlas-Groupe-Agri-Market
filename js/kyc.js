document.addEventListener('DOMContentLoaded', () => {
    // Récupération des éléments DOM
    const kycForm = document.getElementById('kycForm');
    const submitKycBtn = document.getElementById('submitKycBtn');
    const buttonText = submitKycBtn.querySelector('.button-text');
    const loadingSpinner = submitKycBtn.querySelector('.loading-spinner');
    const kycStatusDiv = document.getElementById('kycVerificationStatus');
    const currentYearSpan = document.getElementById('currentYear');
    const countrySelect = document.getElementById('country');

    // Selfie elements
    const startCameraButton = document.getElementById('startCameraButton');
    const takeSelfieButton = document.getElementById('takeSelfieButton');
    const retakeSelfieButton = document.getElementById('retakeSelfieButton');
    const selfieVideo = document.getElementById('selfieVideo');
    const selfieCanvas = document.getElementById('selfieCanvas');
    const selfiePreview = document.getElementById('selfiePreview');
    const selfieStatus = document.getElementById('selfieStatus');
    const selfieDataInput = document.getElementById('selfieData'); // Hidden input for selfie data
    let mediaStream = null; // Variable pour stocker le flux de la caméra

    // --- Initialisation et utilitaires ---

    // Mettre à jour l'année dans le footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Fonction générique pour afficher un message de statut
    const showStatusMessage = (message, type) => {
        kycStatusDiv.textContent = message;
        kycStatusDiv.className = `status-message ${type}`;
        kycStatusDiv.style.display = 'block';
        kycStatusDiv.setAttribute('role', 'status'); // Assure la lecture par les lecteurs d'écran
    };

    // Fonction pour cacher les messages de statut
    const hideStatusMessage = () => {
        kycStatusDiv.style.display = 'none';
        kycStatusDiv.textContent = '';
        kycStatusDiv.removeAttribute('role');
    };

    // Afficher/masquer le spinner de chargement sur le bouton
    const toggleSubmitLoading = (isLoading) => {
        submitKycBtn.disabled = isLoading;
        buttonText.style.display = isLoading ? 'none' : 'inline';
        loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
    };

    // --- Fonctions de validation des champs du formulaire ---

    // Affiche un message d'erreur spécifique pour un champ
    const displayError = (inputElement, message) => {
        const errorDiv = document.getElementById(`${inputElement.id}Error`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            inputElement.setAttribute('aria-invalid', 'true');
            inputElement.classList.add('is-invalid');
        }
    };

    // Cache le message d'erreur pour un champ
    const hideError = (inputElement) => {
        const errorDiv = document.getElementById(`${inputElement.id}Error`);
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            inputElement.setAttribute('aria-invalid', 'false');
            inputElement.classList.remove('is-invalid');
        }
    };

    // Valide un champ spécifique et affiche/cache les erreurs
    const validateField = (inputElement) => {
        let isValid = true;
        hideError(inputElement); // Effacer l'erreur précédente

        // Validation des champs requis
        if (inputElement.hasAttribute('required') && inputElement.value.trim() === '') {
            displayError(inputElement, 'Ce champ est requis.');
            isValid = false;
        }

        // Validation spécifique pour la date de naissance (âge >= 18 ans et non future)
        else if (inputElement.id === 'birthDate') {
            const birthDate = new Date(inputElement.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                displayError(inputElement, 'Vous devez avoir au moins 18 ans.');
                isValid = false;
            } else if (birthDate > today) {
                displayError(inputElement, 'La date de naissance ne peut pas être future.');
                isValid = false;
            }
        }

        // Validation pour les champs de type fichier
        else if (inputElement.type === 'file') {
            if (inputElement.files.length > 0) {
                const file = inputElement.files[0];
                const maxSize = 5 * 1024 * 1024; // 5MB
                const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

                if (file.size > maxSize) {
                    displayError(inputElement, `Le fichier est trop grand (max ${maxSize / (1024 * 1024)}MB).`);
                    isValid = false;
                } else if (!allowedTypes.includes(file.type)) {
                    displayError(inputElement, 'Type de fichier non autorisé. JPG, PNG ou PDF seulement.');
                    isValid = false;
                }
            } else if (inputElement.hasAttribute('required')) {
                displayError(inputElement, 'Veuillez télécharger un fichier.');
                isValid = false;
            }
        }

        // Validation pour les champs de type select (si l'option par défaut est sélectionnée)
        else if (inputElement.tagName === 'SELECT' && inputElement.value === '') {
            displayError(inputElement, 'Veuillez faire une sélection valide.');
            isValid = false;
        }

        return isValid;
    };

    // Attacher les écouteurs d'événements de validation à tous les champs du formulaire
    const formInputs = kycForm.querySelectorAll('.form-input, .form-input-file, .form-select');
    formInputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input)); // Valide à la sortie du champ
        if (input.type === 'file' || input.tagName === 'SELECT') {
            input.addEventListener('change', () => validateField(input)); // Valide au changement pour fichiers/selects
        }
    });

    // --- Remplir le select des pays (Afrique seulement) ---
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

    africanCountries.sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique par nom de pays

    africanCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });

    // --- Logique de la caméra et du selfie ---

    // Arrête le flux vidéo de la caméra
    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        selfieVideo.srcObject = null;
    };

    startCameraButton.addEventListener('click', async () => {
        selfieStatus.textContent = "Accès à la caméra...";
        hideError(selfieDataInput); // Cacher toute erreur de selfie existante
        try {
            // Accéder à la caméra frontale ('user') si possible, sinon n'importe quelle caméra vidéo
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            selfieVideo.srcObject = mediaStream;
            selfieVideo.style.display = 'block'; // Afficher le flux vidéo
            selfiePreview.style.display = 'none'; // Cacher l'aperçu statique
            selfieCanvas.style.display = 'none'; // Cacher le canvas
            
            startCameraButton.style.display = 'none';
            takeSelfieButton.style.display = 'inline-block';
            retakeSelfieButton.style.display = 'none';
            
            takeSelfieButton.disabled = false; // Activer le bouton "Prendre la photo"
            selfieStatus.textContent = "Caméra active. Positionnez-vous avec votre document d'identité pour une photo claire.";
        } catch (err) {
            console.error("Erreur d'accès à la caméra:", err);
            selfieStatus.textContent = "Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur et réessayez. (" + err.name + ")";
            displayError(selfieDataInput, "L'accès à la caméra est nécessaire pour le selfie.");
            
            // Réinitialiser l'état des boutons si l'accès échoue
            startCameraButton.style.display = 'inline-block';
            takeSelfieButton.style.display = 'none';
            retakeSelfieButton.style.display = 'none';
            selfieVideo.style.display = 'none';
        }
    });

    takeSelfieButton.addEventListener('click', () => {
        if (!mediaStream) return;

        // Assurez-vous que le canvas a la même taille que la vidéo
        selfieCanvas.width = selfieVideo.videoWidth;
        selfieCanvas.height = selfieVideo.videoHeight;
        const context = selfieCanvas.getContext('2d');
        context.drawImage(selfieVideo, 0, 0, selfieCanvas.width, selfieCanvas.height);

        stopCamera(); // Arrêter le flux de la caméra après avoir pris la photo

        // Convertir l'image du canvas en URL de données (Base64)
        selfiePreview.src = selfieCanvas.toDataURL('image/jpeg', 0.9); // Qualité JPEG 90%
        selfiePreview.style.display = 'block'; // Afficher l'aperçu de l'image prise

        // Stocker les données de l'image dans l'input caché pour la soumission
        selfieDataInput.value = selfiePreview.src;
        selfieDataInput.required = true; // S'assurer que le champ caché est requis
        hideError(selfieDataInput); // Effacer l'erreur du selfie car une photo a été prise

        // Mettre à jour l'état des boutons
        takeSelfieButton.style.display = 'none';
        retakeSelfieButton.style.display = 'inline-block';
        selfieStatus.textContent = "Photo prise. Examinez-la attentivement et reprenez si elle n'est pas claire.";
    });

    retakeSelfieButton.addEventListener('click', () => {
        // Réinitialiser les éléments visuels et les données
        selfiePreview.src = '';
        selfiePreview.style.display = 'none';
        selfieDataInput.value = '';
        // Ré-afficher le bouton pour démarrer la caméra
        startCameraButton.click(); // Simule un clic sur le bouton de démarrage de la caméra
        selfieStatus.textContent = "Prêt à reprendre le selfie. Assurez-vous d'une bonne luminosité.";
    });

    // --- Gestion de la soumission du formulaire ---
    if (kycForm) {
        kycForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche le rechargement de la page par défaut

            hideStatusMessage(); // Cacher tout message de statut précédent

            // Valider tous les champs du formulaire
            let formIsValid = true;
            formInputs.forEach(input => {
                if (!validateField(input)) {
                    formIsValid = false;
                }
            });

            // Validation spécifique pour le selfie (l'input caché doit avoir une valeur)
            if (selfieDataInput.value.trim() === '') {
                displayError(selfieDataInput, 'Un selfie avec document est requis.');
                formIsValid = false;
            }

            if (!formIsValid) {
                showStatusMessage('Veuillez corriger les erreurs dans le formulaire avant de soumettre.', 'error');
                // Faire défiler vers le premier champ invalide pour une meilleure UX
                const firstInvalid = kycForm.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return; // Arrêter la soumission si le formulaire n'est pas valide
            }

            // Si le formulaire est valide, afficher l'état de soumission
            toggleSubmitLoading(true); // Désactiver le bouton et montrer le spinner
            showStatusMessage('Envoi de vos documents... Veuillez patienter, cela peut prendre quelques instants.', 'submitting');

            try {
                const formData = new FormData();
                
                // Ajouter les champs de texte
                formData.append('fullName', document.getElementById('fullName').value);
                formData.append('birthDate', document.getElementById('birthDate').value);
                formData.append('country', document.getElementById('country').value);
                formData.append('documentType', document.getElementById('documentType').value);

                // Ajouter les fichiers uploadés (document recto/verso)
                if (document.getElementById('documentFront').files.length > 0) {
                    formData.append('documentFront', document.getElementById('documentFront').files[0]);
                }
                if (document.getElementById('documentBack').files.length > 0) {
                    formData.append('documentBack', document.getElementById('documentBack').files[0]);
                }

                // Convertir la base64 du selfie en Blob (fichier) pour l'envoi
                const selfieBase64 = selfieDataInput.value;
                if (selfieBase64) {
                    // Fetch le Data URL pour obtenir un Blob
                    const blob = await fetch(selfieBase64).then(res => res.blob());
                    formData.append('selfieImage', blob, 'selfie.jpeg'); // Nom de fichier 'selfie.jpeg'
                }

                // --- APPEL API EN PRODUCTION ---
                // IMPORTANT: Remplacez l'URL '/api/kyc-submission' par l'URL réelle de votre endpoint backend.
                // Le backend doit valider TOUTES les données (sécurité critique pour KYC) et gérer le stockage des fichiers.
                const response = await fetch('/api/kyc-submission', { // Exemple d'URL d'API
                    method: 'POST',
                    body: formData, // FormData gère automatiquement le bon Content-Type pour les fichiers
                    // Si vous avez besoin d'authentification (ex: JWT Token), ajoutez les headers ici:
                    // headers: { 'Authorization': 'Bearer VOTRE_TOKEN_JWT' }
                });

                if (response.ok) { // Le statut HTTP est 2xx (succès)
                    const result = await response.json(); // Ou response.text() si l'API ne renvoie pas de JSON

                    showStatusMessage(result.message || 'Votre vérification d\'identité a été soumise avec succès ! Redirection en cours...', 'success');
                    
                    // Optionnel: Rediriger l'utilisateur après un court délai
                    setTimeout(() => {
                        window.location.href = 'connect.html'; // Rediriger vers la page de connexion ou un tableau de bord
                    }, 3000); // Redirection après 3 secondes
                } else {
                    // Gérer les erreurs de l'API (ex: 400 Bad Request, 500 Internal Server Error)
                    const errorData = await response.json(); // Tente de lire le corps de l'erreur comme JSON
                    console.error('Erreur de soumission KYC (API):', errorData);
                    showStatusMessage(errorData.message || 'Une erreur est survenue lors de la soumission. Veuillez vérifier les informations et réessayer.', 'error');
                }
            } catch (error) {
                // Gérer les erreurs réseau ou les problèmes avant l'envoi à l'API
                console.error('Erreur réseau ou inattendue lors de la soumission KYC:', error);
                showStatusMessage('Problème de connexion ou erreur inattendue. Veuillez vérifier votre connexion internet et réessayer.', 'error');
            } finally {
                // Réactiver le bouton et masquer le spinner, sauf si une redirection est imminente
                // (vérifier la classe 'success' sur kycStatusDiv pour éviter de réactiver le bouton avant la redirection)
                if (!kycStatusDiv.classList.contains('success')) {
                    toggleSubmitLoading(false);
                }
            }
        });
    }
});
