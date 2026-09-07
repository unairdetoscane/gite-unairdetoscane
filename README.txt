GÎTE UN AIR DE TOSCANE — V2 GITHUB PAGES

Version prête pour GitHub Pages.

Fichiers à envoyer à la racine du dépôt GitHub :
- index.html
- styles.css
- script.js
- config.js
- assets/

Configuration dans config.js :
- Tarif de base : 150 €/nuit jusqu'à 4 adultes
- Séjour minimum : 2 nuits
- Enfants non admis
- Maximum : 6 adultes
- Adresse de réservation : pierrelouis.garnier@gmail.com

IMPORTANT : le montant du supplément pour le 5e et le 6e adulte n'a pas été inventé.
Renseigner extraAdultNightly dans config.js dès que le montant est fixé.
Exemple : extraAdultNightly: 25 signifie +25 € / nuit pour chaque adulte au-delà de 4.

Pour bloquer des dates, compléter bookedRanges dans config.js :
bookedRanges: [
  {from:"2026-10-12", to:"2026-10-15"},
  {from:"2026-12-24", to:"2026-12-28"}
]
La date "to" est la date de départ et redevient disponible.
