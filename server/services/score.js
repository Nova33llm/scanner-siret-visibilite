// Calcul du score de visibilite digitale sur 100.
// Ponderation : Google Business 30, Apparition Google 25, Site web 25, Annuaires 20.
// Une categorie au statut indetermine est exclue, le total est reponere sur les
// categories restantes puis ramene sur 100.

const MAX = {
  business: 30,
  google: 25,
  website: 25,
  directories: 20,
};

function scoreBusiness(business) {
  const CAT = 'Fiche etablissement et avis';
  if (!business || business.status !== 'ok') {
    return { categorie: CAT, max: MAX.business, status: 'indetermine', points: 0 };
  }
  let points = 0;
  const detail = [];
  if (business.found) {
    points += 16;
    detail.push('Fiche detectee');
    if (business.note != null) {
      points += Math.round((business.note / 5) * 9);
      detail.push(`Note ${business.note} sur 5`);
    }
    if (business.avis != null && business.avis > 0) {
      points += Math.min(5, Math.round(business.avis / 20));
      detail.push(`${business.avis} avis`);
    }
  } else {
    detail.push('Aucune fiche etablissement detectee');
  }
  return {
    categorie: CAT,
    max: MAX.business,
    status: 'ok',
    points: Math.min(MAX.business, points),
    detail: detail.join(', '),
  };
}

function scoreGoogle(google) {
  if (!google || google.status !== 'ok') {
    return { categorie: 'Apparition Google', max: MAX.google, status: 'indetermine', points: 0 };
  }
  let points = 0;
  const detail = [];
  if (google.presentNom) {
    points += 15;
    detail.push('Visible sur la requete nom enseigne');
  } else {
    detail.push('Absente sur la requete nom enseigne');
  }
  if (google.presentMetierVille) {
    points += 10;
    detail.push('Visible sur la requete metier plus ville');
  } else {
    detail.push('Absente sur la requete metier plus ville');
  }
  return {
    categorie: 'Apparition Google',
    max: MAX.google,
    status: 'ok',
    points,
    detail: detail.join(', '),
  };
}

function scoreWebsite(website) {
  let points = 0;
  let detail;
  if (website && website.found) {
    points = 10 + (website.qualityScore || 0);
    detail = website.quality
      ? `Site detecte, qualite ${website.qualityScore} sur 15`
      : 'Site detecte mais injoignable';
  } else {
    detail = 'Aucun site web detecte';
  }
  return {
    categorie: 'Site web',
    max: MAX.website,
    status: 'ok',
    points: Math.min(MAX.website, points),
    detail,
  };
}

function scoreDirectories(directories) {
  if (!directories || directories.status !== 'ok') {
    return { categorie: 'Annuaires', max: MAX.directories, status: 'indetermine', points: 0 };
  }
  const checked = directories.items.filter((i) => i.status === 'ok');
  if (checked.length === 0) {
    return { categorie: 'Annuaires', max: MAX.directories, status: 'indetermine', points: 0 };
  }
  const present = checked.filter((i) => i.found).length;
  const points = Math.round((present / checked.length) * MAX.directories);
  return {
    categorie: 'Annuaires',
    max: MAX.directories,
    status: 'ok',
    points,
    detail: `Present sur ${present} annuaire(s) sur ${checked.length} verifie(s)`,
  };
}

export function computeScore({ google, googleBusiness, website, directories }) {
  const breakdown = [
    scoreBusiness(googleBusiness),
    scoreGoogle(google),
    scoreWebsite(website),
    scoreDirectories(directories),
  ];

  // Reponderation : seules les categories au statut ok comptent dans le total.
  const active = breakdown.filter((c) => c.status === 'ok');
  const totalMax = active.reduce((s, c) => s + c.max, 0);
  const rawTotal = active.reduce((s, c) => s + c.points, 0);
  const total = totalMax > 0 ? Math.round((rawTotal / totalMax) * 100) : 0;

  const note =
    total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'E';

  return {
    total,
    note,
    breakdown,
    reweighted: active.length < breakdown.length,
  };
}
