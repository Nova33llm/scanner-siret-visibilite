import { useState } from 'react';
import { IconSearch, IconPin } from './Icons.jsx';

// Formulaire de saisie : SIRET, ou nom d'enseigne plus ville.
export default function ScanForm({ loading, onScan }) {
  const [mode, setMode] = useState('siret');
  const [siret, setSiret] = useState('');
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [localError, setLocalError] = useState('');

  function submit(e) {
    e.preventDefault();
    setLocalError('');
    if (mode === 'siret') {
      const clean = siret.replace(/\s/g, '');
      if (!/^\d{14}$/.test(clean)) {
        setLocalError('Le SIRET doit contenir exactement 14 chiffres.');
        return;
      }
      onScan({ siret: clean });
    } else {
      if (!nom.trim() || !ville.trim()) {
        setLocalError("Renseigner le nom de l'enseigne et la ville.");
        return;
      }
      onScan({ nom: nom.trim(), ville: ville.trim() });
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'siret'}
          className={mode === 'siret' ? 'tab active' : 'tab'}
          onClick={() => setMode('siret')}
        >
          Par SIRET
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'nom'}
          className={mode === 'nom' ? 'tab active' : 'tab'}
          onClick={() => setMode('nom')}
        >
          Par nom plus ville
        </button>
      </div>

      {mode === 'siret' ? (
        <label className="field">
          <span>Numero SIRET</span>
          <div className="input-wrap">
            <IconSearch size={18} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="14 chiffres, ex : 80295478500028"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              maxLength={20}
            />
          </div>
        </label>
      ) : (
        <div className="field-row">
          <label className="field">
            <span>Nom de l'enseigne</span>
            <div className="input-wrap">
              <IconSearch size={18} />
              <input
                type="text"
                placeholder="ex : Boulangerie Saint-Pierre"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </label>
          <label className="field">
            <span>Ville</span>
            <div className="input-wrap">
              <IconPin size={18} />
              <input
                type="text"
                placeholder="ex : Bordeaux"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </div>
          </label>
        </div>
      )}

      {localError && <p className="form-error">{localError}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Analyse en cours...' : 'Lancer le scan'}
      </button>
      <p className="form-hint">
        Analyse de la presence Google, fiche Business, site web et annuaires metier.
        Comptez environ 30 secondes.
      </p>
    </form>
  );
}
