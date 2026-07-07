import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
interface Props {
  onOuvrir: (id: string) => void;
  onRetour: () => void;
}
export default function ListeDossiers({ onOuvrir, onRetour }: Props) {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [afficherTermines, setAfficherTermines] = useState(false);
  useEffect(() => {
    charger();
  }, []);
  async function charger() {
    setLoading(true);
    // Récupérer l'agence de l'utilisateur connecté
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    const { data: user } = await supabase
      .from('utilisateurs')
      .select('agence_id')
      .eq('id', userId)
      .single();
    const agenceId = user?.agence_id || '';
    const { data } = await supabase
      .from('dossiers')
      .select(
        `
        id, numero_dossier, compte_client, type_dossier, statut, statut_devis, statut_facture, date_deces, date_inhumation, date_vol, created_at,
        defunts (nom, prenom, civilite),
        pouvoirs (nom, prenom, telephone_1)
      `
      )
      .eq('agence_id', agenceId)
      .order('created_at', { ascending: false });
    setDossiers(data || []);
    setLoading(false);
  }
  const TERMINES = ['paye', 'clos', 'annule', 'refuse'];
  // Statut DOSSIER automatique :
  // Annulé (manuel) > si devis validé : Terminé (date passée) sinon Validé
  // > sinon En cours
  const statutDossier = (d: any): string => {
    if (d.statut === 'annule') return 'annule';
    if (d.statut_devis === 'refuse') return 'refuse';
    const dateEvent = d.date_inhumation || d.date_vol;
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const datePassee = dateEvent && new Date(dateEvent) < aujourdhui;
    if (d.statut_devis === 'accepte') return datePassee ? 'termine' : 'valide';
    return 'en_cours';
  };
  const filtres = dossiers.filter((d) => {
    const st = statutDossier(d);
    // On ne cache QUE les dossiers vraiment finis : Terminé + Payé, Annulé, Refusé.
    // Un Terminé NON payé reste affiché (pour ne pas oublier le paiement).
    const finiEtPaye = st === 'termine' && d.statut_facture === 'payee';
    if (!afficherTermines && (finiEtPaye || st === 'annule' || st === 'refuse'))
      return false;
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    const nomDefunt = `${d.defunts?.prenom} ${d.defunts?.nom}`.toLowerCase();
    const ref = (d.compte_client || '').toLowerCase();
    const num = (d.numero_dossier || '').toLowerCase();
    return nomDefunt.includes(q) || ref.includes(q) || num.includes(q);
  });
  const statutColor = (s: string) => {
    switch (s) {
      case 'en_cours':
        return { bg: '#EEF2FF', color: '#4F46E5', label: '🔵 En cours' };
      case 'valide':
        return { bg: '#E1F5EE', color: '#0F6E56', label: '✅ Validé' };
      case 'termine':
        return { bg: '#f0f0f0', color: '#666', label: '🏁 Terminé' };
      case 'annule':
        return { bg: '#FAECE7', color: '#993C1D', label: '❌ Annulé' };
      case 'refuse':
        return { bg: '#FAECE7', color: '#993C1D', label: '🚫 Refusé' };
      default:
        return { bg: '#f0f0f0', color: '#666', label: s };
    }
  };
  // Badge du statut PAIEMENT (séparé)
  const paiementColor = (s: string) => {
    switch (s) {
      case 'payee':
        return { bg: '#E1F5EE', color: '#0F6E56', label: '💰 Payée' };
      case 'partiellement_payee':
        return { bg: '#FAEEDA', color: '#854F0B', label: '⏳ Partiel' };
      default:
        return { bg: '#FAECE7', color: '#993C1D', label: '💳 Non payée' };
    }
  };
  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onRetour} style={{ cursor: 'pointer' }}>
            ← Retour
          </button>
          <h2 style={{ margin: 0 }}>📁 Dossiers ({filtres.length})</h2>
        </div>
        <button
          onClick={charger}
          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
        >
          🔄 Actualiser
        </button>
      </div>
      <input
        placeholder="🔍 Rechercher par nom, référence, numéro..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '15px',
          boxSizing: 'border-box',
        }}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '14px',
          color: '#555',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={afficherTermines}
          onChange={(e) => setAfficherTermines(e.target.checked)}
        />
        Afficher aussi les dossiers clôturés (terminés &amp; payés, annulés)
      </label>
      {filtres.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          <div style={{ fontSize: '3rem' }}>📭</div>
          <p>Aucun dossier trouvé</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtres.map((d) => {
          const statut = statutColor(statutDossier(d));
          const paiement = paiementColor(d.statut_facture);
          return (
            <div
              key={d.id}
              onClick={() => onOuvrir(d.id)}
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
                userSelect: 'none' as const,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>
                      {d.type_dossier === 'inhumation_locale'
                        ? '⚰️'
                        : d.type_dossier === 'devis_libre'
                        ? '🧾'
                        : '✈️'}
                    </span>
                    <strong style={{ fontSize: '16px' }}>
                      {d.defunts?.civilite} {d.defunts?.prenom} {d.defunts?.nom}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#888',
                      display: 'flex',
                      gap: '1rem',
                    }}
                  >
                    <span>📋 {d.numero_dossier}</span>
                    {d.compte_client && <span>🔖 {d.compte_client}</span>}
                    {d.date_deces && (
                      <span>
                        📅 Décès le{' '}
                        {new Date(d.date_deces).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  {d.pouvoirs?.[0] && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#888',
                        marginTop: '0.25rem',
                      }}
                    >
                      👤 Famille : {d.pouvoirs[0].prenom} {d.pouvoirs[0].nom} —{' '}
                      {d.pouvoirs[0].telephone_1}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      background: statut.bg,
                      color: statut.color,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {statut.label}
                  </span>
                  <span
                    style={{
                      background: paiement.bg,
                      color: paiement.color,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {paiement.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#bbb' }}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
