// Genere des recommandations actionnables a partir du rapport de scan.
// Transforme le diagnostic en conseils concrets pour le commercant.

export function generateAdvice({ google, googleBusiness, website, directories }) {
  const advice = [];

  // Site web
  if (!website.found) {
    advice.push(
      "Aucun site web detecte. Creez au minimum une page simple presentant votre " +
        'activite, vos horaires et vos coordonnees.',
    );
  } else if (website.quality) {
    if (!website.quality.https) {
      advice.push(
        "Votre site n'est pas en HTTPS. Activez un certificat SSL, gratuit chez la " +
          'plupart des hebergeurs.',
      );
    }
    if (!website.quality.viewport) {
      advice.push(
        "Votre site n'est pas adapte au mobile. Ajoutez une balise viewport et un " +
          'affichage responsive.',
      );
    }
    if (!website.quality.description) {
      advice.push(
        'Ajoutez une meta description a vos pages : elle sert de resume dans les ' +
          'resultats de recherche.',
      );
    }
    if (website.quality.speedRating === 'lent') {
      advice.push(
        'Votre site est lent a repondre. Optimisez le poids des images et la qualite ' +
          "de l'hebergement.",
      );
    }
  }

  // Fiche etablissement
  if (googleBusiness.status === 'ok' && !googleBusiness.found) {
    advice.push(
      'Aucune fiche etablissement detectee. Creez une fiche Google Business : gratuit, ' +
        'et premier levier de visibilite locale.',
    );
  }

  // Annuaires
  const checked = directories.items.filter((i) => i.status === 'ok');
  const missing = checked.filter((i) => i.found === false).map((i) => i.name);
  if (missing.length > 0) {
    advice.push(
      `Vous etes absent de : ${missing.join(', ')}. L'inscription de base y est ` +
        'generalement gratuite.',
    );
  }

  // Apparition dans les recherches
  if (google.status === 'ok' && google.presentMetierVille === false) {
    advice.push(
      "Vous n'apparaissez pas sur la recherche metier plus ville. Travaillez votre " +
        'referencement local : mentionnez votre activite et votre ville sur votre site.',
    );
  }

  return advice;
}
