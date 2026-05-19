# Scanner SIRET

Outil de diagnostic de visibilité digitale d'un commerce. À partir d'un numéro SIRET
ou d'un nom d'enseigne plus une ville, il produit un rapport visuel et un score sur 100.

![Aperçu de l'outil](docs/apercu.png)

## Ce que l'outil analyse

- Apparition dans les recherches : requête nom enseigne et requête métier plus ville.
- Fiche établissement et avis : présence sur les plateformes d'avis (Google Maps,
  TripAdvisor, Yelp), note et nombre d'avis quand ils sont lisibles.
- Site web : détection, HTTPS, compatibilité mobile, balises de base, vitesse.
- Annuaires métier selon le code NAF :
  - restauration : Pages Jaunes, Yelp, TheFork, Tripadvisor
  - coiffure et beauté : Pages Jaunes, Planity, Treatwell
  - autres : Pages Jaunes, Yelp, Google Maps
- Score global sur 100, pondération : fiche et avis 30, apparition recherche 25,
  site web 25, annuaires 20.
- Recommandations actionnables pour gagner en visibilité.

## Prérequis

- Node.js 18 ou supérieur (testé avec Node 24).
- Connexion internet.
- À l'installation, Chromium est téléchargé automatiquement pour Playwright (environ 150 Mo).

## Installation

```
npm install
```

La commande déclenche aussi `playwright install chromium`.

## Lancer en local

```
npm run dev
```

Deux process démarrent :

- API Express sur http://localhost:3001
- Interface Vite sur http://localhost:5173

Ouvrir http://localhost:5173 dans le navigateur.

## Tests

```
npm test
```

Les tests couvrent les cas critiques hors ligne : SIRET valide, SIRET invalide,
entreprise sans site, entreprise sans fiche établissement, repondération du score
quand une source est bloquée.

## Stack

- Interface : React, servie par Vite.
- Serveur : Node et Express.
- Lecture des moteurs de recherche : Playwright (Chromium headless).
- Données entreprise : API publique recherche-entreprises.api.gouv.fr.
- Aucune clé API payante.

## Sources de données

- recherche-entreprises.api.gouv.fr : API publique gratuite, résolution SIRET et nom
  vers raison sociale, adresse, code NAF, état administratif. Adossée à la base SIRENE
  de l'INSEE.
- Moteurs de recherche : lecture automatisée via Playwright. L'outil tente Google,
  puis bascule sur DuckDuckGo (moteur principal effectif, le plus stable), puis Bing.
- Une clé Google Programmable Search peut être branchée (optionnelle, gratuite). Voir
  `.env.example`.

## Limites assumées

- Google bloque la lecture automatisée gratuite de ses pages. L'apparition est donc
  mesurée via DuckDuckGo. Le moteur ayant répondu est indiqué dans le rapport.
- La note exacte d'une fiche Google n'est lisible que sur la fiche Google elle-même.
  Elle est affichée quand elle apparaît dans les résultats, sinon laissée vide.
  Aucune donnée n'est inventée.
- Une source bloquée est exclue du score, recalculé sur les catégories restantes.
- Résultats indicatifs : une photographie de la visibilité en ligne, pas un document
  officiel.

## Pas hébergé en ligne

L'outil a besoin d'un serveur (scraping via Playwright), il ne peut donc pas tourner
sur un hébergement statique. Il s'exécute en local avec `npm run dev`. Le serveur
écoute uniquement sur la boucle locale (127.0.0.1).

## Avertissement

Outil construit à des fins de démonstration des compétences techniques. Usage personnel
et exploration uniquement. Les données traitées sont publiques et l'outil ne stocke
aucune information.

## Auteur

Construit par Emmanuel Truffaut, Product Builder No-Code et IA.

Vous inspectez le code ? Une question ? Je réponds avec plaisir :
[Emmanuel Truffaut sur LinkedIn](https://www.linkedin.com/in/emmanuel-truffaut-b38b292b7)

Portfolio : https://portfolio.etd-projects.fr
