import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
interface Props {
  agenceId: string;
  onRetour: () => void;
  onOuvrir: (id: string) => void;
}
const LABELS: { [k: string]: string } = {
  devis: 'Devis',
  bon_commande: 'Bon de commande',
  facture: 'Facture',
  pouvoir: 'Pouvoir',
};
function mapStatut(yousign: string): string {
  if (yousign === 'done') return 'signe';
  if (yousign === 'expired') return 'expire';
  if (yousign === 'declined' || yousign === 'canceled') return 'refuse';
  return 'en_attente';
}
export default function SuiviSignatures({ agenceId, onRetour, onOuvrir }: Props) {
  const [lignes, setLignes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifId, setVerifId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'tous' | 'attente' | 'signe'>('tous');
  useEffect(() => {
    charger();
  }, [agenceId]);
  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('signatures')
      .select('*, dossiers(id, numero_dossier, defunts(nom, prenom))')
      .eq('agence_id', agenceId)
      .order('created_at', { ascending: false });
    setLignes(data || []);
    setLoading(false);
  }
  async function verifier(ligne: any) {
    setVerifId(ligne.id);
    try {
      const { data, error } = await supabase.functions.invoke('yousign', {
        body: { action: 'statut', demande_id: ligne.demande_id },
      });
      if (!error && data && data.ok) {
        const nouveau = mapStatut(data.statut);
        const maj: any = {
          statut: nouveau,
          updated_at: new Date().toISOString(),
        };
        // SignWell renvoie le lien du PDF signé une fois le document complété
        if (data.pdf_url) maj.pdf_url = data.pdf_url;
        const { error: errMaj } = await supabase
          .from('signatures')
          .update(maj)
          .eq('id', ligne.id);
        if (errMaj) {
          alert(
            '❌ Erreur enregistrement : ' +
              errMaj.message +
              "\n\n(Souvent la colonne pdf_url qui manque dans la table signatures.)"
          );
        }
        if (!data.pdf_url) {
          alert(
            'ℹ️ SignWell n\'a pas renvoyé de lien PDF.\n\nStatut : ' +
              data.statut +
              '\nChamps disponibles : ' +
              JSON.stringify(data.debug_cles || 'non fourni')
          );
        }
        await charger();
      } else {
        alert('Impossible de vérifier le statut pour le moment.');
      }
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setVerifId(null);
  }
  const badge = (statut: string) => {
    const map: { [k: string]: { bg: string; col: string; txt: string } } = {
      signe: { bg: '#E1F5EE', col: '#0F6E56', txt: '✍️ Signé' },
      en_attente: { bg: '#FAEEDA', col: '#854F0B', txt: '⏳ En attente' },
      expire: { bg: '#FAECE7', col: '#993C1D', txt: '⌛ Expiré' },
      refuse: { bg: '#FAECE7', col: '#993C1D', txt: '✖️ Refusé' },
    };
    const s = map[statut] || map.en_attente;
    return (
      <span
        style={{
          background: s.bg,
          color: s.col,
          padding: '0.2rem 0.6rem',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        {s.txt}
      </span>
    );
  };
  const filtrees = lignes.filter((l) =>
    filtre === 'tous'
      ? true
      : filtre === 'attente'
      ? l.statut === 'en_attente'
      : l.statut === 'signe'
  );
  const compteAttente = lignes.filter((l) => l.statut === 'en_attente').length;
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>🖊️ Suivi des signatures</h2>
        <button
          onClick={charger}
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            padding: '0.4rem 0.8rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          ↻ Rafraîchir
        </button>
      </div>
      {compteAttente > 0 && (
        <div
          style={{
            background: '#FAEEDA',
            border: '1px solid #854F0B',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#854F0B',
            fontWeight: 'bold',
          }}
        >
          ⏳ {compteAttente} document(s) en attente de signature
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { k: 'tous', label: 'Tous' },
          { k: 'attente', label: 'En attente' },
          { k: 'signe', label: 'Signés' },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltre(f.k as any)}
            style={{
              padding: '0.4rem 1rem',
              border: 'none',
              borderRadius: '6px',
              background: filtre === f.k ? '#0F6E56' : '#eee',
              color: filtre === f.k ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: filtre === f.k ? 'bold' : 'normal',
              fontSize: '13px',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : filtrees.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
          Aucune signature {filtre === 'attente' ? 'en attente' : filtre === 'signe' ? 'signée' : ''} pour le moment.
        </p>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}
          >
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Défunt</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Document</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Signataire</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map((l) => {
                const def = l.dossiers?.defunts;
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 500 }}>
                        {def ? `${def.prenom || ''} ${def.nom || ''}` : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {l.dossiers?.numero_dossier || ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {LABELS[l.type_document] || l.type_document}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666' }}>
                      {l.signataire_email}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {badge(l.statut)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => verifier(l)}
                        disabled={verifId === l.id}
                        style={{
                          fontSize: '12px',
                          padding: '0.25rem 0.6rem',
                          border: '1px solid #0F6E56',
                          color: '#0F6E56',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer',
                          marginRight: '0.4rem',
                        }}
                      >
                        {verifId === l.id ? '...' : 'Vérifier'}
                      </button>
                      {l.statut === 'signe' && l.pdf_url && (
                        <a
                          href={l.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '12px',
                            padding: '0.25rem 0.6rem',
                            border: '1px solid #185FA5',
                            color: '#185FA5',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                            marginRight: '0.4rem',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          📥 PDF signé
                        </a>
                      )}
                      {l.statut === 'signe' && !l.pdf_url && (
                        <span
                          title="Cliquez sur Vérifier pour récupérer le document signé"
                          style={{
                            fontSize: '11px',
                            color: '#888',
                            marginRight: '0.4rem',
                          }}
                        >
                          (Vérifier pour le PDF)
                        </span>
                      )}
                      {l.dossiers?.id && (
                        <button
                          onClick={() => onOuvrir(l.dossiers.id)}
                          style={{
                            fontSize: '12px',
                            padding: '0.25rem 0.6rem',
                            border: '1px solid #ddd',
                            color: '#444',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Ouvrir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
