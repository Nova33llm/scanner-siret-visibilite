/*
 * Vous inspectez le code ? Demandez-moi, je vous explique avec plaisir.
 * Emmanuel Truffaut, Product Builder No-Code et IA.
 * LinkedIn : https://www.linkedin.com/in/emmanuel-truffaut-b38b292b7
 */
import { useState } from 'react';
import ScanForm from './components/ScanForm.jsx';
import Report from './components/Report.jsx';
import { IconRadar, IconWarning, IconLogo } from './components/Icons.jsx';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  async function runScan(payload) {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.message || 'Le scan a echoue.');
      } else {
        setReport(data);
      }
    } catch {
      setError("Impossible de joindre le serveur. Verifiez qu'il est bien lance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="brand-icon">
              <IconRadar size={26} />
            </span>
            <span className="brand-name">Scanner SIRET</span>
          </div>
          <h1>Mesurez la visibilite digitale d'un commerce</h1>
          <p>
            Entrez un SIRET ou un nom d'enseigne. L'outil analyse la presence Google, la fiche
            Business, le site web et les annuaires metier, puis calcule un score sur 100.
          </p>
        </div>
      </header>

      <main className="container">
        <ScanForm loading={loading} onScan={runScan} />

        {loading && (
          <div className="card status-card">
            <div className="spinner" aria-hidden="true" />
            <p>Analyse des sources en cours, cela peut prendre une trentaine de secondes.</p>
          </div>
        )}

        {error && (
          <div className="card error-card">
            <IconWarning size={20} />
            <p>{error}</p>
          </div>
        )}

        {report && !loading && <Report report={report} />}
      </main>

      <footer className="page-footer">
        <a
          className="footer-brand"
          href="https://portfolio.etd-projects.fr"
          target="_blank"
          rel="noreferrer"
        >
          <IconLogo size={20} />
          <span>
            Cree par <strong>E.T.D Projects</strong>
          </span>
        </a>
        <p className="footer-note">
          Outil local. Donnees issues de recherche-entreprises.api.gouv.fr et de sources
          publiques. Resultats indicatifs.
        </p>
      </footer>
    </div>
  );
}
