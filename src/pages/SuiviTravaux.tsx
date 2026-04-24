import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Props {
  agenceId: string;
  onRetour: () => void;
}

export default function SuiviTravaux({ agenceId, onRetour }: Props) {
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [filtreMarbrier, setFiltreMarbrier] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [marbriers, setMarbriers] = useState<any[]>([]);

  useEffect(() => {
    charger();
  }, [agenceId]);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('dossiers')
      .select('*, defunts(*), marbriers(nom, ville)')
      .eq('agence_id', agenceId)
      .eq('type_dossier', 'inhumation_locale')
      .not('date_inhumation', 'is', null)
      .order('date_inhumation', { ascending: false });
    setDossiers(data || []);

    const { data: marb } = await supabase
      .from('marbriers')
      .select('id, nom')
      .order('nom');
    setMarbriers(marb || []);
    setLoading(false);
  }

  async function marquerTravaux(
    dossierId: string,
    realises: boolean,
    date: string | null
  ) {
    await supabase
      .from('dossiers')
      .update({
        travaux_realises: realises,
        date_travaux_realises: date,
      })
      .eq('id', dossierId);
    charger();
  }

  function statutTravaux(d: any) {
    if (d.travaux_realises) return null;
    const date_inhumation = d.date_inhumation;
    if (!date_inhumation) return null;
    const inhumation = new Date(date_inhumation);
    const now = new Date();
    const moisEcoules =
      (now.getTime() - inhumation.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (moisEcoules < 4)
      return {
        label: '⏳ Trop tôt',
        couleur: '#888',
        bg: '#f0f0f0',
        mois: Math.round(4 - moisEcoules),
      };
    if (moisEcoules < 5)
      return {
        label: '🟡 Bientôt possible',
        couleur: '#854F0B',
        bg: '#FAEEDA',
        mois: 0,
      };
    if (moisEcoules < 12)
      return {
        label: '🟢 Travaux possibles',
        couleur: '#0F6E56',
        bg: '#E1F5EE',
        mois: 0,
      };
    return {
      label: '🔴 À relancer',
      couleur: '#993C1D',
      bg: '#FAECE7',
      mois: 0,
    };
  }

  function dateEstimeeTravaux(date_inhumation: string) {
    if (!date_inhumation) return '—';
    const d = new Date(date_inhumation);
    d.setMonth(d.getMonth() + 4);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  const filtres = dossiers.filter((d) => {
    if (filtreMarbrier && d.marbrier_id !== filtreMarbrier) return false;
    if (filtreStatut === 'non_realises' && d.travaux_realises) return false;
    if (filtreStatut === 'realises' && !d.travaux_realises) return false;
    if (filtreStatut && !['non_realises', 'realises'].includes(filtreStatut)) {
      if (d.travaux_realises) return false;
      const s = statutTravaux(d);
      if (!s) return false;
      if (filtreStatut === 'trop_tot' && !s.label.includes('Trop'))
        return false;
      if (filtreStatut === 'bientot' && !s.label.includes('Bientôt'))
        return false;
      if (filtreStatut === 'possible' && !s.label.includes('possible'))
        return false;
      if (filtreStatut === 'relancer' && !s.label.includes('relancer'))
        return false;
    }
    return true;
  });

  // Compteurs
  const trop_tot = dossiers.filter(
    (d) => !d.travaux_realises && statutTravaux(d)?.label.includes('Trop')
  ).length;
  const bientot = dossiers.filter(
    (d) => !d.travaux_realises && statutTravaux(d)?.label.includes('Bientôt')
  ).length;
  const possible = dossiers.filter(
    (d) => !d.travaux_realises && statutTravaux(d)?.label.includes('possible')
  ).length;
  const relancer = dossiers.filter(
    (d) => !d.travaux_realises && statutTravaux(d)?.label.includes('relancer')
  ).length;
  const realises = dossiers.filter((d) => d.travaux_realises).length;

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>🏗️ Suivi travaux marbrier</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
          {dossiers.length} dossier(s)
        </span>
      </div>

      {/* CARDS STATUTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          {
            label: '⏳ Trop tôt',
            count: trop_tot,
            couleur: '#888',
            bg: '#f0f0f0',
            val: 'trop_tot',
          },
          {
            label: '🟡 Bientôt',
            count: bientot,
            couleur: '#854F0B',
            bg: '#FAEEDA',
            val: 'bientot',
          },
          {
            label: '🟢 Possible',
            count: possible,
            couleur: '#0F6E56',
            bg: '#E1F5EE',
            val: 'possible',
          },
          {
            label: '🔴 À relancer',
            count: relancer,
            couleur: '#993C1D',
            bg: '#FAECE7',
            val: 'relancer',
          },
          {
            label: '✅ Réalisés',
            count: realises,
            couleur: '#4F46E5',
            bg: '#EEF2FF',
            val: 'realises',
          },
        ].map((s) => (
          <div
            key={s.val}
            onClick={() => setFiltreStatut(filtreStatut === s.val ? '' : s.val)}
            style={{
              background: filtreStatut === s.val ? s.bg : 'white',
              border: `2px solid ${
                filtreStatut === s.val ? s.couleur : '#eee'
              }`,
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: s.couleur,
              }}
            >
              {s.count}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: s.couleur,
                marginTop: '0.25rem',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #eee',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>
          🔍 Filtres :
        </span>
        <select
          value={filtreMarbrier}
          onChange={(e) => setFiltreMarbrier(e.target.value)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '12px',
          }}
        >
          <option value="">Tous les marbriers</option>
          {marbriers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setFiltreStatut(
              filtreStatut === 'non_realises' ? '' : 'non_realises'
            )
          }
          style={{
            padding: '0.4rem 0.8rem',
            background: filtreStatut === 'non_realises' ? '#4F46E5' : '#f0f0f0',
            color: filtreStatut === 'non_realises' ? 'white' : '#555',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          🔧 Non réalisés seulement
        </button>
        {(filtreMarbrier || filtreStatut) && (
          <button
            onClick={() => {
              setFiltreMarbrier('');
              setFiltreStatut('');
            }}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#eee',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ✕ Réinitialiser
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
          {filtres.length} résultat(s)
        </span>
      </div>

      {/* TABLEAU */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr
              style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}
            >
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Défunt
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Date inhumation
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Marbrier
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Travaux prévus
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Concession
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  color: '#555',
                }}
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {filtres.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#888',
                  }}
                >
                  Aucun dossier trouvé
                </td>
              </tr>
            )}
            {filtres.map((d, i) => {
              const statut = statutTravaux(d);
              return (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    background: d.travaux_realises
                      ? '#f0fff4'
                      : i % 2 === 0
                      ? 'white'
                      : '#fafafa',
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {d.defunts?.prenom} {d.defunts?.nom}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {d.numero_dossier}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div>
                      {d.date_inhumation
                        ? new Date(d.date_inhumation).toLocaleDateString(
                            'fr-FR'
                          )
                        : '—'}
                    </div>
                    {d.heure_inhumation && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        à {d.heure_inhumation}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {d.marbriers ? (
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {d.marbriers.nom}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {d.marbriers.ville}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#ccc' }}>Non assigné</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      {d.travaux_realiser || '—'}
                    </div>
                    {!d.travaux_realises && statut && statut.mois > 0 && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Dans ~{statut.mois} mois
                      </div>
                    )}
                    {!d.travaux_realises &&
                      statut &&
                      statut.mois === 0 &&
                      d.date_inhumation && (
                        <div style={{ fontSize: '11px', color: '#0F6E56' }}>
                          Possible depuis{' '}
                          {dateEstimeeTravaux(d.date_inhumation)}
                        </div>
                      )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '12px' }}>
                      {d.numero_concession || '—'}
                    </div>
                    {d.division_concession && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Div. {d.division_concession}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {d.travaux_realises ? (
                      <div>
                        <span
                          style={{
                            background: '#E1F5EE',
                            color: '#0F6E56',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          ✅ Réalisés
                        </span>
                        {d.date_travaux_realises && (
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            le{' '}
                            {new Date(
                              d.date_travaux_realises
                            ).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        <button
                          onClick={() => marquerTravaux(d.id, false, null)}
                          style={{
                            fontSize: '10px',
                            color: '#888',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            marginTop: '0.25rem',
                            padding: 0,
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div>
                        {statut && (
                          <span
                            style={{
                              background: statut.bg,
                              color: statut.couleur,
                              padding: '0.25rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              marginBottom: '0.5rem',
                            }}
                          >
                            {statut.label}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            marquerTravaux(
                              d.id,
                              true,
                              new Date().toISOString().split('T')[0]
                            )
                          }
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: '#0F6E56',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ✅ Marquer réalisés
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
