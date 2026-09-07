GÎTE UN AIR DE TOSCANE — V4.2 GITHUB PAGES
===========================================

Cette version conserve le visuel et le contenu de la V4.1, avec :
- formulaire Formspree ;
- tarif automatique : 150 €/nuit jusqu'à 4 adultes ;
- +15 €/adulte supplémentaire/nuit pour 5 ou 6 adultes ;
- caution : 450 € ;
- enfants admis ;
- mentions légales sur une page séparée ;
- synchronisation automatique des indisponibilités depuis Booking.com.

FICHIERS À ENVOYER SUR GITHUB
-----------------------------
Envoyer TOUT le contenu du ZIP à la racine du dépôt, y compris les dossiers cachés :
- index.html
- styles.css
- script.js
- config.js
- availability.json
- mentions-legales.html
- assets/
- tools/
- .github/workflows/update-booking-calendar.yml

IMPORTANT : le dossier .github est indispensable pour l'automatisation.

INSTALLER LE LIEN ICAL BOOKING SANS LE PUBLIER
----------------------------------------------
1. Ouvrir le dépôt GitHub.
2. Settings > Secrets and variables > Actions.
3. Cliquer sur "New repository secret".
4. Nom EXACT : BOOKING_ICAL_URL
5. Dans "Secret", coller le lien iCal/ICS exporté par Booking.com.
6. Cliquer sur "Add secret".

Le lien reste stocké dans les secrets GitHub et n'apparaît pas dans le code public du site.

PREMIÈRE SYNCHRONISATION
------------------------
1. Dans le dépôt GitHub, ouvrir l'onglet Actions.
2. Choisir "Synchroniser le calendrier Booking".
3. Cliquer sur "Run workflow", puis confirmer.
4. Attendre la fin du workflow (pastille verte).

Le fichier availability.json sera alors automatiquement rempli avec les périodes indisponibles.
Le site les utilisera sans qu'il soit nécessaire de modifier config.js.

MISES À JOUR AUTOMATIQUES
-------------------------
Le workflow vérifie Booking environ une fois par heure.
GitHub peut parfois décaler légèrement l'heure réelle d'exécution d'un workflow planifié.

RÉSERVATION DIRECTE DEPUIS LE SITE
----------------------------------
Une demande envoyée via Formspree ne bloque PAS automatiquement Booking.
Quand une réservation directe est réellement confirmée :
1. bloquer/fermer les dates correspondantes dans Booking.com ;
2. Booking les publiera dans son calendrier iCal ;
3. la prochaine synchronisation GitHub les affichera comme occupées sur le site.

SECOURS MANUEL
--------------
Si nécessaire, config.js contient toujours bookedRanges. Les périodes saisies manuellement
sont AJOUTÉES aux périodes Booking.
Exemple :
bookedRanges: [
  { from: "2026-09-14", to: "2026-09-16" }
],
Le jour "to" est le jour du départ et redevient disponible pour une nouvelle arrivée.

SI LE WORKFLOW NE PEUT PAS FAIRE LE COMMIT
------------------------------------------
Dans GitHub : Settings > Actions > General > Workflow permissions,
choisir "Read and write permissions", puis enregistrer.
Le workflow déclare déjà "contents: write", mais certains dépôts imposent aussi ce réglage.

SÉCURITÉ
--------
Ne jamais mettre le lien iCal Booking dans config.js, index.html ou README.txt.
Ne jamais publier ce lien dans le dépôt. Utiliser uniquement le secret BOOKING_ICAL_URL.


V4.3 — Correction affichage Booking
----------------------------------
Le site lit désormais availability.json directement depuis le dépôt GitHub public. Cela évite le décalage éventuel entre la mise à jour du fichier par GitHub Actions et le redéploiement de GitHub Pages. Les nuits réservées apparaissent en terracotta dans le calendrier et sont refusées par le vérificateur de dates.

V4.4 — Mise à jour familles
- Ajout du nombre d'enfants dans la recherche de disponibilité et le formulaire.
- L'âge de chaque enfant devient obligatoire dès qu'un ou plusieurs enfants sont indiqués.
- Capacité contrôlée à 6 personnes au total.
- Bouton Réserver à côté de Vérifier : il recopie les dates et occupants vers le formulaire.
- Taxe de séjour indiquée en supplément, à régler sur place.
