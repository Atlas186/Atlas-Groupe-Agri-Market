document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.querySelector('.copy-button');
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');

    // Enregistre le Service Worker pour une Progressive Web App (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès:', registration);
            })
            .catch(error => {
                console.error('Échec de l\'enregistrement du Service Worker:', error);
            });
    }

    // Ajoute une classe au corps si l'application est exécutée en mode autonome (PWA installée)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-standalone-mode');
    }

    // Permet de copier l'adresse du token AG-COIN dans le presse-papiers
    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            const addressSpan = document.getElementById('agcoin-address');
            if (addressSpan) {
                const address = addressSpan.textContent;
                try {
                    await navigator.clipboard.writeText(address);
                    // Remplacer alert() par une notification plus élégante en production (ex: une petite pop-up temporaire)
                    alert('Adresse copiée dans le presse-papiers !');
                    console.log('Adresse copiée:', address);
                } catch (err) {
                    console.error('Erreur lors de la copie de l\'adresse:', err);
                    alert('Impossible de copier l\'adresse. Assurez-vous que le site est servi via HTTPS.');
                }
            }
        });
    }

    // Gère la soumission du formulaire de contact
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Empêche le rechargement de la page par défaut
            console.log('Formulaire soumis!');

            // --- INTÉGRATION BACKEND POUR LA PRODUCTION ---
            // Pour un site réel, DÉCOMMENTEZ et adaptez le bloc ci-dessous.
            // Vous devrez avoir un endpoint API sur votre serveur pour recevoir ces données (ex: Node.js, PHP, Python).

            /*
            const formData = new FormData(this);
            // Convertir FormData en objet JSON si votre API attend du JSON
            const data = Object.fromEntries(formData.entries());

            fetch('/api/contact', { // Assurez-vous que ce chemin d'API est correct pour votre backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Indique que vous attendez une réponse JSON
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) { // Vérifie si la réponse HTTP est OK (200-299)
                    throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
                }
                return response.json(); // Traite la réponse comme du JSON
            })
            .then(responseData => {
                if (responseData.success) { // Supposons que votre API renvoie { success: true }
                    successMessage.style.display = 'block';
                    this.reset(); // Réinitialise le formulaire après succès
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 3000); // Cache le message après 3 secondes
                } else {
                    // Gérer les messages d'erreur spécifiques de l'API
                    alert(responseData.message || 'Erreur lors de l\'envoi du message. Veuillez réessayer.');
                }
            })
            .catch(error => {
                console.error('Erreur de soumission du formulaire:', error);
                alert('Une erreur est survenue lors de l\'envoi du message. Veuillez vérifier votre connexion et réessayer.');
            });
            */

            // --- SIMULATION DE SUCCÈS (À SUPPRIMER LORSQUE LE BACKEND EST PRÊT) ---
            // Ce bloc est seulement pour la démonstration front-end.
            if (successMessage) {
                successMessage.style.display = 'block';
                this.reset();
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 1000);
            }
        });
    }
});
