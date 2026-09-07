GÎTE UN AIR DE TOSCANE — VERSION 1

Cette maquette est un site statique autonome, prêt pour un hébergement de type Cloudflare Pages.

Fichiers importants :
- index.html : contenu et structure du site
- styles.css : apparence
- script.js : calendrier, vérification des dates et formulaire
- config.js : données faciles à modifier (téléphone, e-mail, tarifs, réservations)

À compléter avant mise en ligne définitive :
1. Remplacer les emplacements photo par les photos originales.
2. Ajouter l'adresse e-mail de réservation dans config.js.
3. Ajouter les périodes tarifaires dans config.js.
4. Ajouter les périodes déjà réservées dans config.js ou connecter ensuite un flux iCal.
5. Vérifier les mentions légales et les informations de l'hébergeur avant publication.

Exemple de tarif dans config.js :
{from:"2026-09-01", to:"2026-10-31", price:145, label:"Automne"}

Exemple de réservation :
{from:"2026-09-12", to:"2026-09-15"}

Le second jour (to) correspond au jour du départ et n'est donc pas marqué comme occupé.
