# Scanner SIRET, design (proto local)

Date : 2026-05-19

## Objectif

Outil web local. Un commerçant entre son SIRET (14 chiffres) ou son nom d'enseigne plus
une ville. En 30 secondes cible, l'outil renvoie un rapport visuel de visibilité digitale
avec un score global sur 100.

## Stack

- Client : Vite plus React, page unique, icônes et illustrations en SVG uniquement.
- Serveur : Express (port 3001).
- Scraping : Playwright headless (Chromium), rotation de user-agent, gestion des timeouts.
- Cache : fichier JSON, TTL 15 minutes, sur les scans et sur les requêtes Google.
- Aucune clé API payante.

## Sources de données

1. recherche-entreprises.api.gouv.fr : SIRET ou nom plus ville vers nom, adresse, code NAF,
   état administratif (actif ou radié). API publique gratuite.
2. SIRENE INSEE : backup documenté. L'API directe exige un token gratuit à créer
   manuellement, hors périmètre du proto. recherche-entreprises s'appuie déjà sur SIRENE.
3. Google (Playwright) : présence SERP, panneau Google Business, détection du site web.
4. Heuristiques serveur : qualité du site (HTTPS, viewport, title, meta description, h1,
   temps de réponse).

## Flow

1. Saisie SIRET ou nom plus ville.
2. SIRET : validation longueur 14 chiffres plus clé de contrôle Luhn, puis résolution API.
   Nom plus ville : recherche plein texte, meilleur correspondant sur la commune.
3. Code NAF vers catégorie métier : resto, beauté, autre.
4. En parallèle : SERP Google, fiche Google Business, détection plus qualité du site,
   présence annuaires.
5. Calcul du score, rapport JSON, rendu UI.

## Catégories d'annuaires

- resto : Pages Jaunes, Yelp, TheFork, Tripadvisor.
- coiffeur ou beauté : Pages Jaunes, Planity, Treatwell.
- autres : Pages Jaunes, Yelp, Google Maps.

## Score sur 100, pondération

- Fiche Google Business : 30 (existe 12, note jusqu'à 10, avis jusqu'à 8).
- Apparition Google : 25 (requête nom enseigne 15, requête métier plus ville 10).
- Site web : 25 (détecté 10, qualité jusqu'à 15).
- Annuaires métier : 20 (proportion d'annuaires où l'enseigne apparaît).

Qualité du site sur 15 : HTTPS 4, viewport 3, title 2, meta description 2, h1 1,
vitesse jusqu'à 3.

Note lettre : A si 80 et plus, B si 60, C si 40, D si 20, E en dessous.

## Repondération des sources bloquées

Si une source renvoie un statut bloqué ou indéterminé (captcha, timeout), sa catégorie est
exclue du calcul. Le score est recalculé en pourcentage du maximum des catégories restantes,
ramené sur 100. Cela évite un score injustement bas à cause d'un blocage temporaire. Le
rapport signale la repondération.

## Gestion d'erreurs

- SIRET invalide : message clair, aucun scan lancé.
- Entreprise radiée : drapeau rouge dans le rapport, le scan continue.
- Source bloquée : statut indéterminé, exclue du score, mention dans le rapport.
- Timeout : chaque source a son budget, rapport partiel rendu.

## Structure

```
Scanner siret/
  package.json
  vite.config.js
  client/
    index.html
    src/  main.jsx, App.jsx, components/, styles.css
  server/
    index.js
    scan.js
    browser.js
    services/  siret.js, naf.js, serp.js, google.js, website.js, directories.js,
               score.js, cache.js
  tests/
  README.md
```

## Tests critiques (node:test, hors ligne)

- SIRET valide : validation Luhn positive.
- SIRET invalide : validation Luhn négative, resolveEntreprise lève une erreur.
- Entreprise sans site : computeScore attribue 0 à la catégorie site.
- Entreprise sans fiche Google Business : computeScore attribue 0 à la catégorie GBP.
- Repondération : une source bloquée est exclue du total.
