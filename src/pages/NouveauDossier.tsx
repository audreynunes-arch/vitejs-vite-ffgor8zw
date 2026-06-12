import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

type TypeDossier = 'inhumation_locale' | 'rapatriement';

interface Props {
  onRetour: () => void;
}

function AutocompleteAdresse({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: any;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current || !(window as any).google) return;
    const autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'fr' },
        language: 'fr',
      }
    );
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) onChange(place.formatted_address);
      else if (place.name) onChange(place.name);
    });
  }, []);

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      placeholder={placeholder}
      style={style}
    />
  );
}

function RechercheGoogleLieu({
  value,
  onChange,
  placeholder,
  style,
  types,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: any;
  types?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [manuel, setManuel] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !(window as any).google || manuel) return;
    const autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'fr' },
        language: 'fr',
        types: types || ['establishment'],
      }
    );
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name && place.formatted_address) {
        onChange(`${place.name} — ${place.formatted_address}`);
      } else if (place.formatted_address) {
        onChange(place.formatted_address);
      } else if (place.name) {
        onChange(place.name);
      }
    });
  }, [manuel]);

  return (
    <div>
      {!manuel ? (
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            defaultValue={value}
            placeholder={placeholder || 'Rechercher sur Google...'}
            style={style}
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Lieu introuvable ?{' '}
            <span
              onClick={() => setManuel(true)}
              style={{
                color: '#4F46E5',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Saisir manuellement
            </span>
          </div>
        </div>
      ) : (
        <div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Saisir manuellement..."
            style={style}
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            <span
              onClick={() => setManuel(false)}
              style={{
                color: '#4F46E5',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Rechercher sur Google
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NouveauDossier({ onRetour }: Props) {
  const [etape, setEtape] = useState(1);
  const [type, setType] = useState<TypeDossier | null>(null);
  const [saving, setSaving] = useState(false);
  const [dossierCree, setDossierCree] = useState<any>(null);

  const [refs, setRefs] = useState({
    reference_agence: '',
    numero_devis: '',
    numero_bon_commande: '',
    numero_facture: '',
  });

  const [defunt, setDefunt] = useState({
    civilite: '',
    nom: '',
    prenom: '',
    nom_jeune_fille: '',
    sexe: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: '',
    profession: '',
    domicile: '',
    situation_familiale: '',
    nombre_enfants: '',
    epoux: '',
    filiation_pere: '',
    filiation_mere: '',
    date_deces: '',
    heure_deces: '',
    lieu_deces: '',
    nom_medecin: '',
  });

  const [pouvoir, setPouvoir] = useState({
    civilite: '',
    nom: '',
    prenom: '',
    lien_parente: '',
    date_naissance: '',
    adresse: '',
    nationalite: '',
    profession: '',
    telephone_1: '',
    telephone_2: '',
    email: '',
  });

  const [logistique, setLogistique] = useState({
    chambre_mortuaire_nom: '',
    cimetiere_id: '',
    cimetiere_pays: '',
    mairie_deces_nom: '',
    mosquee_nom: '',
    date_toilette: '',
    heure_toilette: '',
    date_meb: '',
    heure_meb: '',
    date_fermeture_depart: '',
    heure_fermeture_depart: '',
    date_inhumation: '',
    heure_inhumation: '',
    taille_defunt: '',
    cercueil_id: '',
    plaque_identite: '',
    housse_mortuaire: '',
    zinc: false,
    housse_cercueil: false,
    housse_cercueil_rapat: false,
    convoi_effectue_par: '',
    observations: '',
    achat_concession: '',
    montant_concession: '',
    immatriculation_vehicule: '',
    numero_concession: '',
    division_concession: '',
    marbrier_id: '',
    travaux_realiser: '',
    numero_dossier_iml: '',
    taille_iml: '',
    epaulement_iml: '',
    poids_iml: '',
    nom_docteur_certificat: '',
    heure_presentation: '',
    destination_id: '',
    compagnie_aerienne: '',
    numero_vol: '',
    lta: '',
    aeroport_depart: '',
    heure_depart_vol: '',
    date_vol: '',
    aeroport_escale: '',
    heure_arrivee_escale: '',
    date_depart_escale: '',
    numero_vol_escale: '',
    aeroport_arrivee: '',
    heure_arrivee_vol: '',
    numero_passeport: '',
    contact_pays: '',
    telephone_contact_pays: '',
    adresse_contact_pays: '',
    ambulance_pays: '',
  });

  const [cimetieres, setCimetieres] = useState<any[]>([]);
  const [marbriers, setMarbriers] = useState<any[]>([]);
  const [cimetiereTarifs, setCimetiereTarifs] = useState<any>(null);
  const [tarifsRapatriement, setTarifsRapatriement] = useState<any[]>([]);
  const [catalogueCercueils, setCatalogueCercueils] = useState<any[]>([]);
  const [monAgenceId, setMonAgenceId] = useState<string>('');

  const [vehicules, setVehicules] = useState<any[]>([]);
  const [employes, setEmployes] = useState<any[]>([]);

  const [deptCimetiere, setDeptCimetiere] = useState('');

  const departements = [
    { code: '75', nom: 'Paris (75)' },
    { code: '77', nom: 'Seine-et-Marne (77)' },
    { code: '78', nom: 'Yvelines (78)' },
    { code: '91', nom: 'Essonne (91)' },
    { code: '92', nom: 'Hauts-de-Seine (92)' },
    { code: '93', nom: 'Seine-Saint-Denis (93)' },
    { code: '94', nom: 'Val-de-Marne (94)' },
    { code: '95', nom: "Val-d'Oise (95)" },
  ];

  const filtrer = (liste: any[], dept: string) => {
    if (!dept) return liste;
    return liste.filter((item) => (item.code_postal || '').startsWith(dept));
  };

  useEffect(() => {
    // Récupérer l'agence de l'utilisateur connecté, puis charger SES référentiels
    supabase.auth.getSession().then(({ data: session }) => {
      const userId = session.session?.user.id;
      if (!userId) return;
      supabase
        .from('utilisateurs')
        .select('agence_id')
        .eq('id', userId)
        .single()
        .then(({ data: user }) => {
          const agenceId = user?.agence_id || '';
          setMonAgenceId(agenceId);

          supabase
            .from('cimetieres')
            .select(
              'id, nom, ville, code_postal, tarif_10ans_adulte, tarif_15ans_adulte, tarif_30ans_adulte, tarif_50ans_adulte, tarif_perpet_adulte, tarif_10ans_enfant, tarif_15ans_enfant, tarif_30ans_enfant, tarif_50ans_enfant, tarif_perpet_enfant, semelle_imposee, fausse_case_imposee'
            )
            .eq('agence_id', agenceId)
            .order('nom')
            .then(({ data }) => setCimetieres(data || []));
          supabase
            .from('marbriers')
            .select('id, nom, ville, code_postal')
            .eq('agence_id', agenceId)
            .order('nom')
            .then(({ data }) => setMarbriers(data || []));
          supabase
            .from('tarifs_rapatriement')
            .select('*')
            .eq('agence_id', agenceId)
            .order('ordre')
            .then(({ data }) => setTarifsRapatriement(data || []));
          supabase
            .from('vehicules')
            .select('id, immatriculation, marque, modele')
            .eq('agence_id', agenceId)
            .order('immatriculation')
            .then(({ data }) => setVehicules(data || []));
          supabase
            .from('employes')
            .select('id, nom, prenom, poste')
            .eq('actif', true)
            .eq('agence_id', agenceId)
            .order('nom')
            .then(({ data }) => setEmployes(data || []));
          supabase
            .from('catalogue_cercueils')
            .select('*')
            .eq('actif', true)
            .eq('agence_id', agenceId)
            .order('ordre')
            .then(({ data }) => setCatalogueCercueils(data || []));
        });
    });
  }, []);

  function updateDefunt(c: string, v: string) {
    setDefunt((p) => ({ ...p, [c]: v }));
  }
  function updatePouvoir(c: string, v: string) {
    setPouvoir((p) => ({ ...p, [c]: v }));
  }
  function updateLogistique(c: string, v: any) {
    setLogistique((p) => ({ ...p, [c]: v }));
  }
  function updateRefs(c: string, v: string) {
    setRefs((p) => ({ ...p, [c]: v }));
  }

  function choisirCimetiere(id: string) {
    updateLogistique('cimetiere_id', id);
    updateLogistique('achat_concession', '');
    updateLogistique('montant_concession', '');
    const cim = cimetieres.find((c) => c.id === id);
    setCimetiereTarifs(cim || null);
  }

  function choisirConcession(val: string) {
    if (!val || !cimetiereTarifs) return;
    updateLogistique('achat_concession', val);
    const prix =
      val === '10ans_adulte'
        ? cimetiereTarifs.tarif_10ans_adulte
        : val === '15ans_adulte'
        ? cimetiereTarifs.tarif_15ans_adulte
        : val === '30ans_adulte'
        ? cimetiereTarifs.tarif_30ans_adulte
        : val === '50ans_adulte'
        ? cimetiereTarifs.tarif_50ans_adulte
        : val === 'perpet_adulte'
        ? cimetiereTarifs.tarif_perpet_adulte
        : val === '10ans_enfant'
        ? cimetiereTarifs.tarif_10ans_enfant
        : val === '15ans_enfant'
        ? cimetiereTarifs.tarif_15ans_enfant
        : val === '30ans_enfant'
        ? cimetiereTarifs.tarif_30ans_enfant
        : val === '50ans_enfant'
        ? cimetiereTarifs.tarif_50ans_enfant
        : val === 'perpet_enfant'
        ? cimetiereTarifs.tarif_perpet_enfant
        : 0;
    updateLogistique('montant_concession', String(prix || 0));
  }

  function choisirDestination(id: string) {
    updateLogistique('destination_id', id);
    const t = tarifsRapatriement.find((t) => t.id === id);
    if (t) {
      updateLogistique('compagnie_aerienne', t.compagnie || '');
      updateLogistique('aeroport_depart', t.aeroport_depart || '');
    }
  }

  function calcAge(dateNaissance: string) {
    if (!dateNaissance) return '';
    const n = new Date(dateNaissance);
    const a = new Date();
    let age = a.getFullYear() - n.getFullYear();
    const m = a.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && a.getDate() < n.getDate())) age--;
    return age + ' ans';
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      const { data: user } = await supabase
        .from('utilisateurs')
        .select('agence_id')
        .eq('id', userId)
        .single();

      const { data: defuntData, error: defuntError } = await supabase
        .from('defunts')
        .insert({
          civilite: defunt.civilite || null,
          nom: defunt.nom,
          prenom: defunt.prenom,
          nom_jeune_fille: defunt.nom_jeune_fille || null,
          sexe: defunt.sexe || null,
          date_naissance: defunt.date_naissance || null,
          lieu_naissance: defunt.lieu_naissance || null,
          nationalite: defunt.nationalite || null,
          profession: defunt.profession || null,
          domicile: defunt.domicile || null,
          situation_familiale: defunt.situation_familiale || null,
          epoux: defunt.epoux || null,
          filiation_pere: defunt.filiation_pere || null,
          filiation_mere: defunt.filiation_mere || null,
        })
        .select()
        .single();

      if (defuntError) throw defuntError;

      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .insert({
          agence_id: user.agence_id,
          utilisateur_id: userId,
          defunt_id: defuntData.id,
          type_dossier: type,
          statut: 'en_cours',
          compte_client: refs.reference_agence || null,
          numero_devis: refs.numero_devis || null,
          numero_bon_commande: refs.numero_bon_commande || null,
          numero_facture: refs.numero_facture || null,
          date_deces: defunt.date_deces || null,
          heure_deces: defunt.heure_deces || null,
          lieu_deces: defunt.lieu_deces || null,
          nom_medecin: defunt.nom_medecin || null,
          chambre_mortuaire_nom: logistique.chambre_mortuaire_nom || null,
          cimetiere_id:
            type === 'inhumation_locale'
              ? logistique.cimetiere_id || null
              : null,
          cimetiere_pays:
            type === 'rapatriement' ? logistique.cimetiere_pays || null : null,
          mairie_deces_nom: logistique.mairie_deces_nom || null,
          mosquee_nom: logistique.mosquee_nom || null,
          taille_defunt: logistique.taille_defunt || null,
          convoi_effectue_par: logistique.convoi_effectue_par || null,
          date_toilette: logistique.date_toilette || null,
          heure_toilette: logistique.heure_toilette || null,
          date_meb: logistique.date_meb || null,
          heure_meb: logistique.heure_meb || null,
          date_fermeture_depart: logistique.date_fermeture_depart || null,
          heure_fermeture_depart: logistique.heure_fermeture_depart || null,
          date_inhumation: logistique.date_inhumation || null,
          heure_inhumation: logistique.heure_inhumation || null,
          observations: logistique.observations || null,
          achat_concession: logistique.achat_concession || null,
          montant_concession: logistique.montant_concession
            ? parseFloat(logistique.montant_concession)
            : null,
          immatriculation_vehicule: logistique.immatriculation_vehicule || null,
          numero_concession: logistique.numero_concession || null,
          division_concession: logistique.division_concession || null,
          cercueil_id: logistique.cercueil_id || null,
          marbrier_id: logistique.marbrier_id || null,
          travaux_realiser: logistique.travaux_realiser || null,
          numero_dossier_iml: logistique.numero_dossier_iml || null,
          taille_iml: logistique.taille_iml || null,
          epaulement_iml: logistique.epaulement_iml || null,
          poids_iml: logistique.poids_iml || null,
          nom_docteur_certificat: logistique.nom_docteur_certificat || null,
          heure_presentation: logistique.heure_presentation || null,
          compagnie_aerienne: logistique.compagnie_aerienne || null,
          numero_vol: logistique.numero_vol || null,
          lta: logistique.lta || null,
          aeroport_depart: logistique.aeroport_depart || null,
          heure_depart_vol: logistique.heure_depart_vol || null,
          date_vol: logistique.date_vol || null,
          aeroport_escale: logistique.aeroport_escale || null,
          heure_arrivee_escale: logistique.heure_arrivee_escale || null,
          date_depart_escale: logistique.date_depart_escale || null,
          numero_vol_escale: logistique.numero_vol_escale || null,
          aeroport_arrivee: logistique.aeroport_arrivee || null,
          heure_arrivee_vol: logistique.heure_arrivee_vol || null,
          numero_passeport: logistique.numero_passeport || null,
          contact_pays: logistique.contact_pays || null,
          telephone_contact_pays: logistique.telephone_contact_pays || null,
          adresse_contact_pays: logistique.adresse_contact_pays || null,
          ambulance_pays: logistique.ambulance_pays || null,
        })
        .select()
        .single();

      if (dossierError) throw dossierError;

      if (pouvoir.nom && pouvoir.prenom) {
        await supabase.from('pouvoirs').insert({
          dossier_id: dossierData.id,
          civilite: pouvoir.civilite || null,
          nom: pouvoir.nom,
          prenom: pouvoir.prenom,
          lien_parente: pouvoir.lien_parente || null,
          date_naissance: pouvoir.date_naissance || null,
          adresse: pouvoir.adresse || null,
          nationalite: pouvoir.nationalite || null,
          profession: pouvoir.profession || null,
          telephone_1: pouvoir.telephone_1 || null,
          telephone_2: pouvoir.telephone_2 || null,
          email: pouvoir.email || null,
        });
      }

      setDossierCree(dossierData);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setSaving(false);
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    boxSizing: 'border-box' as const,
  };
  const selectStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
  };

  const header = (titre: string, etapePrecedente: number, etapeNum: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      <button onClick={() => setEtape(etapePrecedente)}>← Retour</button>
      <h2 style={{ margin: 0 }}>{titre}</h2>
      <span style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>
        {etapeNum}
      </span>
    </div>
  );

  const btnSuivant = (onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: '2rem',
        width: '100%',
        padding: '0.75rem',
        background: disabled ? '#ccc' : '#4F46E5',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Suivant →
    </button>
  );

  const selectDept = (value: string, onChange: (v: string) => void) => (
    <div
      style={{
        background: '#f0f0f0',
        padding: '0.5rem',
        borderRadius: '6px',
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">-- Tous les départements --</option>
        {departements.map((d) => (
          <option key={d.code} value={d.code}>
            {d.nom}
          </option>
        ))}
      </select>
    </div>
  );

  const ligne = (label: string, valeur: string) => (
    <div
      style={{
        display: 'flex',
        padding: '0.5rem 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <span style={{ color: '#666', minWidth: '200px', fontSize: '14px' }}>
        {label}
      </span>
      <span style={{ fontWeight: '500' }}>{valeur || '—'}</span>
    </div>
  );

  function nomCimetiere(id: string) {
    const c = cimetieres.find((x) => x.id === id);
    return c ? `${c.nom} — ${c.ville}` : '—';
  }
  function nomMarbrier(id: string) {
    const m = marbriers.find((x) => x.id === id);
    return m ? `${m.nom} — ${m.ville}` : '—';
  }

  if (etape === 1) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <button onClick={onRetour}>← Retour</button>
          <h2 style={{ margin: 0 }}>Nouveau dossier</h2>
        </div>
        <p style={{ color: '#666' }}>Choisissez le type de dossier</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <div
            onClick={() => setType('inhumation_locale')}
            style={{
              border: `2px solid ${
                type === 'inhumation_locale' ? '#0F6E56' : '#ddd'
              }`,
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: type === 'inhumation_locale' ? '#E1F5EE' : 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>⚰️</div>
            <div
              style={{
                fontWeight: 'bold',
                marginTop: '0.5rem',
                color: '#0F6E56',
              }}
            >
              Inhumation locale
            </div>
          </div>
          <div
            onClick={() => setType('rapatriement')}
            style={{
              border: `2px solid ${
                type === 'rapatriement' ? '#993C1D' : '#ddd'
              }`,
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: type === 'rapatriement' ? '#FAECE7' : 'white',
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>✈️</div>
            <div
              style={{
                fontWeight: 'bold',
                marginTop: '0.5rem',
                color: '#993C1D',
              }}
            >
              Rapatriement
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '2rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', fontSize: '15px', color: '#333' }}>
            📋 Références du dossier
          </h3>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 1rem' }}>
            Continuez votre propre numérotation — ces champs sont libres et
            facultatifs.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label style={{ fontSize: '13px' }}>Référence dossier</label>
              <input
                placeholder="ex: S00628835"
                value={refs.reference_agence}
                onChange={(e) => updateRefs('reference_agence', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px' }}>N° Devis</label>
              <input
                placeholder="ex: D-2025-042"
                value={refs.numero_devis}
                onChange={(e) => updateRefs('numero_devis', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px' }}>N° Bon de commande</label>
              <input
                placeholder="ex: BC-2025-042"
                value={refs.numero_bon_commande}
                onChange={(e) =>
                  updateRefs('numero_bon_commande', e.target.value)
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px' }}>N° Facture</label>
              <input
                placeholder="ex: F-2025-042"
                value={refs.numero_facture}
                onChange={(e) => updateRefs('numero_facture', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setEtape(2)}
          disabled={!type}
          style={{
            marginTop: '2rem',
            width: '100%',
            padding: '0.75rem',
            background: type ? '#4F46E5' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: type ? 'pointer' : 'not-allowed',
          }}
        >
          Suivant →
        </button>
      </div>
    );
  }

  if (etape === 2) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        {header('Identité du défunt', 1, 'Étape 2/5')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div>
            <label>Civilité</label>
            <select
              value={defunt.civilite}
              onChange={(e) => updateDefunt('civilite', e.target.value)}
              style={selectStyle}
            >
              <option value="">--</option>
              <option>M.</option>
              <option>Mme</option>
              <option>Melle</option>
              <option>Enfant</option>
              <option>Bébé</option>
            </select>
          </div>
          <div>
            <label>Sexe</label>
            <select
              value={defunt.sexe}
              onChange={(e) => updateDefunt('sexe', e.target.value)}
              style={selectStyle}
            >
              <option value="">--</option>
              <option>Masculin</option>
              <option>Féminin</option>
            </select>
          </div>
          <div>
            <label>Nom *</label>
            <input
              value={defunt.nom}
              onChange={(e) => updateDefunt('nom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Prénom *</label>
            <input
              value={defunt.prenom}
              onChange={(e) => updateDefunt('prenom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Nom de jeune fille</label>
            <input
              value={defunt.nom_jeune_fille}
              onChange={(e) => updateDefunt('nom_jeune_fille', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Nationalité</label>
            <input
              value={defunt.nationalite}
              onChange={(e) => updateDefunt('nationalite', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Date de naissance</label>
            <input
              type="date"
              value={defunt.date_naissance}
              onChange={(e) => updateDefunt('date_naissance', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Âge</label>
            <input
              value={calcAge(defunt.date_naissance)}
              readOnly
              style={{ ...inputStyle, background: '#f5f5f5', color: '#666' }}
            />
          </div>
          <div>
            <label>Lieu de naissance</label>
            <input
              value={defunt.lieu_naissance}
              onChange={(e) => updateDefunt('lieu_naissance', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Profession</label>
            <input
              value={defunt.profession}
              onChange={(e) => updateDefunt('profession', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Domicile</label>
            <AutocompleteAdresse
              value={defunt.domicile}
              onChange={(val) => updateDefunt('domicile', val)}
              placeholder="ex: 12 rue de la Paix, Paris"
              style={inputStyle}
            />
          </div>
          <div>
            <label>Situation familiale</label>
            <select
              value={defunt.situation_familiale}
              onChange={(e) =>
                updateDefunt('situation_familiale', e.target.value)
              }
              style={selectStyle}
            >
              <option value="">--</option>
              <option>Célibataire</option>
              <option>Marié(e)</option>
              <option>Divorcé(e)</option>
              <option>Veuf(ve)</option>
              <option>Pacsé(e)</option>
            </select>
          </div>
          <div>
            <label>Époux / Épouse</label>
            <input
              value={defunt.epoux}
              onChange={(e) => updateDefunt('epoux', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* FILIATION */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#f9f9f9',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #eee',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '13px',
                marginBottom: '0.75rem',
                color: '#666',
              }}
            >
              👨‍👩‍👧 Filiation
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div>
                <label>Nom du père</label>
                <input
                  value={defunt.filiation_pere}
                  onChange={(e) =>
                    updateDefunt('filiation_pere', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label>Nom de la mère</label>
                <input
                  value={defunt.filiation_mere}
                  onChange={(e) =>
                    updateDefunt('filiation_mere', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <label>Date de décès *</label>
            <input
              type="date"
              value={defunt.date_deces}
              onChange={(e) => updateDefunt('date_deces', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Heure de décès</label>
            <input
              type="time"
              value={defunt.heure_deces}
              onChange={(e) => updateDefunt('heure_deces', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Lieu de décès</label>
            <AutocompleteAdresse
              value={defunt.lieu_deces}
              onChange={(val) => updateDefunt('lieu_deces', val)}
              placeholder="ex: 12 rue de la Paix, Paris"
              style={inputStyle}
            />
          </div>
          <div>
            <label>Nom du médecin</label>
            <input
              value={defunt.nom_medecin}
              onChange={(e) => updateDefunt('nom_medecin', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        {btnSuivant(
          () => setEtape(3),
          !defunt.nom || !defunt.prenom || !defunt.date_deces
        )}
      </div>
    );
  }

  if (etape === 3) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        {header('Pouvoir — Mandataire', 2, 'Étape 3/5')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div>
            <label>Civilité</label>
            <select
              value={pouvoir.civilite}
              onChange={(e) => updatePouvoir('civilite', e.target.value)}
              style={selectStyle}
            >
              <option value="">--</option>
              <option>M.</option>
              <option>Mme</option>
              <option>Melle</option>
            </select>
          </div>
          <div>
            <label>Lien de parenté</label>
            <select
              value={pouvoir.lien_parente}
              onChange={(e) => updatePouvoir('lien_parente', e.target.value)}
              style={selectStyle}
            >
              <option value="">--</option>
              <option>Époux</option>
              <option>Épouse</option>
              <option>Père</option>
              <option>Mère</option>
              <option>Fils</option>
              <option>Fille</option>
              <option>Frère</option>
              <option>Sœur</option>
              <option>Grand-Père</option>
              <option>Grand-Mère</option>
              <option>Oncle</option>
              <option>Tante</option>
              <option>Cousin</option>
              <option>Cousine</option>
              <option>Ami</option>
            </select>
          </div>
          <div>
            <label>Nom *</label>
            <input
              value={pouvoir.nom}
              onChange={(e) => updatePouvoir('nom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Prénom *</label>
            <input
              value={pouvoir.prenom}
              onChange={(e) => updatePouvoir('prenom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Date de naissance</label>
            <input
              type="date"
              value={pouvoir.date_naissance}
              onChange={(e) => updatePouvoir('date_naissance', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Nationalité</label>
            <input
              value={pouvoir.nationalite}
              onChange={(e) => updatePouvoir('nationalite', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Adresse</label>
            <AutocompleteAdresse
              value={pouvoir.adresse}
              onChange={(val) => updatePouvoir('adresse', val)}
              placeholder="ex: 12 rue de la Paix, Paris"
              style={inputStyle}
            />
          </div>
          <div>
            <label>Téléphone 1 *</label>
            <input
              value={pouvoir.telephone_1}
              onChange={(e) => updatePouvoir('telephone_1', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Téléphone 2</label>
            <input
              value={pouvoir.telephone_2}
              onChange={(e) => updatePouvoir('telephone_2', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Email</label>
            <input
              type="email"
              value={pouvoir.email}
              onChange={(e) => updatePouvoir('email', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Profession</label>
            <input
              value={pouvoir.profession}
              onChange={(e) => updatePouvoir('profession', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        {btnSuivant(
          () => setEtape(4),
          !pouvoir.nom || !pouvoir.prenom || !pouvoir.telephone_1
        )}
      </div>
    );
  }

  if (etape === 4) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        {header('Logistique', 3, 'Étape 4/5')}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 'bold' }}>
              Chambre mortuaire / Funérarium
            </label>
            <RechercheGoogleLieu
              value={logistique.chambre_mortuaire_nom || ''}
              onChange={(val) => updateLogistique('chambre_mortuaire_nom', val)}
              placeholder="Rechercher une chambre mortuaire ou funérarium..."
              style={inputStyle}
              types={['establishment']}
            />
          </div>

          {type === 'inhumation_locale' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold' }}>Cimetière</label>
              {selectDept(deptCimetiere, setDeptCimetiere)}
              <select
                value={logistique.cimetiere_id}
                onChange={(e) => choisirCimetiere(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Sélectionner --</option>
                {filtrer(cimetieres, deptCimetiere).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.ville}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'rapatriement' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold' }}>Cimetière au pays</label>
              <input
                value={logistique.cimetiere_pays}
                onChange={(e) =>
                  updateLogistique('cimetiere_pays', e.target.value)
                }
                style={inputStyle}
                placeholder="ex: Cimetière communal de Tlemcen"
              />
            </div>
          )}

          {type === 'inhumation_locale' && cimetiereTarifs && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#FAEEDA',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #854F0B',
              }}
            >
              <label style={{ fontWeight: 'bold', color: '#854F0B' }}>
                🏛️ Concession — {cimetiereTarifs.nom}
              </label>
              <select
                value={logistique.achat_concession}
                onChange={(e) => choisirConcession(e.target.value)}
                style={{ ...selectStyle, marginTop: '0.5rem' }}
              >
                <option value="">-- Choisir la durée --</option>
                {cimetiereTarifs.tarif_10ans_adulte > 0 && (
                  <option value="10ans_adulte">
                    10 ans adulte — {cimetiereTarifs.tarif_10ans_adulte} €
                  </option>
                )}
                {cimetiereTarifs.tarif_15ans_adulte > 0 && (
                  <option value="15ans_adulte">
                    15 ans adulte — {cimetiereTarifs.tarif_15ans_adulte} €
                  </option>
                )}
                {cimetiereTarifs.tarif_30ans_adulte > 0 && (
                  <option value="30ans_adulte">
                    30 ans adulte — {cimetiereTarifs.tarif_30ans_adulte} €
                  </option>
                )}
                {cimetiereTarifs.tarif_50ans_adulte > 0 && (
                  <option value="50ans_adulte">
                    50 ans adulte — {cimetiereTarifs.tarif_50ans_adulte} €
                  </option>
                )}
                {cimetiereTarifs.tarif_perpet_adulte > 0 && (
                  <option value="perpet_adulte">
                    Perpétuelle adulte — {cimetiereTarifs.tarif_perpet_adulte} €
                  </option>
                )}
                {cimetiereTarifs.tarif_10ans_enfant > 0 && (
                  <option value="10ans_enfant">
                    10 ans enfant — {cimetiereTarifs.tarif_10ans_enfant} €
                  </option>
                )}
                {cimetiereTarifs.tarif_15ans_enfant > 0 && (
                  <option value="15ans_enfant">
                    15 ans enfant — {cimetiereTarifs.tarif_15ans_enfant} €
                  </option>
                )}
                {cimetiereTarifs.tarif_30ans_enfant > 0 && (
                  <option value="30ans_enfant">
                    30 ans enfant — {cimetiereTarifs.tarif_30ans_enfant} €
                  </option>
                )}
                {cimetiereTarifs.tarif_50ans_enfant > 0 && (
                  <option value="50ans_enfant">
                    50 ans enfant — {cimetiereTarifs.tarif_50ans_enfant} €
                  </option>
                )}
                {cimetiereTarifs.tarif_perpet_enfant > 0 && (
                  <option value="perpet_enfant">
                    Perpétuelle enfant — {cimetiereTarifs.tarif_perpet_enfant} €
                  </option>
                )}
              </select>
              {logistique.montant_concession &&
                parseFloat(logistique.montant_concession) > 0 && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontWeight: 'bold',
                      color: '#854F0B',
                    }}
                  >
                    Montant :{' '}
                    {parseFloat(logistique.montant_concession).toFixed(2)} €
                  </div>
                )}
              {cimetiereTarifs.semelle_imposee && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#854F0B',
                    marginTop: '0.25rem',
                  }}
                >
                  ⚠️ Semelle imposée dans ce cimetière
                </div>
              )}
              {cimetiereTarifs.fausse_case_imposee && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#854F0B',
                    marginTop: '0.25rem',
                  }}
                >
                  ⚠️ Fausse case imposée dans ce cimetière
                </div>
              )}
            </div>
          )}

          {/* CERCUEIL & FOURNITURES */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#f0fdf4',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #0F6E56',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '13px',
                marginBottom: '0.75rem',
                color: '#0F6E56',
              }}
            >
              ⚰️ Cercueil & Fournitures
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Cercueil</label>
                <select
                  value={logistique.cercueil_id || ''}
                  onChange={(e) =>
                    updateLogistique('cercueil_id', e.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="">-- Sélectionner un cercueil --</option>
                  {catalogueCercueils
                    .filter((c) => c.type !== 'accessoire')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} — {c.prix_ttc} € TTC
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label>Plaque d'identité</label>
                <select
                  value={logistique.plaque_identite || ''}
                  onChange={(e) =>
                    updateLogistique('plaque_identite', e.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="">Aucune</option>
                  <option value="1">1 plaque — 20 €</option>
                  <option value="2">2 plaques — 40 €</option>
                </select>
              </div>
              <div>
                <label>Housse mortuaire</label>
                <select
                  value={logistique.housse_mortuaire || ''}
                  onChange={(e) =>
                    updateLogistique('housse_mortuaire', e.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="">Aucune</option>
                  <option value="standard">Standard — 50 €</option>
                  <option value="requise">Requise — 100 €</option>
                </select>
              </div>
              {type === 'rapatriement' && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '1.5rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={logistique.zinc === true}
                      onChange={(e) =>
                        updateLogistique('zinc', e.target.checked)
                      }
                    />
                    <label>Zinc transport aérien — 70 €</label>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '1.5rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={logistique.housse_cercueil === true}
                      onChange={(e) =>
                        updateLogistique('housse_cercueil', e.target.checked)
                      }
                    />
                    <label>Housse cercueil — 18 €</label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CONCESSION NUMÉRO & DIVISION */}
          {type === 'inhumation_locale' && (
            <>
              <div>
                <label>N° Concession</label>
                <input
                  value={logistique.numero_concession}
                  onChange={(e) =>
                    updateLogistique('numero_concession', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label>Division</label>
                <input
                  value={logistique.division_concession}
                  onChange={(e) =>
                    updateLogistique('division_concession', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 'bold' }}>Mairie du décès</label>
            <RechercheGoogleLieu
              value={logistique.mairie_deces_nom || ''}
              onChange={(val) => updateLogistique('mairie_deces_nom', val)}
              placeholder="Rechercher une mairie..."
              style={inputStyle}
              types={['establishment']}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 'bold' }}>
              Mosquée / Lieu de culte
            </label>
            <RechercheGoogleLieu
              value={logistique.mosquee_nom || ''}
              onChange={(val) => updateLogistique('mosquee_nom', val)}
              placeholder="Rechercher une mosquée ou lieu de culte..."
              style={inputStyle}
              types={['establishment']}
            />
          </div>

          <div>
            <label>Taille du défunt</label>
            <select
              value={logistique.taille_defunt}
              onChange={(e) =>
                updateLogistique('taille_defunt', e.target.value)
              }
              style={selectStyle}
            >
              <option value="">--</option>
              <option>Fœtus</option>
              <option>Enfant - 1 m</option>
              <option>{'< 1,60 m'}</option>
              <option>{'< 1,70 m'}</option>
              <option>{'< 1,80 m'}</option>
              <option>{'< 1,90 m'}</option>
              <option>{'< 2 m'}</option>
              <option>{'> 2 m'}</option>
            </select>
          </div>
          <div>
            <label>Immatriculation véhicule</label>
            <select
              value={logistique.immatriculation_vehicule}
              onChange={(e) =>
                updateLogistique('immatriculation_vehicule', e.target.value)
              }
              style={selectStyle}
            >
              <option value="">-- Sélectionner --</option>
              {vehicules.map((v) => (
                <option key={v.id} value={v.immatriculation}>
                  {v.immatriculation} — {v.marque} {v.modele}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Convoi effectué par</label>
            <select
              value={logistique.convoi_effectue_par}
              onChange={(e) =>
                updateLogistique('convoi_effectue_par', e.target.value)
              }
              style={selectStyle}
            >
              <option value="">-- Sélectionner --</option>
              {employes.map((e) => (
                <option key={e.id} value={`${e.prenom} ${e.nom}`}>
                  {e.prenom} {e.nom} — {e.poste}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Heure de présentation</label>
            <input
              type="time"
              value={logistique.heure_presentation}
              onChange={(e) =>
                updateLogistique('heure_presentation', e.target.value)
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label>Toilette rituelle le</label>
            <input
              type="date"
              value={logistique.date_toilette}
              onChange={(e) =>
                updateLogistique('date_toilette', e.target.value)
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label>Heure</label>
            <input
              type="time"
              value={logistique.heure_toilette}
              onChange={(e) =>
                updateLogistique('heure_toilette', e.target.value)
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label>Mise en bière le</label>
            <input
              type="date"
              value={logistique.date_meb}
              onChange={(e) => updateLogistique('date_meb', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Heure</label>
            <input
              type="time"
              value={logistique.heure_meb}
              onChange={(e) => updateLogistique('heure_meb', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label>Fermeture & Départ le</label>
            <input
              type="date"
              value={logistique.date_fermeture_depart}
              onChange={(e) =>
                updateLogistique('date_fermeture_depart', e.target.value)
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label>Heure</label>
            <input
              type="time"
              value={logistique.heure_fermeture_depart}
              onChange={(e) =>
                updateLogistique('heure_fermeture_depart', e.target.value)
              }
              style={inputStyle}
            />
          </div>

          {type === 'inhumation_locale' && (
            <>
              <div>
                <label>Inhumation le</label>
                <input
                  type="date"
                  value={logistique.date_inhumation}
                  onChange={(e) =>
                    updateLogistique('date_inhumation', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label>Heure</label>
                <input
                  type="time"
                  value={logistique.heure_inhumation}
                  onChange={(e) =>
                    updateLogistique('heure_inhumation', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* MARBRIER & TRAVAUX */}
          {type === 'inhumation_locale' && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #eee',
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginBottom: '0.75rem',
                }}
              >
                🏗️ Marbrier & Travaux
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Marbrier</label>
                  <select
                    value={logistique.marbrier_id}
                    onChange={(e) =>
                      updateLogistique('marbrier_id', e.target.value)
                    }
                    style={selectStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {marbriers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom} — {m.ville}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Travaux à réaliser</label>
                  <textarea
                    value={logistique.travaux_realiser}
                    onChange={(e) =>
                      updateLogistique('travaux_realiser', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      height: '70px',
                    }}
                    placeholder="ex: Ouverture, fermeture, pose semelle..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* IML */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#f0f4ff',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #c7d7f5',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '13px',
                marginBottom: '0.75rem',
                color: '#4F46E5',
              }}
            >
              🏥 IML (si applicable)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div>
                <label>N° Dossier IML</label>
                <input
                  value={logistique.numero_dossier_iml}
                  onChange={(e) =>
                    updateLogistique('numero_dossier_iml', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label>Docteur certificat</label>
                <input
                  value={logistique.nom_docteur_certificat}
                  onChange={(e) =>
                    updateLogistique('nom_docteur_certificat', e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label>Taille (m)</label>
                <input
                  value={logistique.taille_iml}
                  onChange={(e) =>
                    updateLogistique('taille_iml', e.target.value)
                  }
                  style={inputStyle}
                  placeholder="ex: 1.75"
                />
              </div>
              <div>
                <label>Épaulement (cm)</label>
                <input
                  value={logistique.epaulement_iml}
                  onChange={(e) =>
                    updateLogistique('epaulement_iml', e.target.value)
                  }
                  style={inputStyle}
                  placeholder="ex: 45"
                />
              </div>
              <div>
                <label>Poids (kg)</label>
                <input
                  value={logistique.poids_iml}
                  onChange={(e) =>
                    updateLogistique('poids_iml', e.target.value)
                  }
                  style={inputStyle}
                  placeholder="ex: 70"
                />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label>Observations</label>
            <textarea
              value={logistique.observations}
              onChange={(e) => updateLogistique('observations', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                height: '80px',
              }}
            />
          </div>

          {type === 'rapatriement' && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#FAECE7',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #993C1D',
              }}
            >
              <h4 style={{ color: '#993C1D', margin: '0 0 1rem' }}>
                ✈️ Fret aérien
              </h4>
              <div
                style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '1px solid #993C1D',
                }}
              >
                <label
                  style={{
                    fontWeight: 'bold',
                    color: '#993C1D',
                    fontSize: '13px',
                  }}
                >
                  🌍 Destination — pré-remplit compagnie et aéroport
                </label>
                <select
                  value={logistique.destination_id}
                  onChange={(e) => choisirDestination(e.target.value)}
                  style={{ ...selectStyle, marginTop: '0.5rem' }}
                >
                  <option value="">-- Choisir la destination --</option>
                  {tarifsRapatriement.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.compagnie}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div>
                  <label>Compagnie aérienne</label>
                  <input
                    value={logistique.compagnie_aerienne}
                    onChange={(e) =>
                      updateLogistique('compagnie_aerienne', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: Air Algérie"
                  />
                </div>
                <div>
                  <label>N° de vol</label>
                  <input
                    value={logistique.numero_vol}
                    onChange={(e) =>
                      updateLogistique('numero_vol', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: AH1234"
                  />
                </div>
                <div>
                  <label>LTA</label>
                  <input
                    value={logistique.lta}
                    onChange={(e) => updateLogistique('lta', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° Passeport défunt</label>
                  <input
                    value={logistique.numero_passeport}
                    onChange={(e) =>
                      updateLogistique('numero_passeport', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Aéroport de départ</label>
                  <input
                    value={logistique.aeroport_depart}
                    onChange={(e) =>
                      updateLogistique('aeroport_depart', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: CDG"
                  />
                </div>
                <div>
                  <label>Date du vol</label>
                  <input
                    type="date"
                    value={logistique.date_vol}
                    onChange={(e) =>
                      updateLogistique('date_vol', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Heure de départ</label>
                  <input
                    type="time"
                    value={logistique.heure_depart_vol}
                    onChange={(e) =>
                      updateLogistique('heure_depart_vol', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>{"Aéroport d'arrivée"}</label>
                  <input
                    value={logistique.aeroport_arrivee}
                    onChange={(e) =>
                      updateLogistique('aeroport_arrivee', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: ALG"
                  />
                </div>
                <div>
                  <label>{"Heure d'arrivée"}</label>
                  <input
                    type="time"
                    value={logistique.heure_arrivee_vol}
                    onChange={(e) =>
                      updateLogistique('heure_arrivee_vol', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    gridColumn: '1 / -1',
                    borderTop: '1px dashed #993C1D',
                    paddingTop: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      color: '#993C1D',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    ✈️ Escale (optionnel)
                  </label>
                </div>
                <div>
                  <label>{"Aéroport d'escale"}</label>
                  <input
                    value={logistique.aeroport_escale}
                    onChange={(e) =>
                      updateLogistique('aeroport_escale', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: CMN"
                  />
                </div>
                <div>
                  <label>{"Heure d'arrivée escale"}</label>
                  <input
                    type="time"
                    value={logistique.heure_arrivee_escale}
                    onChange={(e) =>
                      updateLogistique('heure_arrivee_escale', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Date départ escale</label>
                  <input
                    type="date"
                    value={logistique.date_depart_escale}
                    onChange={(e) =>
                      updateLogistique('date_depart_escale', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° vol escale</label>
                  <input
                    value={logistique.numero_vol_escale}
                    onChange={(e) =>
                      updateLogistique('numero_vol_escale', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    gridColumn: '1 / -1',
                    borderTop: '1px dashed #993C1D',
                    paddingTop: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      color: '#993C1D',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    📞 Contact au pays
                  </label>
                </div>
                <div>
                  <label>Nom contact au pays</label>
                  <input
                    value={logistique.contact_pays}
                    onChange={(e) =>
                      updateLogistique('contact_pays', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Téléphone contact</label>
                  <input
                    value={logistique.telephone_contact_pays}
                    onChange={(e) =>
                      updateLogistique('telephone_contact_pays', e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Adresse contact au pays</label>
                  <input
                    value={logistique.adresse_contact_pays}
                    onChange={(e) =>
                      updateLogistique('adresse_contact_pays', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="ex: 12 rue Mohamed V, Alger"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Ambulance au pays</label>
                  <input
                    value={logistique.ambulance_pays}
                    onChange={(e) =>
                      updateLogistique('ambulance_pays', e.target.value)
                    }
                    style={inputStyle}
                    placeholder="Nom société ambulance"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {btnSuivant(() => setEtape(5))}
      </div>
    );
  }

  if (etape === 5) {
    if (dossierCree) {
      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '4rem' }}>✅</div>
          <h2>Dossier créé avec succès !</h2>
          <div
            style={{
              background: '#E1F5EE',
              border: '2px solid #0F6E56',
              borderRadius: '12px',
              padding: '2rem',
              margin: '2rem 0',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666' }}>
              Numéro système
            </div>
            <div
              style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0F6E56' }}
            >
              {dossierCree.numero_dossier}
            </div>
            {refs.reference_agence && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Votre référence
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#333',
                  }}
                >
                  {refs.reference_agence}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onRetour}
            style={{
              padding: '0.75rem 2rem',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        {header('Récapitulatif', 4, 'Étape 5/5')}
        {(refs.reference_agence ||
          refs.numero_devis ||
          refs.numero_bon_commande ||
          refs.numero_facture) && (
          <div
            style={{
              background: '#EEF2FF',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#4F46E5',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              📋 Références
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '13px',
              }}
            >
              {refs.reference_agence && (
                <span>
                  Dossier : <strong>{refs.reference_agence}</strong>
                </span>
              )}
              {refs.numero_devis && (
                <span>
                  Devis : <strong>{refs.numero_devis}</strong>
                </span>
              )}
              {refs.numero_bon_commande && (
                <span>
                  BC : <strong>{refs.numero_bon_commande}</strong>
                </span>
              )}
              {refs.numero_facture && (
                <span>
                  Facture : <strong>{refs.numero_facture}</strong>
                </span>
              )}
            </div>
          </div>
        )}
        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', color: '#4F46E5' }}>
            {type === 'inhumation_locale'
              ? '⚰️ Inhumation locale'
              : '✈️ Rapatriement'}
          </h3>
          <h4
            style={{
              color: '#333',
              borderBottom: '2px solid #eee',
              paddingBottom: '0.5rem',
            }}
          >
            Défunt
          </h4>
          {ligne(
            'Identité',
            `${defunt.civilite} ${defunt.prenom} ${defunt.nom}`
          )}
          {ligne(
            'Date de naissance',
            defunt.date_naissance
              ? `${defunt.date_naissance} (${calcAge(defunt.date_naissance)})`
              : '—'
          )}
          {ligne('Nationalité', defunt.nationalite)}
          {defunt.filiation_pere && ligne('Père', defunt.filiation_pere)}
          {defunt.filiation_mere && ligne('Mère', defunt.filiation_mere)}
          {ligne('Date de décès', defunt.date_deces)}
          {ligne('Heure de décès', defunt.heure_deces)}
          {ligne('Lieu de décès', defunt.lieu_deces)}

          <h4
            style={{
              color: '#333',
              borderBottom: '2px solid #eee',
              paddingBottom: '0.5rem',
              marginTop: '1.5rem',
            }}
          >
            Mandataire
          </h4>
          {ligne(
            'Identité',
            `${pouvoir.civilite} ${pouvoir.prenom} ${pouvoir.nom}`
          )}
          {ligne('Lien de parenté', pouvoir.lien_parente)}
          {ligne('Téléphone', pouvoir.telephone_1)}

          <h4
            style={{
              color: '#333',
              borderBottom: '2px solid #eee',
              paddingBottom: '0.5rem',
              marginTop: '1.5rem',
            }}
          >
            Logistique
          </h4>
          {ligne('Chambre mortuaire', logistique.chambre_mortuaire_nom)}
          {type === 'inhumation_locale' &&
            ligne('Cimetière', nomCimetiere(logistique.cimetiere_id))}
          {type === 'rapatriement' &&
            ligne('Cimetière au pays', logistique.cimetiere_pays)}
          {logistique.achat_concession &&
            ligne(
              'Concession',
              `${logistique.achat_concession.replace('_', ' ')} — ${parseFloat(
                logistique.montant_concession
              ).toFixed(2)} €`
            )}
          {logistique.numero_concession &&
            ligne('N° Concession', logistique.numero_concession)}
          {logistique.division_concession &&
            ligne('Division', logistique.division_concession)}
          {ligne('Mairie', logistique.mairie_deces_nom)}
          {ligne('Mosquée', logistique.mosquee_nom)}
          {ligne('Date MEB', logistique.date_meb)}
          {type === 'inhumation_locale' &&
            ligne('Date inhumation', logistique.date_inhumation)}
          {logistique.marbrier_id &&
            ligne('Marbrier', nomMarbrier(logistique.marbrier_id))}
          {logistique.numero_dossier_iml &&
            ligne('N° IML', logistique.numero_dossier_iml)}

          {type === 'rapatriement' && (
            <>
              <h4
                style={{
                  color: '#993C1D',
                  borderBottom: '2px solid #FAECE7',
                  paddingBottom: '0.5rem',
                  marginTop: '1.5rem',
                }}
              >
                ✈️ Fret aérien
              </h4>
              {ligne('Compagnie', logistique.compagnie_aerienne)}
              {ligne('N° vol', logistique.numero_vol)}
              {ligne('LTA', logistique.lta)}
              {ligne('Aéroport départ', logistique.aeroport_depart)}
              {ligne('Date vol', logistique.date_vol)}
              {ligne('Heure départ', logistique.heure_depart_vol)}
              {ligne("Aéroport d'arrivée", logistique.aeroport_arrivee)}
              {logistique.aeroport_escale &&
                ligne('Escale', logistique.aeroport_escale)}
              {ligne('Contact au pays', logistique.contact_pays)}
            </>
          )}
        </div>
        <button
          onClick={sauvegarder}
          disabled={saving}
          style={{
            width: '100%',
            padding: '1rem',
            background: saving ? '#ccc' : '#0F6E56',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {saving ? '⏳ Enregistrement...' : '✅ Créer le dossier'}
        </button>
      </div>
    );
  }

  return null;
}
