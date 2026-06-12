import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Props {
  onRetour: () => void;
  agenceId: string;
}

type Section =
  | 'menu'
  | 'cimetieres'
  | 'marbriers'
  | 'tarifs_rapatriement'
  | 'vehicules'
  | 'employes'
  | 'cercueils';

// ============================================
// COMPOSANT GÉNÉRIQUE
// ============================================
function TableauGenerique({
  titre,
  colonnes,
  table,
  champsForm,
  onRetour,
  filtreColonne,
  filtreValeurs,
  agenceScope,
}: {
  titre: string;
  colonnes: { key: string; label: string; width?: string }[];
  table: string;
  champsForm: {
    key: string;
    label: string;
    type?: string;
    options?: string[];
  }[];
  onRetour: () => void;
  filtreColonne?: string;
  filtreValeurs?: string[];
  agenceScope?: string;
}) {
  const [lignes, setLignes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);
    let query = supabase.from(table).select('*').order(colonnes[0].key);
    if (filtreColonne && filtreValeurs)
      query = query.in(filtreColonne, filtreValeurs);
    if (agenceScope) query = query.eq('agence_id', agenceScope);
    const { data } = await query;
    setLignes(data || []);
    setLoading(false);
  }

  function ouvrir(item: any) {
    setEditItem(item);
    setForm({ ...item });
    setIsNew(false);
  }

  function nouveau() {
    const vide: any = {};
    champsForm.forEach((c) => (vide[c.key] = ''));
    if (filtreColonne && filtreValeurs) vide[filtreColonne] = filtreValeurs[0];
    if (agenceScope) vide.agence_id = agenceScope;
    setForm(vide);
    setEditItem({});
    setIsNew(true);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const data = agenceScope ? { ...form, agence_id: agenceScope } : form;
      if (isNew) await supabase.from(table).insert(data);
      else await supabase.from(table).update(data).eq('id', editItem.id);
      await charger();
      setEditItem(null);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setSaving(false);
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return;
    await supabase.from(table).delete().eq('id', id);
    await charger();
  }

  const filtres = lignes.filter((l) => {
    if (!recherche) return true;
    return colonnes.some((c) =>
      String(l[c.key] || '')
        .toLowerCase()
        .includes(recherche.toLowerCase())
    );
  });

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
  };

  if (editItem !== null) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <button onClick={() => setEditItem(null)}>← Retour</button>
          <h2 style={{ margin: 0 }}>
            {isNew ? `➕ Nouveau — ${titre}` : `✏️ Modifier — ${titre}`}
          </h2>
        </div>
        <div
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            {champsForm.map((c) => (
              <div
                key={c.key}
                style={{
                  gridColumn: c.type === 'textarea' ? '1 / -1' : 'auto',
                }}
              >
                <label style={{ fontSize: '13px', fontWeight: '500' }}>
                  {c.label}
                </label>
                {c.type === 'textarea' ? (
                  <textarea
                    value={form[c.key] || ''}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, [c.key]: e.target.value }))
                    }
                    style={{ ...inputStyle, height: '80px' }}
                  />
                ) : c.type === 'select' && c.options ? (
                  <select
                    value={form[c.key] || ''}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, [c.key]: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">--</option>
                    {c.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : c.type === 'number' ? (
                  <input
                    type="number"
                    value={form[c.key] || ''}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, [c.key]: e.target.value }))
                    }
                    style={inputStyle}
                  />
                ) : c.type === 'checkbox' ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={!!form[c.key]}
                      onChange={(e) =>
                        setForm((p: any) => ({
                          ...p,
                          [c.key]: e.target.checked,
                        }))
                      }
                    />
                    <span style={{ marginLeft: '0.5rem', fontSize: '13px' }}>
                      Oui
                    </span>
                  </div>
                ) : (
                  <input
                    value={form[c.key] || ''}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, [c.key]: e.target.value }))
                    }
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={sauvegarder}
            disabled={saving}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.75rem',
              background: saving ? '#ccc' : '#0F6E56',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {saving ? '⏳...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    );
  }

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
        <h2 style={{ margin: 0 }}>
          {titre} ({filtres.length})
        </h2>
        <button
          onClick={nouveau}
          style={{
            marginLeft: 'auto',
            padding: '0.5rem 1rem',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ➕ Ajouter
        </button>
      </div>
      <input
        placeholder="🔍 Rechercher..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxSizing: 'border-box' as const,
        }}
      />
      {loading ? (
        <p>Chargement...</p>
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
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                {colonnes.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #eee',
                      width: c.width,
                    }}
                  >
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: '0.75rem 1rem', width: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((l) => (
                <tr
                  key={l.id}
                  style={{ borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#fafafa')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'white')
                  }
                >
                  {colonnes.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: '0.75rem 1rem',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {typeof l[c.key] === 'boolean'
                        ? l[c.key]
                          ? '✅'
                          : '—'
                        : l[c.key] || '—'}
                    </td>
                  ))}
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => ouvrir(l)}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: '#4F46E5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => supprimer(l.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#FAECE7',
                        color: '#993C1D',
                        border: '1px solid #993C1D',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filtres.length === 0 && (
                <tr>
                  <td
                    colSpan={colonnes.length + 1}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#999',
                    }}
                  >
                    Aucune entrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTIONS SPÉCIFIQUES
// ============================================
function GestionCimetieres({ onRetour }: { onRetour: () => void }) {
  return (
    <TableauGenerique
      titre="🏛️ Cimetières"
      table="cimetieres"
      onRetour={onRetour}
      colonnes={[
        { key: 'nom', label: 'Nom', width: '25%' },
        { key: 'ville', label: 'Ville', width: '15%' },
        { key: 'telephone', label: 'Téléphone', width: '15%' },
        { key: 'tarif_30ans_adulte', label: '30 ans adulte', width: '12%' },
        { key: 'semelle_imposee', label: 'Semelle', width: '10%' },
      ]}
      champsForm={[
        { key: 'nom', label: 'Nom' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'code_postal', label: 'Code postal' },
        { key: 'ville', label: 'Ville' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'fax', label: 'Fax' },
        { key: 'email', label: 'Email' },
        { key: 'horaires', label: 'Horaires', type: 'textarea' },
        { key: 'contact_nom', label: 'Contact nom' },
        { key: 'contact_telephone', label: 'Contact téléphone' },
        {
          key: 'tarif_10ans_adulte',
          label: '10 ans adulte (€)',
          type: 'number',
        },
        {
          key: 'tarif_15ans_adulte',
          label: '15 ans adulte (€)',
          type: 'number',
        },
        {
          key: 'tarif_30ans_adulte',
          label: '30 ans adulte (€)',
          type: 'number',
        },
        {
          key: 'tarif_50ans_adulte',
          label: '50 ans adulte (€)',
          type: 'number',
        },
        {
          key: 'tarif_perpet_adulte',
          label: 'Perpétuelle adulte (€)',
          type: 'number',
        },
        {
          key: 'tarif_10ans_enfant',
          label: '10 ans enfant (€)',
          type: 'number',
        },
        {
          key: 'tarif_15ans_enfant',
          label: '15 ans enfant (€)',
          type: 'number',
        },
        {
          key: 'tarif_30ans_enfant',
          label: '30 ans enfant (€)',
          type: 'number',
        },
        {
          key: 'tarif_50ans_enfant',
          label: '50 ans enfant (€)',
          type: 'number',
        },
        {
          key: 'tarif_perpet_enfant',
          label: 'Perpétuelle enfant (€)',
          type: 'number',
        },
        { key: 'semelle_imposee', label: 'Semelle imposée', type: 'checkbox' },
        {
          key: 'fausse_case_imposee',
          label: 'Fausse case imposée',
          type: 'checkbox',
        },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}

function GestionMarbriers({ onRetour }: { onRetour: () => void }) {
  return (
    <TableauGenerique
      titre="🪨 Marbriers"
      table="marbriers"
      onRetour={onRetour}
      colonnes={[
        { key: 'nom', label: 'Nom', width: '30%' },
        { key: 'ville', label: 'Ville', width: '20%' },
        { key: 'telephone', label: 'Téléphone', width: '20%' },
        { key: 'email', label: 'Email', width: '20%' },
      ]}
      champsForm={[
        { key: 'nom', label: 'Nom' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'code_postal', label: 'Code postal' },
        { key: 'ville', label: 'Ville' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'fax', label: 'Fax' },
        { key: 'email', label: 'Email' },
        { key: 'contact_nom', label: 'Contact nom' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}

function GestionVehicules({ onRetour }: { onRetour: () => void }) {
  return (
    <TableauGenerique
      titre="🚗 Véhicules"
      table="vehicules"
      onRetour={onRetour}
      colonnes={[
        { key: 'immatriculation', label: 'Immatriculation', width: '20%' },
        { key: 'marque', label: 'Marque', width: '20%' },
        { key: 'modele', label: 'Modèle', width: '20%' },
        { key: 'type_vehicule', label: 'Type', width: '20%' },
      ]}
      champsForm={[
        { key: 'immatriculation', label: 'Immatriculation' },
        { key: 'marque', label: 'Marque' },
        { key: 'modele', label: 'Modèle' },
        {
          key: 'type_vehicule',
          label: 'Type',
          type: 'select',
          options: ['corbillard', 'fourgon', 'berline', 'utilitaire', 'autre'],
        },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}

function GestionEmployes({ onRetour }: { onRetour: () => void }) {
  return (
    <TableauGenerique
      titre="👤 Démarcheurs & Employés"
      table="employes"
      onRetour={onRetour}
      colonnes={[
        { key: 'nom', label: 'Nom', width: '20%' },
        { key: 'prenom', label: 'Prénom', width: '20%' },
        { key: 'poste', label: 'Poste', width: '20%' },
        { key: 'telephone', label: 'Téléphone', width: '20%' },
        { key: 'actif', label: 'Actif', width: '10%' },
      ]}
      champsForm={[
        { key: 'nom', label: 'Nom' },
        { key: 'prenom', label: 'Prénom' },
        {
          key: 'poste',
          label: 'Poste',
          type: 'select',
          options: [
            'démarcheur',
            'porteur',
            'chauffeur',
            'conseiller',
            'gérant',
            'autre',
          ],
        },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'actif', label: 'Actif', type: 'checkbox' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}

function GestionCercueils({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="⚰️ Catalogue cercueils"
      table="catalogue_cercueils"
      onRetour={onRetour}
      agenceScope={agenceId}
      colonnes={[
        { key: 'nom', label: 'Nom', width: '25%' },
        { key: 'matiere', label: 'Matière', width: '15%' },
        { key: 'type', label: 'Type', width: '10%' },
        { key: 'dimensions', label: 'Dimensions', width: '15%' },
        { key: 'prix_ttc', label: 'Prix TTC', width: '10%' },
        { key: 'actif', label: 'Actif', width: '8%' },
      ]}
      champsForm={[
        { key: 'nom', label: 'Nom' },
        { key: 'description', label: 'Description', type: 'textarea' },
        {
          key: 'matiere',
          label: 'Matière',
          type: 'select',
          options: ['peuplier', 'chêne', 'pin', 'acajou', 'zinc', 'autre'],
        },
        {
          key: 'type',
          label: 'Type',
          type: 'select',
          options: [
            'adulte',
            'enfant',
            'hors_gabarit',
            'tombeau',
            'enveloppe',
            'accessoire',
            'autre',
          ],
        },
        { key: 'dimensions', label: 'Dimensions (ex: 200x60x45)' },
        { key: 'taille_min', label: 'Taille min (cm)', type: 'number' },
        { key: 'taille_max', label: 'Taille max (cm)', type: 'number' },
        { key: 'prix_ht', label: 'Prix HT (€)', type: 'number' },
        { key: 'prix_ttc', label: 'Prix TTC (€)', type: 'number' },
        { key: 'tva', label: 'TVA (%)', type: 'number' },
        { key: 'ordre', label: 'Ordre affichage', type: 'number' },
        { key: 'actif', label: 'Actif', type: 'checkbox' },
      ]}
    />
  );
}

function GestionTarifsRapatriement({ onRetour }: { onRetour: () => void }) {
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [ajout, setAjout] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('tarifs_rapatriement')
      .select('*')
      .order('ordre');
    setTarifs(data || []);
    setLoading(false);
  }

  async function sauvegarder(id: string | null) {
    if (id)
      await supabase.from('tarifs_rapatriement').update(form).eq('id', id);
    else await supabase.from('tarifs_rapatriement').insert(form);
    setEditId(null);
    setAjout(false);
    setForm({});
    charger();
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce tarif ?')) return;
    await supabase.from('tarifs_rapatriement').delete().eq('id', id);
    charger();
  }

  const champs = [
    { key: 'label', label: 'Destination', type: 'text' },
    { key: 'compagnie', label: 'Compagnie', type: 'text' },
    { key: 'aeroport_depart', label: 'Aéroport départ', type: 'text' },
    { key: 'billet_adulte', label: 'Billet adulte (€)', type: 'number' },
    { key: 'billet_enfant', label: 'Billet enfant (€)', type: 'number' },
    {
      key: 'billet_adulte_anubis',
      label: 'Billet adulte Anubis (€)',
      type: 'number',
    },
    {
      key: 'billet_adulte_skymaster',
      label: 'Billet adulte Skymaster (€)',
      type: 'number',
    },
    {
      key: 'billet_enfant_skymaster',
      label: 'Billet enfant Skymaster (€)',
      type: 'number',
    },
    { key: 'cercueil_adulte', label: 'Cercueil adulte (€)', type: 'number' },
    { key: 'cercueil_enfant', label: 'Cercueil enfant (€)', type: 'number' },
    {
      key: 'cercueil_hors_gabarit',
      label: 'Cercueil hors gabarit (€)',
      type: 'number',
    },
    { key: 'cercueil_tombeau', label: 'Cercueil tombeau (€)', type: 'number' },
    {
      key: 'cercueil_enveloppe',
      label: 'Cercueil enveloppe (€)',
      type: 'number',
    },
    {
      key: 'transport_avant_meb_adulte',
      label: 'Transport avant MEB adulte (€)',
      type: 'number',
    },
    {
      key: 'transport_avant_meb_enfant',
      label: 'Transport avant MEB enfant (€)',
      type: 'number',
    },
    {
      key: 'transport_apres_meb_adulte',
      label: 'Transport après MEB adulte (€)',
      type: 'number',
    },
    {
      key: 'transport_apres_meb_enfant',
      label: 'Transport après MEB enfant (€)',
      type: 'number',
    },
    { key: 'zinc', label: 'Zinc (€)', type: 'number' },
    { key: 'housse_cercueil', label: 'Housse cercueil (€)', type: 'number' },
    {
      key: 'housse_cercueil_air_france',
      label: 'Housse cercueil Air France (€)',
      type: 'number',
    },
    { key: 'housse_mortuaire', label: 'Housse mortuaire (€)', type: 'number' },
    { key: 'diagnos', label: 'Diagnos en compagnie (€)', type: 'number' },
    {
      key: 'frais_depositoire_1nuit',
      label: 'Dépositoire 1 nuit (€)',
      type: 'number',
    },
    {
      key: 'frais_depositoire_2nuits',
      label: 'Dépositoire 2 nuits (€)',
      type: 'number',
    },
    {
      key: 'frais_depositoire_3nuits',
      label: 'Dépositoire 3 nuits (€)',
      type: 'number',
    },
    { key: 'ambulance_pays', label: 'Ambulance pays', type: 'text' },
    { key: 'ordre', label: 'Ordre', type: 'number' },
  ];

  const inputStyle = {
    width: '100%',
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
  };

  const renderForm = (id: string | null) => (
    <div
      style={{
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid #4F46E5',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {champs.map((c) => (
          <div key={c.key}>
            <label style={{ fontSize: '12px', color: '#666' }}>{c.label}</label>
            <input
              type={c.type}
              value={form[c.key] ?? ''}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  [c.key]:
                    c.type === 'number'
                      ? parseFloat(e.target.value) || 0
                      : e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          onClick={() => sauvegarder(id)}
          style={{
            padding: '0.5rem 1rem',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          💾 Sauvegarder
        </button>
        <button
          onClick={() => {
            setEditId(null);
            setAjout(false);
            setForm({});
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#eee',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>✈️ Tarifs Rapatriement ({tarifs.length})</h2>
        <button
          onClick={() => {
            setAjout(true);
            setForm({});
            setEditId(null);
          }}
          style={{
            marginLeft: 'auto',
            padding: '0.5rem 1rem',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Ajouter
        </button>
      </div>
      {ajout && renderForm(null)}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        tarifs.map((t) => (
          <div
            key={t.id}
            style={{
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '0.75rem',
              background: 'white',
            }}
          >
            {editId === t.id ? (
              renderForm(t.id)
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                    ✈️ {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      marginTop: '0.25rem',
                    }}
                  >
                    {t.compagnie} — {t.aeroport_depart}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {t.billet_adulte > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          background: '#EEF2FF',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#4F46E5',
                        }}
                      >
                        Adulte : {t.billet_adulte} €
                      </span>
                    )}
                    {t.billet_enfant > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          background: '#E1F5EE',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#0F6E56',
                        }}
                      >
                        Enfant : {t.billet_enfant} €
                      </span>
                    )}
                    {t.billet_adulte_anubis > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          background: '#FAEEDA',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#854F0B',
                        }}
                      >
                        Anubis : {t.billet_adulte_anubis} €
                      </span>
                    )}
                    {t.billet_adulte_skymaster > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          background: '#FAECE7',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#993C1D',
                        }}
                      >
                        Skymaster : {t.billet_adulte_skymaster} €
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#f0f0f0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      Cercueil : {t.cercueil_adulte} €
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        background: '#f0f0f0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      Zinc : {t.zinc} €
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setEditId(t.id);
                      setForm(t);
                      setAjout(false);
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#EEF2FF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#4F46E5',
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => supprimer(t.id)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#FAECE7',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#993C1D',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function Referentiels({ onRetour, agenceId }: Props) {
  const [section, setSection] = useState<Section>('menu');

  if (section === 'cimetieres')
    return <GestionCimetieres onRetour={() => setSection('menu')} />;
  if (section === 'marbriers')
    return <GestionMarbriers onRetour={() => setSection('menu')} />;
  if (section === 'tarifs_rapatriement')
    return <GestionTarifsRapatriement onRetour={() => setSection('menu')} />;
  if (section === 'vehicules')
    return <GestionVehicules onRetour={() => setSection('menu')} />;
  if (section === 'employes')
    return <GestionEmployes onRetour={() => setSection('menu')} />;
  if (section === 'cercueils')
    return (
      <GestionCercueils
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>📚 Référentiels</h2>
      </div>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Gérez toutes vos bases de données directement depuis l'application.
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        {[
          {
            key: 'cimetieres',
            emoji: '🏛️',
            label: 'Cimetières',
            desc: 'Tarifs de concession, adresses, horaires',
          },
          {
            key: 'marbriers',
            emoji: '🪨',
            label: 'Marbriers',
            desc: 'Contacts, adresses',
          },
          {
            key: 'tarifs_rapatriement',
            emoji: '✈️',
            label: 'Tarifs Rapatriement',
            desc: 'Billets, cercueils, transport par destination',
          },
          {
            key: 'vehicules',
            emoji: '🚗',
            label: 'Véhicules',
            desc: 'Immatriculations, marques, modèles',
          },
          {
            key: 'employes',
            emoji: '👤',
            label: 'Démarcheurs & Employés',
            desc: 'Contacts, postes, téléphones',
          },
          {
            key: 'cercueils',
            emoji: '⚰️',
            label: 'Catalogue cercueils',
            desc: 'Prix, dimensions, matières',
          },
        ].map((s) => (
          <div
            key={s.key}
            onClick={() => setSection(s.key as Section)}
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
              {s.label}
            </div>
            <div
              style={{ fontSize: '13px', color: '#888', marginTop: '0.25rem' }}
            >
              {s.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
