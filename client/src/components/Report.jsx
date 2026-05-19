import ScoreGauge from './ScoreGauge.jsx';
import {
  IconCheck,
  IconCross,
  IconQuestion,
  IconStar,
  IconGlobe,
  IconSearch,
  IconPin,
  IconList,
  IconWarning,
} from './Icons.jsx';

// Pastille de statut : oui / non / indetermine.
function Badge({ state }) {
  if (state === 'yes') {
    return (
      <span className="badge badge-yes">
        <IconCheck size={14} /> Oui
      </span>
    );
  }
  if (state === 'no') {
    return (
      <span className="badge badge-no">
        <IconCross size={14} /> Non
      </span>
    );
  }
  return (
    <span className="badge badge-unknown">
      <IconQuestion size={14} /> Indetermine
    </span>
  );
}

function boolState(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'unknown';
}

function Row({ label, state, value }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">
        {value != null && <span className="row-extra">{value}</span>}
        <Badge state={state} />
      </span>
    </div>
  );
}

const CATEGORIE_LABEL = {
  resto: 'Restauration',
  beaute: 'Coiffure et beaute',
  autre: 'Autre activite',
};

const ENGINE_LABEL = {
  google: 'Google',
  bing: 'Bing',
  ddg: 'DuckDuckGo',
};

export default function Report({ report }) {
  const { entreprise, google, googleBusiness, website, directories, score, advice, meta } =
    report;

  return (
    <div className="report">
      {/* En-tete entreprise */}
      <section className="card entreprise">
        <div className="entreprise-head">
          <h2>{entreprise.enseigne || entreprise.nom}</h2>
          {entreprise.etat === 'radie' ? (
            <span className="badge badge-no">
              <IconWarning size={14} /> Entreprise radiee
            </span>
          ) : (
            <span className="badge badge-yes">
              <IconCheck size={14} /> Active
            </span>
          )}
        </div>
        <dl className="entreprise-meta">
          <div>
            <dt>SIRET</dt>
            <dd>{entreprise.siret || 'Non renseigne'}</dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>
              {entreprise.adresse || 'Non renseignee'}
              {entreprise.ville ? `, ${entreprise.codePostal} ${entreprise.ville}` : ''}
            </dd>
          </div>
          <div>
            <dt>Activite</dt>
            <dd>
              {entreprise.nafLibelle} ({entreprise.naf})
            </dd>
          </div>
          <div>
            <dt>Categorie metier</dt>
            <dd>{CATEGORIE_LABEL[entreprise.categorie] || entreprise.categorie}</dd>
          </div>
        </dl>
      </section>

      {/* Score global */}
      <section className="card score-card">
        <ScoreGauge total={score.total} note={score.note} />
        <div className="score-detail">
          <h3>Score de visibilite digitale</h3>
          {score.reweighted && (
            <p className="notice">
              <IconWarning size={14} /> Une ou plusieurs sources etaient indisponibles. Le score
              a ete recalcule sur les categories analysables.
            </p>
          )}
          <ul className="breakdown">
            {score.breakdown.map((c) => (
              <li key={c.categorie}>
                <div className="breakdown-head">
                  <span>{c.categorie}</span>
                  <span className="breakdown-points">
                    {c.status === 'ok' ? `${c.points} / ${c.max}` : 'indetermine'}
                  </span>
                </div>
                <div className="bar">
                  <div
                    className={`bar-fill ${c.status !== 'ok' ? 'bar-unknown' : ''}`}
                    style={{ width: `${c.status === 'ok' ? (c.points / c.max) * 100 : 0}%` }}
                  />
                </div>
                {c.detail && <p className="breakdown-detail">{c.detail}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Detail des sources */}
      <div className="sources">
        {/* Apparition Google */}
        <section className="card source">
          <h3>
            <IconSearch /> Apparition sur Google
          </h3>
          {google.status === 'ok' ? (
            <>
              <Row
                label={`Requete "${google.requeteNom}"`}
                state={boolState(google.presentNom)}
              />
              <Row
                label={`Requete "${google.requeteMetierVille}"`}
                state={boolState(google.presentMetierVille)}
              />
              {google.engine && google.engine !== 'google' && (
                <p className="source-note">
                  Google etant indisponible, la verification a ete faite via{' '}
                  {ENGINE_LABEL[google.engine] || google.engine}.
                </p>
              )}
            </>
          ) : (
            <p className="source-blocked">
              <IconQuestion size={14} /> Source indisponible (blocage ou captcha).
            </p>
          )}
        </section>

        {/* Fiche etablissement et avis */}
        <section className="card source">
          <h3>
            <IconPin /> Fiche etablissement et avis
          </h3>
          {googleBusiness.status === 'ok' ? (
            <>
              <Row label="Fiche detectee" state={boolState(googleBusiness.found)} />
              {googleBusiness.note != null && (
                <Row
                  label="Note"
                  state="yes"
                  value={
                    <span className="note-stars">
                      <IconStar size={14} /> {googleBusiness.note} / 5
                    </span>
                  }
                />
              )}
              {googleBusiness.avis != null && (
                <Row label="Nombre d'avis" state="yes" value={`${googleBusiness.avis} avis`} />
              )}
              {googleBusiness.found && googleBusiness.note == null && (
                <p className="source-note">
                  Fiche presente sur les plateformes d'avis. La note exacte n'est lisible
                  que sur la fiche Google, inaccessible au scraping gratuit.
                </p>
              )}
              {googleBusiness.source && (
                <p className="source-note">Source : {googleBusiness.source}.</p>
              )}
            </>
          ) : (
            <p className="source-blocked">
              <IconQuestion size={14} />{' '}
              {googleBusiness.message ||
                'Verification impossible : aucun moteur accessible.'}
            </p>
          )}
        </section>

        {/* Site web */}
        <section className="card source">
          <h3>
            <IconGlobe /> Site web
          </h3>
          <Row label="Site detecte" state={boolState(website.found)} />
          {website.url && (
            <div className="row">
              <span className="row-label">URL</span>
              <a className="row-link" href={website.url} target="_blank" rel="noreferrer">
                {website.url}
              </a>
            </div>
          )}
          {website.quality ? (
            <>
              <Row label="HTTPS" state={boolState(website.quality.https)} />
              <Row label="Compatible mobile (viewport)" state={boolState(website.quality.viewport)} />
              <Row label="Balise title" state={boolState(website.quality.title)} />
              <Row label="Meta description" state={boolState(website.quality.description)} />
              <Row label="Titre h1" state={boolState(website.quality.h1)} />
              <Row
                label="Vitesse de reponse"
                state={website.quality.speedRating === 'lent' ? 'no' : 'yes'}
                value={`${website.quality.responseMs} ms, ${website.quality.speedRating}`}
              />
            </>
          ) : website.found ? (
            <p className="source-blocked">
              <IconWarning size={14} /> {website.error || 'Qualite non evaluable.'}
            </p>
          ) : (
            <p className="source-blocked">Aucun site web officiel detecte.</p>
          )}
        </section>

        {/* Annuaires */}
        <section className="card source">
          <h3>
            <IconList /> Annuaires metier
          </h3>
          {directories.items.map((d) => (
            <Row key={d.name} label={d.name} state={boolState(d.found)} />
          ))}
        </section>
      </div>

      {/* Recommandations */}
      {advice && advice.length > 0 && (
        <section className="card advice">
          <h3>
            <IconWarning /> Recommandations pour gagner en visibilite
          </h3>
          <ul className="advice-list">
            {advice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Methodologie et limites */}
      <details className="methodo">
        <summary>Comment fonctionne cet outil et quelles sont ses limites</summary>
        <div className="methodo-body">
          <p>
            L'outil identifie l'entreprise via l'API publique recherche-entreprises.api.gouv.fr,
            puis analyse sa presence en ligne par lecture automatisee des moteurs de recherche.
          </p>
          <ul>
            <li>
              Google bloque la lecture automatisee gratuite (captcha). L'apparition est donc
              mesuree via DuckDuckGo, le moteur ayant repondu est indique.
            </li>
            <li>
              La presence d'une fiche etablissement est fiable. La note exacte et le nombre
              d'avis n'existent que chez Google : ils sont affiches quand ils sont lisibles,
              sinon laisses vides, jamais inventes.
            </li>
            <li>
              Le site web est detecte par recherche puis par essai direct de noms de domaine.
              Un site tres recent ou non indexe peut etre manque.
            </li>
            <li>
              Une source bloquee est exclue du score, recalcule sur les categories restantes.
            </li>
            <li>
              Resultats indicatifs : photographie de la visibilite en ligne, pas un document
              officiel. Aucune donnee n'est inventee, au pire imprecise.
            </li>
          </ul>
        </div>
      </details>

      <p className="report-footer">
        Scan realise en {(meta.durationMs / 1000).toFixed(1)} s
        {meta.cached ? ', resultat en cache' : ''}. Les donnees sont indicatives.
      </p>
    </div>
  );
}
