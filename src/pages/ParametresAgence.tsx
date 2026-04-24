import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

interface Props {
  agenceId: string;
  onRetour: () => void;
}

const COULEURS_PRESET = [
  // Noirs / Gris
  { nom: 'Noir', hex: '#1a1a1a' },
  { nom: 'Anthracite', hex: '#374151' },
  { nom: 'Gris', hex: '#6B7280' },
  // Bleus
  { nom: 'Bleu marine', hex: '#1E3A5F' },
  { nom: 'Bleu royal', hex: '#185FA5' },
  { nom: 'Bleu ciel', hex: '#0284C7' },
  { nom: 'Indigo', hex: '#4F46E5' },
  // Verts
  { nom: 'Vert foncé', hex: '#0F6E56' },
  { nom: 'Vert émeraude', hex: '#059669' },
  { nom: 'Vert sauge', hex: '#4D7C6F' },
  // Violets
  { nom: 'Violet', hex: '#7C3AED' },
  { nom: 'Mauve', hex: '#9333EA' },
  { nom: 'Rose foncé', hex: '#993556' },
  // Rouges / Bordeaux
  { nom: 'Bordeaux', hex: '#712B13' },
  { nom: 'Rouge brique', hex: '#B91C1C' },
  // Marrons
  { nom: 'Marron', hex: '#854F0B' },
  { nom: 'Taupe', hex: '#78716C' },
  // Dorés / Jaunes
  { nom: 'Or foncé', hex: '#B45309' },
  { nom: 'Or vif', hex: '#D97706' },
  { nom: 'Jaune doré', hex: '#CA8A04' },
  { nom: 'Jaune', hex: '#EAB308' },
  // Spéciaux
  { nom: 'Turquoise', hex: '#0891B2' },
  { nom: 'Corail', hex: '#DC4D2F' },
  { nom: 'Terracotta', hex: '#C2552A' },
]

export default function ParametresAgence({ agenceId, onRetour }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nom: '',
    adresse_complete: '',
    telephone: '',
    email: '',
    site_web: '',
    siret: '',
    rcs: '',
    tva_intra: '',
    habilitation: '',
    ape: '',
    mention_legale:
      "En application de la réglementation funéraire, seules les prestations suivantes sont obligatoires : fourniture d'un véhicule agréé pour le transport de corps (avant ou après la mise en cercueil), d'un cercueil de 22mm d'épaisseur avec une garniture étanche et 4 poignées et, selon le cas, les opérations nécessaires à l'inhumation en France ou à l'Etranger.",
    validite_devis_jours: 30,
    logo_url: '',
    signature_url: '',
    couleur_principale: '#4F46E5',
    commentaires_devis: '',
    commentaires_facture: '',
    informations_juridiques: '',
    zone_texte_1: '',
    zone_texte_1_devis: true,
    zone_texte_1_facture: true,
    zone_texte_1_bon_commande: true,
    zone_texte_2: '',
    zone_texte_2_devis: false,
    zone_texte_2_facture: false,
    zone_texte_2_bon_commande: false,
    zone_texte_3: '',
    zone_texte_3_devis: false,
    zone_texte_3_facture: false,
    zone_texte_3_bon_commande: false,
  });

  useEffect(() => {
    charger();
  }, [agenceId]);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('agences')
      .select('*')
      .eq('id', agenceId)
      .single();
    if (data)
      setForm({
        nom: data.nom || '',
        adresse_complete: data.adresse_complete || '',
        telephone: data.telephone || '',
        email: data.email || '',
        site_web: data.site_web || '',
        siret: data.siret || '',
        rcs: data.rcs || '',
        tva_intra: data.tva_intra || '',
        habilitation: data.habilitation || '',
        ape: data.ape || '',
        mention_legale: data.mention_legale || '',
        validite_devis_jours: data.validite_devis_jours || 30,
        logo_url: data.logo_url || '',
        signature_url: data.signature_url || '',
        couleur_principale: data.couleur_principale || '#4F46E5',
        commentaires_devis: data.commentaires_devis || '',
        commentaires_facture: data.commentaires_facture || '',
        informations_juridiques: data.informations_juridiques || '',
        zone_texte_1: data.zone_texte_1 || '',
        zone_texte_1_devis: data.zone_texte_1_devis ?? true,
        zone_texte_1_facture: data.zone_texte_1_facture ?? true,
        zone_texte_1_bon_commande: data.zone_texte_1_bon_commande ?? true,
        zone_texte_2: data.zone_texte_2 || '',
        zone_texte_2_devis: data.zone_texte_2_devis ?? false,
        zone_texte_2_facture: data.zone_texte_2_facture ?? false,
        zone_texte_2_bon_commande: data.zone_texte_2_bon_commande ?? false,
        zone_texte_3: data.zone_texte_3 || '',
        zone_texte_3_devis: data.zone_texte_3_devis ?? false,
        zone_texte_3_facture: data.zone_texte_3_facture ?? false,
        zone_texte_3_bon_commande: data.zone_texte_3_bon_commande ?? false,
      });
    setLoading(false);
  }

  async function uploadFichier(fichier: File, type: 'logo' | 'signature') {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingSignature(true);
    try {
      const ext = fichier.name.split('.').pop();
      const path = `${agenceId}/${type}.${ext}`;
      const { error } = await supabase.storage
        .from('agences')
        .upload(path, fichier, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('agences').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      update(type === 'logo' ? 'logo_url' : 'signature_url', url);
      await supabase
        .from('agences')
        .update({ [type === 'logo' ? 'logo_url' : 'signature_url']: url })
        .eq('id', agenceId);
    } catch (e: any) {
      alert('Erreur upload : ' + e.message);
    }
    if (type === 'logo') setUploadingLogo(false);
    else setUploadingSignature(false);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      console.log(
        'saving zones:',
        form.zone_texte_1,
        form.zone_texte_2,
        form.zone_texte_3
      );
      const { error } = await supabase
        .from('agences')
        .update({
          nom: form.nom,
          adresse_complete: form.adresse_complete,
          telephone: form.telephone,
          email: form.email,
          site_web: form.site_web,
          siret: form.siret,
          rcs: form.rcs,
          tva_intra: form.tva_intra,
          habilitation: form.habilitation,
          ape: form.ape,
          mention_legale: form.mention_legale,
          validite_devis_jours: form.validite_devis_jours,
          logo_url: form.logo_url,
          signature_url: form.signature_url,
          couleur_principale: form.couleur_principale,
          zone_texte_1: form.zone_texte_1 || null,
          zone_texte_1_devis: Boolean(form.zone_texte_1_devis),
          zone_texte_1_facture: Boolean(form.zone_texte_1_facture),
          zone_texte_1_bon_commande: Boolean(form.zone_texte_1_bon_commande),
          zone_texte_2: form.zone_texte_2 || null,
          zone_texte_2_devis: Boolean(form.zone_texte_2_devis),
          zone_texte_2_facture: Boolean(form.zone_texte_2_facture),
          zone_texte_2_bon_commande: Boolean(form.zone_texte_2_bon_commande),
          zone_texte_3: form.zone_texte_3 || null,
          zone_texte_3_devis: Boolean(form.zone_texte_3_devis),
          zone_texte_3_facture: Boolean(form.zone_texte_3_facture),
          zone_texte_3_bon_commande: Boolean(form.zone_texte_3_bon_commande),
        })
        .eq('id', agenceId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert('Erreur : ' + JSON.stringify(e));
    }
    setSaving(false);
  }

  function update(c: string, v: any) {
    setForm((p) => ({ ...p, [c]: v }));
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    marginTop: '0.25rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
  };

  const sectionTitle = (titre: string, emoji: string) => (
    <h3
      style={{
        color: form.couleur_principale,
        borderBottom: `2px solid ${form.couleur_principale}22`,
        paddingBottom: '0.5rem',
        marginTop: '2rem',
      }}
    >
      {emoji} {titre}
    </h3>
  );

  const uploadZone = (
    type: 'logo' | 'signature',
    label: string,
    ref: React.RefObject<HTMLInputElement>,
    uploading: boolean
  ) => (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '500' }}>{label}</label>
      <div
        style={{
          marginTop: '0.5rem',
          border: '2px dashed #ddd',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          background: '#fafafa',
        }}
      >
        {form[type === 'logo' ? 'logo_url' : 'signature_url'] ? (
          <div>
            <img
              src={form[type === 'logo' ? 'logo_url' : 'signature_url']}
              alt={label}
              style={{
                maxHeight: '80px',
                maxWidth: '100%',
                marginBottom: '0.5rem',
                display: 'block',
                margin: '0 auto 0.5rem',
              }}
            />
            <button
              onClick={() => ref.current?.click()}
              style={{
                padding: '0.3rem 0.8rem',
                background: form.couleur_principale,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {uploading ? '⏳ Upload...' : '🔄 Changer'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
            <div
              style={{
                fontSize: '13px',
                color: '#888',
                marginBottom: '0.5rem',
              }}
            >
              PNG, JPG ou SVG — max 2 MB
            </div>
            <button
              onClick={() => ref.current?.click()}
              style={{
                padding: '0.4rem 1rem',
                background: form.couleur_principale,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {uploading ? '⏳ Upload...' : '📤 Choisir un fichier'}
            </button>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > 2 * 1024 * 1024) {
                alert('Fichier trop lourd — max 2 MB');
                return;
              }
              uploadFichier(f, type);
            }
          }}
        />
      </div>
    </div>
  );

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>⚙️ Paramètres de l'agence</h2>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          {saved && (
            <span style={{ color: '#0F6E56', fontWeight: 'bold' }}>
              ✅ Sauvegardé !
            </span>
          )}
          <button
            onClick={sauvegarder}
            disabled={saving}
            style={{
              padding: '0.6rem 1.2rem',
              background: saving ? '#ccc' : form.couleur_principale,
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

      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        {sectionTitle("Identité de l'agence", '🏢')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Nom de l'agence</label>
            <input
              value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Adresse complète</label>
            <textarea
              value={form.adresse_complete}
              onChange={(e) => update('adresse_complete', e.target.value)}
              style={{ ...inputStyle, height: '80px' }}
            />
          </div>
          <div>
            <label>Téléphone</label>
            <input
              value={form.telephone}
              onChange={(e) => update('telephone', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Site web</label>
            <input
              value={form.site_web}
              onChange={(e) => update('site_web', e.target.value)}
              style={inputStyle}
              placeholder="www.exemple.fr"
            />
          </div>
        </div>

        {sectionTitle("Couleur de l'agence", '🎨')}
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1rem' }}>
          Cette couleur s'applique sur tous vos documents
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          {COULEURS_PRESET.map((c) => (
            <div
              key={c.hex}
              onClick={() => update('couleur_principale', c.hex)}
              title={c.nom}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: c.hex,
                cursor: 'pointer',
                border:
                  form.couleur_principale === c.hex
                    ? '3px solid #333'
                    : '3px solid transparent',
                boxShadow:
                  form.couleur_principale === c.hex
                    ? '0 0 0 2px white inset'
                    : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '13px' }}>Couleur personnalisée :</label>
          <input
            type="color"
            value={form.couleur_principale}
            onChange={(e) => update('couleur_principale', e.target.value)}
            style={{
              width: '50px',
              height: '40px',
              padding: '2px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '13px', color: '#888' }}>
            {form.couleur_principale}
          </span>
          <div
            style={{
              padding: '0.4rem 1rem',
              background: form.couleur_principale,
              color: 'white',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            Aperçu
          </div>
        </div>

        {sectionTitle('Informations légales (pied de page)', '📋')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div>
            <label>SIRET</label>
            <input
              value={form.siret}
              onChange={(e) => update('siret', e.target.value)}
              style={inputStyle}
              placeholder="90827121600016"
            />
          </div>
          <div>
            <label>RCS</label>
            <input
              value={form.rcs}
              onChange={(e) => update('rcs', e.target.value)}
              style={inputStyle}
              placeholder="RCS PONTOISE"
            />
          </div>
          <div>
            <label>TVA intracommunautaire</label>
            <input
              value={form.tva_intra}
              onChange={(e) => update('tva_intra', e.target.value)}
              style={inputStyle}
              placeholder="FR46908271216"
            />
          </div>
          <div>
            <label>Code APE</label>
            <input
              value={form.ape}
              onChange={(e) => update('ape', e.target.value)}
              style={inputStyle}
              placeholder="9603Z"
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Habilitation préfectorale</label>
            <input
              value={form.habilitation}
              onChange={(e) => update('habilitation', e.target.value)}
              style={inputStyle}
              placeholder="22-95-01-42"
            />
          </div>
        </div>

        {sectionTitle('Logo & Signature', '📄')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginTop: '1rem',
          }}
        >
          {uploadZone('logo', "Logo de l'agence", logoRef, uploadingLogo)}
          {uploadZone(
            'signature',
            'Signature',
            signatureRef,
            uploadingSignature
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label>Validité du devis (jours)</label>
          <input
            type="number"
            value={form.validite_devis_jours}
            onChange={(e) =>
              update('validite_devis_jours', parseInt(e.target.value))
            }
            style={{ ...inputStyle, maxWidth: '150px' }}
          />
        </div>

        {sectionTitle('Mention légale obligatoire', '⚖️')}
        <div>
          <label style={{ fontSize: '12px', color: '#888' }}>
            Apparaît sur tous les devis et factures
          </label>
          <textarea
            value={form.mention_legale}
            onChange={(e) => update('mention_legale', e.target.value)}
            style={{ ...inputStyle, height: '120px', marginTop: '0.5rem' }}
          />
        </div>

        {sectionTitle('Textes personnalisés', '📝')}
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 1rem' }}>
          Définissez jusqu'à 3 zones de texte libre et choisissez sur quels
          documents elles apparaissent.
        </p>

        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #eee',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '0.75rem',
              color: form.couleur_principale,
            }}
          >
            Zone 1
          </div>
          <textarea
            value={form.zone_texte_1}
            onChange={(e) => update('zone_texte_1', e.target.value)}
            placeholder="Texte zone 1 — ex: CGV, commentaires, informations juridiques..."
            style={{ ...inputStyle, height: '90px', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_1_devis}
                onChange={(e) => update('zone_texte_1_devis', e.target.checked)}
              />{' '}
              📋 Devis
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_1_facture}
                onChange={(e) =>
                  update('zone_texte_1_facture', e.target.checked)
                }
              />{' '}
              🧾 Facture
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_1_bon_commande}
                onChange={(e) =>
                  update('zone_texte_1_bon_commande', e.target.checked)
                }
              />{' '}
              📝 Bon de commande
            </label>
          </div>
        </div>

        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #eee',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '0.75rem',
              color: form.couleur_principale,
            }}
          >
            Zone 2
          </div>
          <textarea
            value={form.zone_texte_2}
            onChange={(e) => update('zone_texte_2', e.target.value)}
            placeholder="Texte zone 2 — ex: CGV, commentaires, informations juridiques..."
            style={{ ...inputStyle, height: '90px', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_2_devis}
                onChange={(e) => update('zone_texte_2_devis', e.target.checked)}
              />{' '}
              📋 Devis
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_2_facture}
                onChange={(e) =>
                  update('zone_texte_2_facture', e.target.checked)
                }
              />{' '}
              🧾 Facture
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_2_bon_commande}
                onChange={(e) =>
                  update('zone_texte_2_bon_commande', e.target.checked)
                }
              />{' '}
              📝 Bon de commande
            </label>
          </div>
        </div>

        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #eee',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '0.75rem',
              color: form.couleur_principale,
            }}
          >
            Zone 3
          </div>
          <textarea
            value={form.zone_texte_3}
            onChange={(e) => update('zone_texte_3', e.target.value)}
            placeholder="Texte zone 3 — ex: CGV, commentaires, informations juridiques..."
            style={{ ...inputStyle, height: '90px', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_3_devis}
                onChange={(e) => update('zone_texte_3_devis', e.target.checked)}
              />{' '}
              📋 Devis
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_3_facture}
                onChange={(e) =>
                  update('zone_texte_3_facture', e.target.checked)
                }
              />{' '}
              🧾 Facture
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.zone_texte_3_bon_commande}
                onChange={(e) =>
                  update('zone_texte_3_bon_commande', e.target.checked)
                }
              />{' '}
              📝 Bon de commande
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
