# Scanner SIRET, design (proto local)

Date : 2026-05-19

## Objectif

Outil web local. Un commercant entre son SIRET (14 chiffres) ou son nom d'enseigne plus
une ville. En 30 secondes cible, l'outil renvoie un rapport visuel de visibilite digitale
avec un score global sur 100.

## Stack

- Client : Vite plus React, page unique, icones et illustrations en SVG uniquement.
- Serveur : Express (port 3001).
- Scraping : Playwright headless (Chromium), rotation de user-agent, gestion des timeouts.
- Cache : fichier JSON, TTL 15 minutes, sur les scans et sur les requetes Google.
- Aucune cle API payante.

## Sources de donnees

1. recherche-entreprises.api.gouv.fr : SIRET ou nom plus ville vers nom, adresse, code NAF,
   etat administratif (actif ou radie). API publique gratuite.
2. SIRENE INSEE : backup documente. L'API directe exige un token gratuit a creer
   manuellement, hors perimetre du proto. recherche-entreprises s'appuie deja sur SIRENE.
3. Google (Playwright) : presence SERP, panneau Google Business, detection du site web.
4. Heuristiques serveur : qualite du site (HTTPS, viewport, title, meta description, h1,
   temps de reponse).

## Flow

1. Saisie SIRET ou nom plus ville.
2. SIRET : validation longueur 14 chiffres plus cle de controle Luhn, puis resolution API.
   Nom plus ville : recherche plein texte, meilleur correspondant sur la commune.
3. Code NAF vers categorie metier : resto, beaute, autre.
4. En parallele : SERP Google, fiche Google Business, detection plus qualite du site,
   presence annuaires.
5. Calcul du score, rapport JSON, rendu UI.

## Categories d'annuaires

- resto : Pages Jaunes, Yelp, TheFork, Tripadvisor.
- coiffeur ou beaute : Pages Jaunes, Planity, Treatwell.
- autres : Pages Jaunes, Yelp, Google Maps.

## Score sur 100, ponderation

- Fiche Google Business : 30 (existe 12, note jusqu'a 10, avis jusqu'a 8).
- Apparition Google : 25 (requete nom enseigne 15, requete metier plus ville 10).
- Site web : 25 (detecte 10, qualite jusqu'a 15).
- Annuaires metier : 20 (proportion d'annuaires ou l'enseigne apparait).

Qualite du site sur 15 : HTTPS 4, viewport 3, title 2, meta description 2, h1 1,
vitesse jusqu'a 3.

Note lettre : A si 80 et plus, B si 60, C si 40, D si 20, E en dessous.

## Reponderation des sources bloquees

Si une source renvoie un statut bloque ou indetermine (captcha, timeout), sa categorie est
exclue du calcul. Le score est recalcule en pourcentage du maximum des categories restantes,
ramene sur 100. Cela evite un score injustement bas a cause d'un blocage temporaire. Le
rapport signale la reponderation.

## Gestion d'erreurs

- SIRET invalide : message clair, aucun scan lance.
- Entreprise radiee : drapeau rouge dans le rapport, le scan continue.
- Source bloquee : statut indetermine, exclue du score, mention dans le rapport.
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
- SIRET invalide : validation Luhn negative, resolveEntreprise leve une erreur.
- Entreprise sans site : computeScore attribue 0 a la categorie site.
- Entreprise sans fiche Google Business : computeScore attribue 0 a la categorie GBP.
- Reponderation : une source bloquee est exclue du total.
