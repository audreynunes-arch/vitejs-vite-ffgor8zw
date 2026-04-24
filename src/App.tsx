import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import NouveauDossier from './pages/NouveauDossier';
import ListeDossiers from './pages/ListeDossiers';
import DossierDetail from './pages/DossierDetail';
import Devis from './pages/Devis';
import ParametresAgence from './pages/ParametresAgence';
import Referentiels from './pages/Referentiels';
import Documents from './pages/Documents';
import Statistiques from './pages/Statistiques';
import SuiviTravaux from './pages/SuiviTravaux';
import GestionStocks from './pages/GestionStocks';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [page, setPage] = useState('accueil');
  const [dossierId, setDossierId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) chargerUtilisateur(data.session.user.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) chargerUtilisateur(session.user.id);
    });
  }, []);

  async function chargerUtilisateur(id: string) {
    const { data } = await supabase
      .from('utilisateurs')
      .select('*, agences(*)')
      .eq('id', id)
      .single();
    setUtilisateur(data);
  }

  async function login() {
    setLoading(true);
    setErreur('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErreur(error.message);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUtilisateur(null);
    setPage('accueil');
    setDossierId(null);
  }

  const couleur = utilisateur?.agences?.couleur_principale || '#4F46E5';

  if (session && utilisateur) {
    return (
      <div
        style={{
          fontFamily: 'sans-serif',
          minHeight: '100vh',
          background: '#f9f9f9',
        }}
      >
        <div
          style={{
            background: couleur,
            color: 'white',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            onClick={() => {
              setPage('accueil');
              setDossierId(null);
            }}
            style={{ fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}
          >
            🏛️ {utilisateur.agences?.nom || 'Pompes Funèbres'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '14px' }}>
              {utilisateur.prenom} {utilisateur.nom} —{' '}
              {utilisateur.agences?.nom}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'white',
                color: couleur,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {page === 'accueil' && (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h2>Bonjour {utilisateur.prenom} 👋</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginTop: '1.5rem',
                }}
              >
                <div
                  onClick={() => {
                    setPage('dossiers');
                    setDossierId(null);
                  }}
                  style={{
                    background: couleur,
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>📁</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Dossiers
                  </div>
                </div>
                <div
                  onClick={() => setPage('nouveau')}
                  style={{
                    background: '#0F6E56',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>➕</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Nouveau dossier
                  </div>
                </div>
                <div
                  onClick={() => setPage('statistiques')}
                  style={{
                    background: '#185FA5',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>📊</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Statistiques
                  </div>
                </div>
                <div
                  onClick={() => setPage('suivi_travaux')}
                  style={{
                    background: '#712B13',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>🏗️</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Suivi travaux
                  </div>
                </div>
                <div
                  onClick={() => setPage('referentiels')}
                  style={{
                    background: '#854F0B',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>📚</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Référentiels
                  </div>
                </div>
                <div
                  onClick={() => setPage('parametres')}
                  style={{
                    background: '#374151',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>⚙️</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Paramètres
                  </div>
                </div>
                <div
                  onClick={() => setPage('stocks')}
                  style={{
                    background: '#166534',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>📦</div>
                  <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Stocks
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === 'nouveau' && (
            <NouveauDossier onRetour={() => setPage('accueil')} />
          )}

          {page === 'dossiers' && !dossierId && (
            <ListeDossiers onOuvrir={(id) => setDossierId(id)} />
          )}

          {page === 'dossiers' && dossierId && (
            <DossierDetail
              dossierId={dossierId}
              onRetour={() => setDossierId(null)}
              onDevis={() => setPage('devis')}
              onDocuments={() => setPage('documents')}
            />
          )}

          {page === 'devis' && dossierId && (
            <Devis dossierId={dossierId} onRetour={() => setPage('dossiers')} />
          )}

          {page === 'documents' && dossierId && (
            <Documents
              dossierId={dossierId}
              onRetour={() => setPage('dossiers')}
            />
          )}

          {page === 'statistiques' && (
            <Statistiques
              agenceId={utilisateur.agence_id}
              onRetour={() => setPage('accueil')}
            />
          )}

          {page === 'suivi_travaux' && (
            <SuiviTravaux
              agenceId={utilisateur.agence_id}
              onRetour={() => setPage('accueil')}
            />
          )}

          {page === 'parametres' && (
            <ParametresAgence
              agenceId={utilisateur.agence_id}
              onRetour={() => setPage('accueil')}
            />
          )}

          {page === 'referentiels' && (
            <Referentiels onRetour={() => setPage('accueil')} />
          )}

          {page === 'stocks' && (
            <GestionStocks
              agenceId={utilisateur.agence_id}
              onRetour={() => setPage('accueil')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        maxWidth: '400px',
        margin: '100px auto',
      }}
    >
      <h1>Connexion</h1>
      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
      <div style={{ marginBottom: '1rem' }}>
        <label>Email</label>
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Mot de passe</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
        />
      </div>
      <button
        onClick={login}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </div>
  );
}
