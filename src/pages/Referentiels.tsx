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
  | 'cercueils'
  | 'creusement'
  | 'prestations'
  | 'partenaires';

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
    champsForm.forEach((c) => (vide[c.key] = c.type === 'checkbox' ? false : ''));
    if (filtreColonne && filtreValeurs) vide[filtreColonne] = filtreValeurs[0];
    if (agenceScope) vide.agence_id = agenceScope;
    setForm(vide);
    setEditItem({});
    setIsNew(true);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      // Nettoyer : transformer les champs vides ('') en null
      const formNettoye: any = {};
      Object.keys(form).forEach((cle) => {
        formNettoye[cle] = form[cle] === '' ? null : form[cle];
      });
      const data = agenceScope
        ? { ...formNettoye, agence_id: agenceScope }
        : formNettoye;
      const { error } = isNew
        ? await supabase.from(table).insert(data)
        : await supabase.from(table).update(data).eq('id', editItem.id);
      if (error) {
        alert('Erreur : ' + error.message);
        setSaving(false);
        return;
      }
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
function GestionCimetieres({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="🏛️ Cimetières"
      table="cimetieres"
      onRetour={onRetour}
      agenceScope={agenceId}
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

function GestionMarbriers({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="🪨 Marbriers"
      table="marbriers"
      onRetour={onRetour}
      agenceScope={agenceId}
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

function GestionVehicules({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="🚗 Véhicules"
      table="vehicules"
      onRetour={onRetour}
      agenceScope={agenceId}
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

function GestionEmployes({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="👤 Démarcheurs & Employés"
      table="employes"
      onRetour={onRetour}
      agenceScope={agenceId}
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

function GestionCreusement({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  return (
    <TableauGenerique
      titre="⛏️ Creusement / Inhumation"
      table="prestations_creusement"
      onRetour={onRetour}
      agenceScope={agenceId}
      colonnes={[
        { key: 'libelle', label: 'Prestation', width: '60%' },
        { key: 'prix', label: 'Prix (€)', width: '20%' },
        { key: 'ordre', label: 'Ordre', width: '20%' },
      ]}
      champsForm={[
        { key: 'libelle', label: 'Libellé de la prestation' },
        { key: 'prix', label: 'Prix (€)', type: 'number' },
        { key: 'ordre', label: 'Ordre affichage', type: 'number' },
      ]}
    />
  );
}

function GestionPrestations({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  const SECTIONS = [
    '1 - Préparation / Organisation des Obsèques',
    '2 - Transport avant mise en bière',
    '3 - Cercueil & Accessoires',
    '5 - Transport du défunt après mise en bière',
    '6 - Cérémonie funéraire',
    '7A - Inhumation / Exhumation',
  ];

  const [lignes, setLignes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreSection, setFiltreSection] = useState('');
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
    const { data } = await supabase
      .from('prestations')
      .select('*')
      .eq('agence_id', agenceId)
      .order('section')
      .order('ordre');
    setLignes(data || []);
    setLoading(false);
  }

  function ouvrir(item: any) {
    setEditItem(item);
    setForm({ ...item });
    setIsNew(false);
  }

  function nouveau() {
    setForm({
      libelle: '',
      section: filtreSection || SECTIONS[0],
      prix: '',
      tva: 'tva_20',
      ordre: '',
      agence_id: agenceId,
    });
    setEditItem({});
    setIsNew(true);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const data: any = {
        libelle: form.libelle,
        section: form.section,
        prix: form.prix === '' ? null : form.prix,
        tva: form.tva,
        ordre: form.ordre === '' ? null : form.ordre,
        agence_id: agenceId,
      };
      const { error } = isNew
        ? await supabase.from('prestations').insert(data)
        : await supabase.from('prestations').update(data).eq('id', editItem.id);
      if (error) {
        alert('Erreur : ' + error.message);
        setSaving(false);
        return;
      }
      await charger();
      setEditItem(null);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setSaving(false);
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return;
    await supabase.from('prestations').delete().eq('id', id);
    await charger();
  }

  const tvaLabel = (tva: string) =>
    tva === 'tva_20'
      ? 'TVA 20%'
      : tva === 'tva_10'
      ? 'TVA 10%'
      : 'Exonéré';

  // Filtrage (section + recherche)
  const lignesFiltrees = lignes.filter((l) => {
    if (filtreSection && l.section !== filtreSection) return false;
    if (
      recherche &&
      !String(l.libelle || '')
        .toLowerCase()
        .includes(recherche.toLowerCase())
    )
      return false;
    return true;
  });

  // Regroupement par section
  const sectionsAffichees = filtreSection ? [filtreSection] : SECTIONS;

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
  };

  // ----- ÉCRAN ÉDITION -----
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
            {isNew ? '➕ Nouvelle prestation' : '✏️ Modifier la prestation'}
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
          <label style={{ fontSize: '13px', fontWeight: '500' }}>
            Libellé de la prestation
          </label>
          <input
            value={form.libelle || ''}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, libelle: e.target.value }))
            }
            style={inputStyle}
          />
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '13px', fontWeight: '500' }}>
              Section
            </label>
            <select
              value={form.section || ''}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, section: e.target.value }))
              }
              style={inputStyle}
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Prix TTC (€)
              </label>
              <input
                type="number"
                value={form.prix ?? ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, prix: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>TVA</label>
              <select
                value={form.tva || 'tva_20'}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, tva: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="tva_20">TVA 20%</option>
                <option value="tva_10">TVA 10%</option>
                <option value="exonere">Exonéré</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Ordre
              </label>
              <input
                type="number"
                value={form.ordre ?? ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, ordre: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
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

  // ----- ÉCRAN LISTE -----
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
          📋 Prestations & Tarifs ({lignesFiltrees.length})
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

      {/* Filtre + recherche */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <select
          value={filtreSection}
          onChange={(e) => setFiltreSection(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <option value="">📂 Toutes les sections</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="🔍 Rechercher une prestation..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        sectionsAffichees.map((section) => {
          const lignesSection = lignesFiltrees.filter(
            (l) => l.section === section
          );
          if (lignesSection.length === 0) return null;
          return (
            <div key={section} style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  background: '#4F46E5',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {section} ({lignesSection.length})
              </div>
              <div
                style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden',
                }}
              >
                {lignesSection.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <div style={{ fontSize: '13px' }}>{l.libelle}</div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#0F6E56',
                        minWidth: '70px',
                        textAlign: 'right',
                      }}
                    >
                      {l.prix > 0 ? `${l.prix} €` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#888',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}
                    >
                      {tvaLabel(l.tva)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => ouvrir(l)}
                        style={{
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================
// PARTENAIRES (Assurances, Associations...)
// ============================================
function GestionPartenaires({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  // Écran tarifs d'un partenaire (null = liste)
  const [tarifsDe, setTarifsDe] = useState<any>(null);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('partenaires')
      .select('*')
      .eq('agence_id', agenceId)
      .order('nom');
    setPartenaires(data || []);
    setLoading(false);
  }

  function ouvrir(item: any) {
    setEditItem(item);
    setForm({ ...item });
    setIsNew(false);
  }

  function nouveau() {
    setForm({
      nom: '',
      type: 'assurance',
      adresse: '',
      telephone: '',
      email: '',
      contact: '',
      conditions: '',
      actif: true,
      agence_id: agenceId,
    });
    setEditItem({});
    setIsNew(true);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const data: any = {
        nom: form.nom || null,
        type: form.type || null,
        adresse: form.adresse || null,
        telephone: form.telephone || null,
        email: form.email || null,
        contact: form.contact || null,
        conditions: form.conditions || null,
        actif: form.actif !== false,
        agence_id: agenceId,
      };
      const { error } = isNew
        ? await supabase.from('partenaires').insert(data)
        : await supabase.from('partenaires').update(data).eq('id', editItem.id);
      if (error) {
        alert('Erreur : ' + error.message);
        setSaving(false);
        return;
      }
      await charger();
      setEditItem(null);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setSaving(false);
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce partenaire ? Ses tarifs seront aussi supprimés.'))
      return;
    await supabase.from('partenaires').delete().eq('id', id);
    await charger();
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
  };

  // ----- ÉCRAN TARIFS D'UN PARTENAIRE -----
  if (tarifsDe) {
    return (
      <TarifsPartenaire
        partenaire={tarifsDe}
        agenceId={agenceId}
        onRetour={() => setTarifsDe(null)}
      />
    );
  }

  // ----- ÉCRAN ÉDITION FICHE -----
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
            {isNew ? '➕ Nouveau partenaire' : '✏️ Modifier le partenaire'}
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
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Nom du partenaire
              </label>
              <input
                value={form.nom || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, nom: e.target.value }))
                }
                style={inputStyle}
                placeholder="ex: ANUBIS"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Type
              </label>
              <select
                value={form.type || 'assurance'}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, type: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="assurance">Assurance</option>
                <option value="association">Association</option>
                <option value="mutuelle">Mutuelle</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Adresse
              </label>
              <input
                value={form.adresse || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, adresse: e.target.value }))
                }
                style={inputStyle}
                placeholder="ex: 43 rue de Liège, 75008 Paris"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Téléphone
              </label>
              <input
                value={form.telephone || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, telephone: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Email
              </label>
              <input
                value={form.email || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, email: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Nom du contact
              </label>
              <input
                value={form.contact || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, contact: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>
                Conditions (prix au km, forfaits, règles...)
              </label>
              <textarea
                value={form.conditions || ''}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, conditions: e.target.value }))
                }
                style={{ ...inputStyle, height: '80px' }}
                placeholder="ex: Frais kilométriques 1,20€/km au-delà de 60 km..."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <input
                type="checkbox"
                checked={form.actif !== false}
                onChange={(e) =>
                  setForm((p: any) => ({ ...p, actif: e.target.checked }))
                }
              />
              <span style={{ marginLeft: '0.5rem', fontSize: '13px' }}>
                Partenaire actif
              </span>
            </div>
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

  // ----- ÉCRAN LISTE -----
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
          🤝 Partenaires ({partenaires.length})
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

      {loading ? (
        <p>Chargement...</p>
      ) : partenaires.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
          Aucun partenaire. Cliquez sur "Ajouter" pour créer ANUBIS.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {partenaires.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                  🤝 {p.nom}
                  {p.actif === false && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '11px',
                        color: '#999',
                      }}
                    >
                      (inactif)
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}
                >
                  {p.type} {p.telephone ? `— ${p.telephone}` : ''}
                </div>
              </div>
              <button
                onClick={() => setTarifsDe(p)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#FAEEDA',
                  color: '#854F0B',
                  border: '1px solid #854F0B',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                💰 Tarifs
              </button>
              <button
                onClick={() => ouvrir(p)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => supprimer(p.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#FAECE7',
                  color: '#993C1D',
                  border: '1px solid #993C1D',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// TARIFS D'UN PARTENAIRE
// ============================================
function TarifsPartenaire({
  partenaire,
  agenceId,
  onRetour,
}: {
  partenaire: any;
  agenceId: string;
  onRetour: () => void;
}) {
  const [prestations, setPrestations] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'reference' | 'libre'>('reference');
  const [prestationChoisie, setPrestationChoisie] = useState('');
  const [libelleLibre, setLibelleLibre] = useState('');
  const [tvaLibre, setTvaLibre] = useState('tva_20');
  const [categorieLibre, setCategorieLibre] = useState(
    'prestations_non_obligatoires'
  );
  const [prixSaisi, setPrixSaisi] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);
    // Toutes les prestations du référentiel (tarif normal)
    const { data: prestas } = await supabase
      .from('prestations')
      .select('*')
      .eq('agence_id', agenceId)
      .order('section')
      .order('ordre');
    setPrestations(prestas || []);
    // Les tarifs déjà définis pour ce partenaire
    const { data: tarifsData } = await supabase
      .from('tarifs_partenaires')
      .select('*')
      .eq('partenaire_id', partenaire.id);
    setTarifs(tarifsData || []);
    setLoading(false);
  }

  // Prestations pas encore tarifées pour ce partenaire (pour le menu déroulant)
  const dejaTarifees = tarifs.map((t) => t.prestation_id);
  const prestationsDispo = prestations.filter(
    (p) => !dejaTarifees.includes(p.id)
  );

  async function ajouterTarif() {
    if (mode === 'reference' && !prestationChoisie) {
      alert('Choisissez une prestation.');
      return;
    }
    if (mode === 'libre' && !libelleLibre.trim()) {
      alert('Saisissez le texte de la ligne libre.');
      return;
    }
    setSaving(true);
    const ligne: any = {
      agence_id: agenceId,
      partenaire_id: partenaire.id,
      prix: prixSaisi === '' ? 0 : parseFloat(prixSaisi),
    };
    if (mode === 'reference') {
      ligne.prestation_id = prestationChoisie;
    } else {
      ligne.libelle_libre = libelleLibre.trim();
      ligne.tva = tvaLibre;
      ligne.categorie = categorieLibre;
    }
    const { error } = await supabase.from('tarifs_partenaires').insert(ligne);
    if (error) {
      alert('Erreur : ' + error.message);
      setSaving(false);
      return;
    }
    setPrestationChoisie('');
    setLibelleLibre('');
    setTvaLibre('tva_20');
    setCategorieLibre('prestations_non_obligatoires');
    setPrixSaisi('');
    await charger();
    setSaving(false);
  }

  async function modifierPrix(tarifId: string, nouveauPrix: string) {
    await supabase
      .from('tarifs_partenaires')
      .update({ prix: nouveauPrix === '' ? 0 : parseFloat(nouveauPrix) })
      .eq('id', tarifId);
    await charger();
  }

  async function supprimerTarif(tarifId: string) {
    if (!confirm('Retirer ce tarif ?')) return;
    await supabase.from('tarifs_partenaires').delete().eq('id', tarifId);
    await charger();
  }

  // Affichage : gère prestation du référentiel OU ligne libre
  function libelleTarif(t: any) {
    if (t.libelle_libre) return t.libelle_libre;
    const p = prestations.find((x) => x.id === t.prestation_id);
    return p ? p.libelle : '(prestation supprimée)';
  }
  function sousTitreTarif(t: any) {
    if (t.libelle_libre) {
      return t.categorie === 'prestations_obligatoires'
        ? 'Ligne libre — obligatoire'
        : 'Ligne libre — non-obligatoire';
    }
    const p = prestations.find((x) => x.id === t.prestation_id);
    return p ? p.section : '';
  }
  function prixNormalTarif(t: any) {
    if (t.libelle_libre) return null; // pas de prix normal pour une ligne libre
    const p = prestations.find((x) => x.id === t.prestation_id);
    return p ? p.prix : null;
  }
  function libelleTva(tva: string) {
    return tva === 'tva_20'
      ? 'TVA 20%'
      : tva === 'tva_10'
      ? 'TVA 10%'
      : 'Exonéré';
  }
  function tvaTarif(t: any) {
    if (t.libelle_libre) return libelleTva(t.tva);
    const p = prestations.find((x) => x.id === t.prestation_id);
    return p ? libelleTva(p.tva) : '';
  }

  const inputStyle = {
    padding: '0.6rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>💰 Tarifs — {partenaire.nom}</h2>
      </div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '1.5rem' }}>
        Indiquez ici les prestations et leurs prix spécifiques à{' '}
        {partenaire.nom}. Seules les prestations ajoutées ici utiliseront le
        tarif {partenaire.nom}.
      </p>

      {/* Bloc ajout */}
      <div
        style={{
          background: '#FAEEDA',
          border: '1px solid #854F0B',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            color: '#854F0B',
            marginBottom: '0.75rem',
            fontSize: '14px',
          }}
        >
          ➕ Ajouter un tarif {partenaire.nom}
        </div>

        {/* Choix du mode */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => setMode('reference')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid #854F0B',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              background: mode === 'reference' ? '#854F0B' : 'white',
              color: mode === 'reference' ? 'white' : '#854F0B',
            }}
          >
            📋 Depuis le référentiel
          </button>
          <button
            onClick={() => setMode('libre')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid #854F0B',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              background: mode === 'libre' ? '#854F0B' : 'white',
              color: mode === 'libre' ? 'white' : '#854F0B',
            }}
          >
            ✍️ Ligne libre
          </button>
        </div>

        {mode === 'reference' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px auto',
              gap: '0.75rem',
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ fontSize: '12px', color: '#854F0B' }}>
                Prestation
              </label>
              <select
                value={prestationChoisie}
                onChange={(e) => setPrestationChoisie(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="">-- Choisir une prestation --</option>
                {prestationsDispo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.libelle} (normal : {p.prix || 0} €)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#854F0B' }}>
                Prix {partenaire.nom} TTC (€)
              </label>
              <input
                type="number"
                value={prixSaisi}
                onChange={(e) => setPrixSaisi(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
                placeholder="0"
              />
            </div>
            <button
              onClick={ajouterTarif}
              disabled={saving}
              style={{
                padding: '0.6rem 1.25rem',
                background: saving ? '#ccc' : '#854F0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                height: 'fit-content',
              }}
            >
              {saving ? '⏳' : 'Ajouter'}
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: '#854F0B' }}>
                  Texte de la ligne
                </label>
                <input
                  value={libelleLibre}
                  onChange={(e) => setLibelleLibre(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="ex: Cercueil ANUBIS"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#854F0B' }}>
                  Catégorie (colonne du devis)
                </label>
                <select
                  value={categorieLibre}
                  onChange={(e) => setCategorieLibre(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="prestations_obligatoires">
                    Prestation obligatoire
                  </option>
                  <option value="prestations_non_obligatoires">
                    Prestation non-obligatoire
                  </option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 120px auto',
                gap: '0.75rem',
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: '#854F0B' }}>
                  Prix TTC (€)
                </label>
                <input
                  type="number"
                  value={prixSaisi}
                  onChange={(e) => setPrixSaisi(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#854F0B' }}>
                  TVA
                </label>
                <select
                  value={tvaLibre}
                  onChange={(e) => setTvaLibre(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="tva_20">TVA 20%</option>
                  <option value="tva_10">TVA 10%</option>
                  <option value="exonere">Exonéré</option>
                </select>
              </div>
              <button
                onClick={ajouterTarif}
                disabled={saving}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: saving ? '#ccc' : '#854F0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  height: 'fit-content',
                }}
              >
                {saving ? '⏳' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}
        {mode === 'reference' &&
          prestationsDispo.length === 0 &&
          prestations.length > 0 && (
            <div
              style={{ fontSize: '12px', color: '#854F0B', marginTop: '0.5rem' }}
            >
              Toutes les prestations du référentiel ont déjà un tarif{' '}
              {partenaire.nom}. Utilisez "Ligne libre" pour en ajouter d'autres.
            </div>
          )}
      </div>

      {/* Liste des tarifs définis */}
      {loading ? (
        <p>Chargement...</p>
      ) : tarifs.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>
          Aucun tarif {partenaire.nom} défini pour l'instant.
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 90px 100px auto',
              gap: '1rem',
              padding: '0.6rem 1rem',
              background: '#f9f9f9',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
            }}
          >
            <div>Prestation</div>
            <div style={{ textAlign: 'right' }}>Normal TTC</div>
            <div style={{ textAlign: 'center' }}>TVA</div>
            <div style={{ textAlign: 'right' }}>{partenaire.nom} TTC</div>
            <div></div>
          </div>
          {tarifs.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 90px 100px auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.6rem 1rem',
                borderTop: '1px solid #f5f5f5',
              }}
            >
              <div style={{ fontSize: '13px' }}>
                {libelleTarif(t)}
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                  {sousTitreTarif(t)}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '13px',
                  color: '#999',
                }}
              >
                {prixNormalTarif(t) !== null
                  ? `${prixNormalTarif(t)} €`
                  : '—'}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#666',
                }}
              >
                {tvaTarif(t)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  defaultValue={t.prix}
                  onBlur={(e) => modifierPrix(t.id, e.target.value)}
                  style={{
                    width: '90px',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#854F0B',
                  }}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => supprimerTarif(t.id)}
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
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: '12px', color: '#999', marginTop: '1rem' }}>
        💡 Astuce : modifiez un prix en cliquant dans la case et en cliquant
        ailleurs pour valider.
      </p>
    </div>
  );
}

function GestionTarifsRapatriement({
  onRetour,
  agenceId,
}: {
  onRetour: () => void;
  agenceId: string;
}) {
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
      .eq('agence_id', agenceId)
      .order('ordre');
    setTarifs(data || []);
    setLoading(false);
  }

  async function sauvegarder(id: string | null) {
    const data = { ...form, agence_id: agenceId };
    if (id)
      await supabase.from('tarifs_rapatriement').update(data).eq('id', id);
    else await supabase.from('tarifs_rapatriement').insert(data);
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
    return (
      <GestionCimetieres
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );
  if (section === 'marbriers')
    return (
      <GestionMarbriers
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );
  if (section === 'tarifs_rapatriement')
    return (
      <GestionTarifsRapatriement
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );
  if (section === 'vehicules')
    return (
      <GestionVehicules
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );
  if (section === 'employes')
    return (
      <GestionEmployes
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );
  if (section === 'cercueils')
    return (
      <GestionCercueils
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );

  if (section === 'creusement')
    return (
      <GestionCreusement
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );

  if (section === 'prestations')
    return (
      <GestionPrestations
        onRetour={() => setSection('menu')}
        agenceId={agenceId}
      />
    );

  if (section === 'partenaires')
    return (
      <GestionPartenaires
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
            desc: 'Billets, transport, zinc & housses par destination',
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
          {
            key: 'creusement',
            emoji: '⛏️',
            label: 'Creusement / Inhumation',
            desc: 'Prestations de creusement et tarifs',
          },
          {
            key: 'prestations',
            emoji: '📋',
            label: 'Prestations & Tarifs',
            desc: 'Prix des démarches, transports, coffrets...',
          },
          {
            key: 'partenaires',
            emoji: '🤝',
            label: 'Partenaires',
            desc: 'Assurances, associations & tarifs négociés',
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
