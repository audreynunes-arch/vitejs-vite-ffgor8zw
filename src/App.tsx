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
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
              <h2 style={{ color: '#1f2937' }}>
                Bonjour {utilisateur.prenom} 👋
              </h2>

              <div
                onClick={() => setPage('nouveau')}
                style={{
                  background: '#FBE3D6',
                  padding: '1.5rem',
                  borderRadius: '14px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 18px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '1.9rem' }}>➕</span>
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '1.15rem',
                    color: '#B85C38',
                  }}
                >
                  Nouveau dossier
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                {[
                  {
                    key: 'dossiers',
                    emoji: '📁',
                    label: 'Dossiers',
                    bg: '#D6EFE9',
                    texte: '#1B5E5A',
                    action: () => {
                      setPage('dossiers');
                      setDossierId(null);
                    },
                  },
                  {
                    key: 'statistiques',
                    emoji: '📊',
                    label: 'Statistiques',
                    bg: '#DCE6F5',
                    texte: '#2D5A8A',
                    action: () => setPage('statistiques'),
                  },
                  {
                    key: 'suivi_travaux',
                    emoji: '🏗️',
                    label: 'Suivi travaux',
                    bg: '#EFE0EC',
                    texte: '#8A3E72',
                    action: () => setPage('suivi_travaux'),
                  },
                  {
                    key: 'referentiels',
                    emoji: '📚',
                    label: 'Référentiels',
                    bg: '#F5E8D0',
                    texte: '#9A7510',
                    action: () => setPage('referentiels'),
                  },
                  {
                    key: 'parametres',
                    emoji: '⚙️',
                    label: 'Paramètres',
                    bg: '#E0EEDB',
                    texte: '#3B6D2A',
                    action: () => setPage('parametres'),
                  },
                  {
                    key: 'stocks',
                    emoji: '📦',
                    label: 'Stocks',
                    bg: '#E6DEF2',
                    texte: '#6A4A9C',
                    action: () => setPage('stocks'),
                  },
                ].map((carte) => (
                  <div
                    key={carte.key}
                    onClick={carte.action}
                    style={{
                      background: carte.bg,
                      padding: '1.6rem 1rem',
                      borderRadius: '14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow =
                        '0 8px 18px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '1.9rem', marginBottom: '0.4rem' }}>
                      {carte.emoji}
                    </div>
                    <div style={{ fontWeight: 'bold', color: carte.texte }}>
                      {carte.label}
                    </div>
                  </div>
                ))}
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
            <Referentiels
              agenceId={utilisateur.agence_id}
              onRetour={() => setPage('accueil')}
            />
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
