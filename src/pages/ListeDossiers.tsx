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

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('dossiers')
      .select(
        `
        id, numero_dossier, compte_client, type_dossier, statut, date_deces, created_at,
        defunts (nom, prenom, civilite),
        pouvoirs (nom, prenom, telephone_1)
      `
      )
      .order('created_at', { ascending: false });
    setDossiers(data || []);
    setLoading(false);
  }

  const filtres = dossiers.filter((d) => {
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
      case 'annule':
        return { bg: '#FAECE7', color: '#993C1D', label: '❌ Annulé' };
      case 'en_attente_paiement':
        return {
          bg: '#FAEEDA',
          color: '#854F0B',
          label: '⏳ En attente paiement',
        };
      case 'paye':
        return { bg: '#E1F5EE', color: '#0F6E56', label: '💰 Payé' };
      case 'clos':
        return { bg: '#f0f0f0', color: '#666', label: '📁 Clos' };
      default:
        return { bg: '#f0f0f0', color: '#666', label: s };
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onRetour}>← Retour</button>
          <h2 style={{ margin: 0 }}>📁 Dossiers ({filtres.length})</h2>
        </div>
        <button onClick={charger} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
          🔄 Actualiser
        </button>
      </div>

      <input
        placeholder="🔍 Rechercher par nom, référence, numéro..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
      />

      {filtres.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          <div style={{ fontSize: '3rem' }}>📭</div>
          <p>Aucun dossier trouvé</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtres.map((d) => {
          const statut = statutColor(d.statut);
          return (
            <div key={d.id} onClick={() => onOuvrir(d.id)}
              style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s', userSelect: 'none' as const }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '18px' }}>{d.type_dossier === 'inhumation_locale' ? '⚰️' : '✈️'}</span>
                    <strong style={{ fontSize: '16px' }}>{d.defunts?.civilite} {d.defunts?.prenom} {d.defunts?.nom}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', display: 'flex', gap: '1rem' }}>
                    <span>📋 {d.numero_dossier}</span>
                    {d.compte_client && <span>🔖 {d.compte_client}</span>}
                    {d.date_deces && <span>📅 Décès le {new Date(d.date_deces).toLocaleDateString('fr-FR')}</span>}
                  </div>
                  {d.pouvoirs?.[0] && (
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '0.25rem' }}>
                      👤 Famille : {d.pouvoirs[0].prenom} {d.pouvoirs[0].nom} — {d.pouvoirs[0].telephone_1}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ background: statut.bg, color: statut.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {statut.label}
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