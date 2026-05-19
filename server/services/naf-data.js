// Table NAF rev.2 ciblee sur le commerce et les services de proximite.
// L'API recherche-entreprises ne renvoie pas le libelle, seulement le code.
// Chaque entree : code -> [libelle, terme de recherche metier].

export const NAF = {
  // Industries alimentaires
  '10.13A': ['Preparation industrielle de produits a base de viande', 'charcuterie'],
  '10.71A': ['Fabrication industrielle de pain et de patisserie fraiche', 'boulangerie'],
  '10.71B': ['Cuisson de produits de boulangerie', 'boulangerie'],
  '10.71C': ['Boulangerie et boulangerie-patisserie', 'boulangerie'],
  '10.71D': ['Patisserie', 'patisserie'],
  '10.52Z': ['Fabrication de glaces et sorbets', 'glacier'],

  // Restauration et hebergement
  '55.10Z': ['Hotels et hebergement similaire', 'hotel'],
  '55.20Z': ['Hebergement touristique de courte duree', 'hebergement'],
  '55.30Z': ['Terrains de camping', 'camping'],
  '56.10A': ['Restauration traditionnelle', 'restaurant'],
  '56.10B': ['Cafeterias et autres libres-services', 'cafeteria'],
  '56.10C': ['Restauration de type rapide', 'restauration rapide'],
  '56.21Z': ['Services des traiteurs', 'traiteur'],
  '56.30Z': ['Debits de boissons', 'bar'],

  // Commerce de detail alimentaire
  '47.11A': ['Commerce de detail de produits surgeles', 'surgeles'],
  '47.11B': ["Commerce d'alimentation generale", 'epicerie'],
  '47.11C': ['Superettes', 'superette'],
  '47.11D': ['Supermarches', 'supermarche'],
  '47.11F': ['Hypermarches', 'hypermarche'],
  '47.21Z': ['Commerce de detail de fruits et legumes', 'primeur'],
  '47.22Z': ['Commerce de detail de viandes en magasin specialise', 'boucherie'],
  '47.23Z': ['Commerce de detail de poissons et crustaces', 'poissonnerie'],
  '47.24Z': ['Commerce de detail de pain, patisserie et confiserie', 'boulangerie'],
  '47.25Z': ['Commerce de detail de boissons', 'cave a vin'],
  '47.26Z': ['Commerce de detail de produits a base de tabac', 'tabac'],
  '47.29Z': ['Autres commerces de detail alimentaires', 'epicerie'],

  // Commerce de detail non alimentaire
  '47.19B': ['Autres commerces de detail en magasin non specialise', 'magasin'],
  '47.91A': ['Vente a distance sur catalogue general', 'boutique en ligne'],
  '47.91B': ['Vente a distance sur catalogue specialise', 'boutique en ligne'],
  '47.99A': ['Vente a domicile', 'vente a domicile'],
  '47.99B': ['Vente par automates et autres commerces de detail hors magasin', 'commerce'],
  '47.41Z': ["Commerce de detail d'ordinateurs et de logiciels", 'informatique'],
  '47.43Z': ['Commerce de detail de materiels audio et video', 'electronique'],
  '47.51Z': ['Commerce de detail de textiles', 'textile'],
  '47.52A': ['Commerce de detail de quincaillerie et bricolage', 'bricolage'],
  '47.52B': ['Commerce de detail de bricolage en grande surface', 'bricolage'],
  '47.54Z': ["Commerce de detail d'appareils electromenagers", 'electromenager'],
  '47.59A': ['Commerce de detail de meubles', 'magasin de meubles'],
  '47.59B': ["Commerce de detail d'autres equipements du foyer", 'decoration'],
  '47.61Z': ['Commerce de detail de livres', 'librairie'],
  '47.62Z': ['Commerce de detail de journaux et papeterie', 'papeterie'],
  '47.64Z': ["Commerce de detail d'articles de sport", 'magasin de sport'],
  '47.65Z': ['Commerce de detail de jeux et jouets', 'magasin de jouets'],
  '47.71Z': ["Commerce de detail d'habillement", 'vetements'],
  '47.72A': ['Commerce de detail de chaussures', 'chaussures'],
  '47.72B': ['Commerce de detail de maroquinerie', 'maroquinerie'],
  '47.73Z': ['Commerce de detail de produits pharmaceutiques', 'pharmacie'],
  '47.74Z': ['Commerce de detail de materiels medicaux et orthopediques', 'materiel medical'],
  '47.75Z': ['Commerce de detail de parfumerie et de produits de beaute', 'parfumerie'],
  '47.76Z': ['Commerce de detail de fleurs et plantes', 'fleuriste'],
  '47.77Z': ["Commerce de detail d'articles d'horlogerie et de bijouterie", 'bijouterie'],
  '47.78A': ["Commerce de detail d'optique", 'opticien'],
  '47.78C': ['Autres commerces de detail specialises', 'magasin'],
  '47.79Z': ["Commerce de detail de biens d'occasion", 'depot vente'],

  // Automobile et reparation
  '45.11Z': ['Commerce de voitures et de vehicules legers', 'concessionnaire auto'],
  '45.20A': ["Entretien et reparation de vehicules legers", 'garage automobile'],
  '45.20B': ['Entretien et reparation autres vehicules', 'garage'],
  '45.32Z': ["Commerce de detail d'equipements automobiles", 'pieces auto'],
  '45.40Z': ['Commerce et reparation de motocycles', 'concessionnaire moto'],
  '95.21Z': ["Reparation de produits electroniques grand public", 'reparation electronique'],
  '95.23Z': ['Reparation de chaussures et articles en cuir', 'cordonnerie'],
  '95.25Z': ["Reparation d'articles d'horlogerie et de bijouterie", 'reparation horlogerie'],
  '95.29Z': ["Reparation d'autres biens personnels", 'reparation'],

  // Services personnels
  '96.01B': ['Blanchisserie-teinturerie de detail', 'pressing'],
  '96.02A': ['Coiffure', 'coiffeur'],
  '96.02B': ['Soins de beaute', 'institut de beaute'],
  '96.03Z': ['Services funeraires', 'pompes funebres'],
  '96.04Z': ['Entretien corporel', 'spa'],
  '96.09Z': ['Autres services personnels', 'service'],

  // Sante et bien-etre
  '86.21Z': ['Activite des medecins generalistes', 'medecin'],
  '86.23Z': ['Pratique dentaire', 'dentiste'],
  '86.90F': ['Activites de sante humaine non classees ailleurs', 'sante'],
  '93.13Z': ['Activites des centres de culture physique', 'salle de sport'],
  '93.29Z': ['Autres activites recreatives et de loisirs', 'loisirs'],

  // Artisanat du batiment (frequent chez les TPE)
  '41.20A': ['Construction de maisons individuelles', 'constructeur de maisons'],
  '43.21A': ["Travaux d'installation electrique", 'electricien'],
  '43.22A': ["Travaux d'installation d'eau et de gaz", 'plombier'],
  '43.31Z': ['Travaux de platrerie', 'platrier'],
  '43.32A': ['Travaux de menuiserie bois et PVC', 'menuisier'],
  '43.34Z': ['Travaux de peinture et vitrerie', 'peintre en batiment'],
  '43.39Z': ['Autres travaux de finition', 'artisan'],
  '81.21Z': ['Nettoyage courant des batiments', 'entreprise de nettoyage'],

  // Services professionnels frequents
  '74.20Z': ['Activites photographiques', 'photographe'],
  '70.22Z': ['Conseil pour les affaires et la gestion', 'conseil'],
  '69.10Z': ['Activites juridiques', 'avocat'],
  '68.31Z': ['Agences immobilieres', 'agence immobiliere'],
};

// Libelles des sections NAF (lettre A a U), utilises en dernier recours.
export const SECTIONS = {
  A: ['Agriculture, sylviculture et peche', 'producteur'],
  C: ['Industrie manufacturiere', 'fabricant'],
  F: ['Construction', 'artisan du batiment'],
  G: ['Commerce et reparation', 'magasin'],
  H: ['Transports et entreposage', 'transport'],
  I: ['Hebergement et restauration', 'restaurant'],
  J: ['Information et communication', 'agence'],
  K: ['Activites financieres et d assurance', 'assurance'],
  L: ['Activites immobilieres', 'agence immobiliere'],
  M: ['Activites specialisees, scientifiques et techniques', 'cabinet'],
  N: ['Services administratifs et de soutien', 'service'],
  P: ['Enseignement', 'formation'],
  Q: ['Sante humaine et action sociale', 'sante'],
  R: ['Arts, spectacles et activites recreatives', 'loisirs'],
  S: ['Autres activites de services', 'service'],
};
