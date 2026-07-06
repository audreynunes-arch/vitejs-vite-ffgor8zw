import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

interface Props {
  dossierId: string;
  onRetour: () => void;
  onDevis: () => void;
  onDocuments: () => void;
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

export default function DossierDetail({
  dossierId,
  onRetour,
  onDevis,
  onDocuments,
}: Props) {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'vue' | 'edition'>('vue');
  const [saving, setSaving] = useState(false);
  const [marbriers, setMarbriers] = useState<any[]>([]);

  const [defunt, setDefunt] = useState<any>({});
  const [pouvoir, setPouvoir] = useState<any>({});
  const [poseMonument, setPoseMonument] = useState(false);
  const [infos, setInfos] = useState<any>({});

  const [cimetieres, setCimetieres] = useState<any[]>([]);
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [catalogueCercueils, setCatalogueCercueils] = useState<any[]>([]);
  const [prestationsCreusement, setPrestationsCreusement] = useState<any[]>([]);
  const [tarifsRapatriement, setTarifsRapatriement] = useState<any[]>([]);
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [employes, setEmployes] = useState<any[]>([]);
  const [cimetiereTarifs, setCimetiereTarifs] = useState<any>(null);
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

  function choisirCimetiere(id: string) {
    setInfos((p: any) => ({
      ...p,
      cimetiere_id: id,
      achat_concession: '',
      montant_concession: '',
    }));
    const cim = cimetieres.find((c) => c.id === id);
    setCimetiereTarifs(cim || null);
  }

  function choisirConcession(val: string) {
    if (!cimetiereTarifs) return;
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
    setInfos((p: any) => ({
      ...p,
      achat_concession: val,
      montant_concession: val ? String(prix || 0) : '',
    }));
  }

  function choisirDestination(id: string) {
    const t = tarifsRapatriement.find((t) => t.id === id);
    setInfos((p: any) => ({
      ...p,
      destination_id: id,
      compagnie_aerienne: t ? t.compagnie || p.compagnie_aerienne : p.compagnie_aerienne,
      aeroport_depart: t ? t.aeroport_depart || p.aeroport_depart : p.aeroport_depart,
    }));
  }

  useEffect(() => {
    if (dossierId) charger();
    supabase
      .from('marbriers')
      .select('id, nom, ville')
      .order('nom')
      .then(({ data }) => setMarbriers(data || []));
  }, [dossierId]);

  async function charger() {
    setLoading(true);
    const { data, error } = await supabase
      .from('dossiers')
      .select(
        `
      *,
      defunts (*),
      pouvoirs (*),
      agences (nom),
      utilisateurs!dossiers_utilisateur_id_fkey (nom, prenom),
      modificateur:utilisateurs!dossiers_modifie_par_fkey (nom, prenom),
      cimetieres!dossiers_cimetiere_id_fkey (nom, ville, telephone),
      mairies!dossiers_mairie_deces_id_fkey (commune, telephone),
      etablissements_sante (nom, ville, telephone),
      marbriers (nom, ville)
    `
      )
      .eq('id', dossierId)
      .single();
    console.log('data:', data);
    console.log('error:', JSON.stringify(error));
    setDossier(data);
    if (data) {
      setDefunt(data.defunts || {});
      setPouvoir(data.pouvoirs?.[0] || {});
      setPoseMonument(!!(data.cimetiere_id || data.numero_concession));
      setInfos({
        compte_client: data.compte_client || '',
        numero_devis: data.numero_devis || '',
        numero_facture: data.numero_facture || '',
        numero_bon_commande: data.numero_bon_commande || '',
        date_deces: data.date_deces || '',
        heure_deces: data.heure_deces || '',
        lieu_deces: data.lieu_deces || '',
        nom_medecin: data.nom_medecin || '',
        date_toilette: data.date_toilette || '',
        heure_toilette: data.heure_toilette || '',
        afficher_toilette:
          data.afficher_toilette === undefined || data.afficher_toilette === null
            ? true
            : data.afficher_toilette,
        date_meb: data.date_meb || '',
        heure_meb: data.heure_meb || '',
        date_fermeture_depart: data.date_fermeture_depart || '',
        heure_fermeture_depart: data.heure_fermeture_depart || '',
        date_inhumation: data.date_inhumation || '',
        heure_inhumation: data.heure_inhumation || '',
        heure_salat: data.heure_salat || '',
        taille_defunt: data.taille_defunt || '',
        convoi_effectue_par: data.convoi_effectue_par || '',
        observations: data.observations || '',
        statut: data.statut || 'en_cours',
        immatriculation_vehicule: data.immatriculation_vehicule || '',
        numero_concession: data.numero_concession || '',
        division_concession: data.division_concession || '',
        marbrier_id: data.marbrier_id || '',
        travaux_realiser: data.travaux_realiser || '',
        numero_dossier_iml: data.numero_dossier_iml || '',
        taille_iml: data.taille_iml || '',
        epaulement_iml: data.epaulement_iml || '',
        poids_iml: data.poids_iml || '',
        nom_docteur_certificat: data.nom_docteur_certificat || '',
        heure_presentation: data.heure_presentation || '',
        // Rapatriement
        compagnie_aerienne: data.compagnie_aerienne || '',
        numero_vol: data.numero_vol || '',
        lta: data.lta || '',
        aeroport_depart: data.aeroport_depart || '',
        heure_depart_vol: data.heure_depart_vol || '',
        date_vol: data.date_vol || '',
        aeroport_escale: data.aeroport_escale || '',
        heure_arrivee_escale: data.heure_arrivee_escale || '',
        date_depart_escale: data.date_depart_escale || '',
        numero_vol_escale: data.numero_vol_escale || '',
        aeroport_arrivee: data.aeroport_arrivee || '',
        heure_arrivee_vol: data.heure_arrivee_vol || '',
        numero_passeport: data.numero_passeport || '',
        contact_pays: data.contact_pays || '',
        telephone_contact_pays: data.telephone_contact_pays || '',
        ambulance_pays: data.ambulance_pays || '',
        cimetiere_pays: data.cimetiere_pays || '',
        // Champs ajoutés (alignés sur la création)
        partenaire_id: data.partenaire_id || '',
        cimetiere_id: data.cimetiere_id || '',
        achat_concession: data.achat_concession || '',
        montant_concession:
          data.montant_concession !== null &&
          data.montant_concession !== undefined
            ? String(data.montant_concession)
            : '',
        cercueil_id: data.cercueil_id || '',
        plaque_identite: data.plaque_identite || '',
        housse_mortuaire: data.housse_mortuaire || '',
        zinc: data.zinc === true,
        housse_cercueil: data.housse_cercueil === true,
        creusement_type: data.creusement_type || '',
        creusement_prix:
          data.creusement_prix !== null && data.creusement_prix !== undefined
            ? String(data.creusement_prix)
            : '',
        chambre_mortuaire_nom: data.chambre_mortuaire_nom || '',
        mosquee_nom: data.mosquee_nom || '',
        mairie_deces_nom: data.mairie_deces_nom || '',
        declarant: data.declarant || '',
        destination_id: data.destination_id || '',
        adresse_contact_pays: data.adresse_contact_pays || '',
      });

      // Charger les listes (filtrées par l'agence du dossier)
      const ag = data.agence_id;
      supabase
        .from('cimetieres')
        .select(
          'id, nom, ville, code_postal, tarif_10ans_adulte, tarif_15ans_adulte, tarif_30ans_adulte, tarif_50ans_adulte, tarif_perpet_adulte, tarif_10ans_enfant, tarif_15ans_enfant, tarif_30ans_enfant, tarif_50ans_enfant, tarif_perpet_enfant, semelle_imposee, fausse_case_imposee'
        )
        .eq('agence_id', ag)
        .order('nom')
        .then(({ data: cims }) => {
          setCimetieres(cims || []);
          if (data.cimetiere_id) {
            const cim = (cims || []).find((c) => c.id === data.cimetiere_id);
            setCimetiereTarifs(cim || null);
          }
        });
      supabase
        .from('partenaires')
        .select('id, nom, type')
        .eq('actif', true)
        .eq('agence_id', ag)
        .order('nom')
        .then(({ data: parts }) => setPartenaires(parts || []));
      supabase
        .from('catalogue_cercueils')
        .select('*')
        .eq('actif', true)
        .eq('agence_id', ag)
        .order('ordre')
        .then(({ data: cerc }) => setCatalogueCercueils(cerc || []));
      supabase
        .from('prestations_creusement')
        .select('*')
        .eq('agence_id', ag)
        .order('ordre')
        .then(({ data: cre }) => setPrestationsCreusement(cre || []));
      supabase
        .from('tarifs_rapatriement')
        .select('*')
        .eq('agence_id', ag)
        .order('ordre')
        .then(({ data: tr }) => setTarifsRapatriement(tr || []));
      supabase
        .from('vehicules')
        .select('id, immatriculation, marque, modele')
        .eq('agence_id', ag)
        .order('immatriculation')
        .then(({ data: veh }) => setVehicules(veh || []));
      supabase
        .from('employes')
        .select('id, nom, prenom, poste')
        .eq('actif', true)
        .eq('agence_id', ag)
        .order('nom')
        .then(({ data: emp }) => setEmployes(emp || []));
    }
    setLoading(false);
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const monUserId = sessionData.session?.user.id || null;
      await supabase
        .from('defunts')
        .update({
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
          pere_statut: defunt.pere_statut || null,
          pere_adresse: defunt.pere_adresse || null,
          mere_statut: defunt.mere_statut || null,
          mere_adresse: defunt.mere_adresse || null,
        })
        .eq('id', dossier.defunt_id);

      const { error: errDossier } = await supabase
        .from('dossiers')
        .update({
          compte_client: infos.compte_client || null,
          numero_devis: infos.numero_devis || null,
          numero_facture: infos.numero_facture || null,
          numero_bon_commande: infos.numero_bon_commande || null,
          statut: infos.statut,
          date_deces: infos.date_deces || null,
          heure_deces: infos.heure_deces || null,
          lieu_deces: infos.lieu_deces || null,
          nom_medecin: infos.nom_medecin || null,
          date_toilette: infos.date_toilette || null,
          heure_toilette: infos.heure_toilette || null,
          afficher_toilette: infos.afficher_toilette,
          date_meb: infos.date_meb || null,
          heure_meb: infos.heure_meb || null,
          date_fermeture_depart: infos.date_fermeture_depart || null,
          heure_fermeture_depart: infos.heure_fermeture_depart || null,
          date_inhumation: infos.date_inhumation || null,
          heure_inhumation: infos.heure_inhumation || null,
          heure_salat: infos.heure_salat || null,
          taille_defunt: infos.taille_defunt || null,
          convoi_effectue_par: infos.convoi_effectue_par || null,
          observations: infos.observations || null,
          immatriculation_vehicule: infos.immatriculation_vehicule || null,
          numero_concession: infos.numero_concession || null,
          division_concession: infos.division_concession || null,
          marbrier_id: infos.marbrier_id || null,
          travaux_realiser: infos.travaux_realiser || null,
          numero_dossier_iml: infos.numero_dossier_iml || null,
          taille_iml: infos.taille_iml || null,
          epaulement_iml: infos.epaulement_iml || null,
          poids_iml: infos.poids_iml || null,
          nom_docteur_certificat: infos.nom_docteur_certificat || null,
          heure_presentation: infos.heure_presentation || null,
          compagnie_aerienne: infos.compagnie_aerienne || null,
          numero_vol: infos.numero_vol || null,
          lta: infos.lta || null,
          aeroport_depart: infos.aeroport_depart || null,
          heure_depart_vol: infos.heure_depart_vol || null,
          date_vol: infos.date_vol || null,
          aeroport_escale: infos.aeroport_escale || null,
          heure_arrivee_escale: infos.heure_arrivee_escale || null,
          date_depart_escale: infos.date_depart_escale || null,
          numero_vol_escale: infos.numero_vol_escale || null,
          aeroport_arrivee: infos.aeroport_arrivee || null,
          heure_arrivee_vol: infos.heure_arrivee_vol || null,
          numero_passeport: infos.numero_passeport || null,
          contact_pays: infos.contact_pays || null,
          telephone_contact_pays: infos.telephone_contact_pays || null,
          ambulance_pays: infos.ambulance_pays || null,
          cimetiere_pays: infos.cimetiere_pays || null,
          partenaire_id: infos.partenaire_id || null,
          cimetiere_id:
            dossier.type_dossier === 'inhumation_locale' ||
            dossier.type_dossier === 'devis_libre'
              ? infos.cimetiere_id || null
              : null,
          achat_concession: infos.achat_concession || null,
          montant_concession: infos.montant_concession
            ? parseFloat(infos.montant_concession)
            : null,
          cercueil_id: infos.cercueil_id || null,
          plaque_identite: infos.plaque_identite || null,
          housse_mortuaire: infos.housse_mortuaire || null,
          zinc: infos.zinc === true,
          housse_cercueil: infos.housse_cercueil === true,
          creusement_type: infos.creusement_type || null,
          creusement_prix: infos.creusement_prix
            ? parseFloat(infos.creusement_prix)
            : null,
          chambre_mortuaire_nom: infos.chambre_mortuaire_nom || null,
          mosquee_nom: infos.mosquee_nom || null,
          mairie_deces_nom: infos.mairie_deces_nom || null,
          declarant: infos.declarant || null,
          destination_id: infos.destination_id || null,
          adresse_contact_pays: infos.adresse_contact_pays || null,
          modifie_par: monUserId,
          modifie_le: new Date().toISOString(),
        })
        .eq('id', dossierId);

      if (errDossier) {
        alert('⚠️ Erreur enregistrement dossier : ' + errDossier.message);
        setSaving(false);
        return;
      }

      if (pouvoir.nom && pouvoir.prenom && dossier.pouvoirs?.[0]?.id) {
        await supabase
          .from('pouvoirs')
          .update({
            civilite: pouvoir.civilite || null,
            nom: pouvoir.nom,
            prenom: pouvoir.prenom,
            lien_parente: pouvoir.lien_parente || null,
            telephone_1: pouvoir.telephone_1 || null,
            telephone_2: pouvoir.telephone_2 || null,
            email: pouvoir.email || null,
            adresse: pouvoir.adresse || null,
          })
          .eq('id', dossier.pouvoirs[0].id);
      }
      // Décrémentation stock si statut passe à validé
      if (
        infos.statut === 'valide' &&
        dossier.statut !== 'valide' &&
        dossier.cercueil_id
      ) {
        const { data: stock } = await supabase
          .from('stocks_cercueils')
          .select('*')
          .eq('cercueil_id', dossier.cercueil_id)
          .eq('agence_id', dossier.agence_id)
          .single();

        if (stock) {
          await supabase
            .from('stocks_cercueils')
            .update({ quantite: Math.max(0, stock.quantite - 1) })
            .eq('id', stock.id);

          await supabase.from('mouvements_stock').insert({
            cercueil_id: dossier.cercueil_id,
            agence_id: dossier.agence_id,
            dossier_id: dossierId,
            type_mouvement: 'sortie',
            quantite: 1,
            notes: `Dossier ${dossier.numero_dossier} — ${dossier.defunts?.prenom} ${dossier.defunts?.nom}`,
          });
        }
      }

      await charger();
      setMode('vue');
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

  const ligne = (label: string, valeur: any) => (
    <div
      style={{
        display: 'flex',
        padding: '0.5rem 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <span style={{ color: '#888', minWidth: '220px', fontSize: '13px' }}>
        {label}
      </span>
      <span style={{ fontWeight: '500', fontSize: '14px' }}>
        {valeur || '—'}
      </span>
    </div>
  );

  const section = (titre: string) => (
    <h4
      style={{
        color: '#4F46E5',
        borderBottom: '2px solid #EEF2FF',
        paddingBottom: '0.5rem',
        marginTop: '1.5rem',
      }}
    >
      {titre}
    </h4>
  );

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
  if (!dossier) return <p style={{ padding: '2rem' }}>Dossier introuvable</p>;

  const d = dossier.defunts;
  const p = dossier.pouvoirs?.[0];
  const isRapat = dossier.type_dossier === 'rapatriement';
  const isDevisLibre = dossier.type_dossier === 'devis_libre';

  if (mode === 'edition') {
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
          <button onClick={() => setMode('vue')}>← Annuler</button>
          <h2 style={{ margin: 0 }}>✏️ Modifier le dossier</h2>
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>
            {dossier.numero_dossier}
          </span>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {section('📋 Références & Statut')}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label>Référence agence</label>
              <input
                value={infos.compte_client}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    compte_client: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Statut du dossier</label>
              <select
                value={infos.statut === 'annule' ? 'annule' : 'en_cours'}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, statut: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="en_cours">🔵 Actif</option>
                <option value="annule">❌ Annulé</option>
              </select>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                « Validé » et « Terminé » se mettent à jour automatiquement
                (validation du devis / date passée).
              </div>
            </div>
            <div>
              <label>N° Devis</label>
              <input
                value={infos.numero_devis}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, numero_devis: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>N° Facture</label>
              <input
                value={infos.numero_facture}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    numero_facture: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>N° Bon de commande</label>
              <input
                value={infos.numero_bon_commande}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    numero_bon_commande: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#FAEEDA',
                border: '2px solid #854F0B',
                borderRadius: '10px',
                padding: '1rem',
                marginTop: '0.5rem',
              }}
            >
              <label
                style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#854F0B',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                🤝 Partenaire / Assurance
              </label>
              <select
                value={infos.partenaire_id || ''}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, partenaire_id: e.target.value }))
                }
                style={{
                  ...selectStyle,
                  fontWeight: 'bold',
                  border: '2px solid #854F0B',
                  background: 'white',
                }}
              >
                <option value="">👤 Particulier (tarif normal)</option>
                {partenaires.map((pa) => (
                  <option key={pa.id} value={pa.id}>
                    🤝 {pa.nom} ({pa.type})
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: '12px',
                  color: '#854F0B',
                  marginTop: '0.5rem',
                }}
              >
                ⚠️ Le devis se base sur ce partenaire (refais le devis si tu le
                changes).
              </div>
            </div>
          </div>

          {isDevisLibre && (
            <>
              {section('👤 Informations client')}
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
                    value={pouvoir.civilite || ''}
                    onChange={(e) =>
                      setPouvoir((p: any) => ({
                        ...p,
                        civilite: e.target.value,
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="">--</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                    <option value="Société">Société</option>
                  </select>
                </div>
                <div>
                  <label>Nom / Société</label>
                  <input
                    value={pouvoir.nom || ''}
                    onChange={(e) =>
                      setPouvoir((p: any) => ({ ...p, nom: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Prénom / Contact</label>
                  <input
                    value={pouvoir.prenom || ''}
                    onChange={(e) =>
                      setPouvoir((p: any) => ({ ...p, prenom: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Adresse</label>
                  <AutocompleteAdresse
                    value={pouvoir.adresse || ''}
                    onChange={(val) =>
                      setPouvoir((p: any) => ({ ...p, adresse: val }))
                    }
                    placeholder="Adresse du client"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Téléphone</label>
                  <input
                    value={pouvoir.telephone_1 || ''}
                    onChange={(e) =>
                      setPouvoir((p: any) => ({
                        ...p,
                        telephone_1: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    value={pouvoir.email || ''}
                    onChange={(e) =>
                      setPouvoir((p: any) => ({ ...p, email: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Référence défunt / objet</label>
                  <input
                    value={defunt.nom || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({ ...p, nom: e.target.value }))
                    }
                    style={inputStyle}
                    placeholder="ex: KHEMIRI Bechir, ou objet de la prestation"
                  />
                </div>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '1rem 0',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#185FA5',
                }}
              >
                <input
                  type="checkbox"
                  checked={poseMonument}
                  onChange={(e) => setPoseMonument(e.target.checked)}
                />
                🪨 Pose de monument (cimetière, marbrier, concession)
              </label>
              {poseMonument && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <label>Lien de parenté</label>
                    <input
                      value={pouvoir.lien_parente || ''}
                      onChange={(e) =>
                        setPouvoir((p: any) => ({
                          ...p,
                          lien_parente: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label>Cimetière</label>
                    <select
                      value={infos.cimetiere_id || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          cimetiere_id: e.target.value,
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value="">-- Choisir --</option>
                      {cimetieres.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Marbrier</label>
                    <select
                      value={infos.marbrier_id || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          marbrier_id: e.target.value,
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value="">-- Choisir --</option>
                      {marbriers.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>N° de concession</label>
                    <input
                      value={infos.numero_concession || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          numero_concession: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label>Date des travaux</label>
                    <input
                      type="date"
                      value={infos.date_inhumation || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          date_inhumation: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label>Heure des travaux</label>
                    <input
                      type="time"
                      value={infos.heure_inhumation || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          heure_inhumation: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Travaux à réaliser</label>
                    <textarea
                      value={infos.travaux_realiser || ''}
                      onChange={(e) =>
                        setInfos((p: any) => ({
                          ...p,
                          travaux_realiser: e.target.value,
                        }))
                      }
                      style={{ ...inputStyle, minHeight: '70px' }}
                      placeholder="ex: Creusement, pose semelle, dépose/repose monument…"
                    />
                  </div>
                </div>
              )}
            </>
          )}
          {!isDevisLibre && (
            <>
          {section('👤 Défunt')}
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
                value={defunt.civilite || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, civilite: e.target.value }))
                }
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
                value={defunt.sexe || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, sexe: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="">--</option>
                <option>Masculin</option>
                <option>Féminin</option>
              </select>
            </div>
            <div>
              <label>Nom</label>
              <input
                value={defunt.nom || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, nom: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Prénom</label>
              <input
                value={defunt.prenom || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, prenom: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Nom de jeune fille</label>
              <input
                value={defunt.nom_jeune_fille || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({
                    ...p,
                    nom_jeune_fille: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Nationalité</label>
              <input
                value={defunt.nationalite || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, nationalite: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Date de naissance</label>
              <input
                type="date"
                value={defunt.date_naissance || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({
                    ...p,
                    date_naissance: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Lieu de naissance</label>
              <input
                value={defunt.lieu_naissance || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({
                    ...p,
                    lieu_naissance: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Profession</label>
              <input
                value={defunt.profession || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, profession: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Situation familiale</label>
              <select
                value={defunt.situation_familiale || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({
                    ...p,
                    situation_familiale: e.target.value,
                  }))
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
                value={defunt.epoux || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, epoux: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Domicile</label>
              <input
                value={defunt.domicile || ''}
                onChange={(e) =>
                  setDefunt((p: any) => ({ ...p, domicile: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
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
                    value={defunt.filiation_pere || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        filiation_pere: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Nom de la mère</label>
                  <input
                    value={defunt.filiation_mere || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        filiation_mere: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Père (vivant / décédé)</label>
                  <select
                    value={defunt.pere_statut || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        pere_statut: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">—</option>
                    <option value="Vivant">Vivant</option>
                    <option value="Décédé">Décédé</option>
                  </select>
                </div>
                <div>
                  <label>Adresse du père</label>
                  <input
                    value={defunt.pere_adresse || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        pere_adresse: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Mère (vivante / décédée)</label>
                  <select
                    value={defunt.mere_statut || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        mere_statut: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">—</option>
                    <option value="Vivant">Vivante</option>
                    <option value="Décédé">Décédée</option>
                  </select>
                </div>
                <div>
                  <label>Adresse de la mère</label>
                  <input
                    value={defunt.mere_adresse || ''}
                    onChange={(e) =>
                      setDefunt((p: any) => ({
                        ...p,
                        mere_adresse: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {section('⚰️ Décès')}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label>Date de décès</label>
              <input
                type="date"
                value={infos.date_deces}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, date_deces: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure de décès</label>
              <input
                type="time"
                value={infos.heure_deces}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, heure_deces: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Lieu de décès</label>
              <input
                value={infos.lieu_deces}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, lieu_deces: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Nom du médecin</label>
              <input
                value={infos.nom_medecin}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, nom_medecin: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>

          {section('📋 Mandataire')}
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
                value={pouvoir.civilite || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({ ...p, civilite: e.target.value }))
                }
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
                value={pouvoir.lien_parente || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({
                    ...p,
                    lien_parente: e.target.value,
                  }))
                }
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
              </select>
            </div>
            <div>
              <label>Nom</label>
              <input
                value={pouvoir.nom || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({ ...p, nom: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Prénom</label>
              <input
                value={pouvoir.prenom || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({ ...p, prenom: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Adresse</label>
              <input
                value={pouvoir.adresse || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({ ...p, adresse: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Téléphone 1</label>
              <input
                value={pouvoir.telephone_1 || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({
                    ...p,
                    telephone_1: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Téléphone 2</label>
              <input
                value={pouvoir.telephone_2 || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({
                    ...p,
                    telephone_2: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Email</label>
              <input
                type="email"
                value={pouvoir.email || ''}
                onChange={(e) =>
                  setPouvoir((p: any) => ({ ...p, email: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>

          {section('🗓️ Logistique')}
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
                value={infos.chambre_mortuaire_nom || ''}
                onChange={(val) =>
                  setInfos((p: any) => ({ ...p, chambre_mortuaire_nom: val }))
                }
                placeholder="Rechercher une chambre mortuaire ou funérarium..."
                style={inputStyle}
                types={['establishment']}
              />
            </div>

            {!isRapat && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold' }}>Cimetière</label>
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
                    value={deptCimetiere}
                    onChange={(e) => setDeptCimetiere(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">-- Tous les départements --</option>
                    {departements.map((dp) => (
                      <option key={dp.code} value={dp.code}>
                        {dp.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={infos.cimetiere_id || ''}
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

            {!isRapat && cimetiereTarifs && (
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
                  value={infos.achat_concession || ''}
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
                      Perpétuelle adulte — {cimetiereTarifs.tarif_perpet_adulte}{' '}
                      €
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
                      Perpétuelle enfant —{' '}
                      {cimetiereTarifs.tarif_perpet_enfant} €
                    </option>
                  )}
                </select>
                {infos.montant_concession &&
                  parseFloat(infos.montant_concession) > 0 && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontWeight: 'bold',
                        color: '#854F0B',
                      }}
                    >
                      Montant :{' '}
                      {parseFloat(infos.montant_concession).toFixed(2)} €
                    </div>
                  )}
              </div>
            )}

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
                    value={infos.cercueil_id || ''}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        cercueil_id: e.target.value,
                      }))
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
                    value={infos.plaque_identite || ''}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        plaque_identite: e.target.value,
                      }))
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
                    value={infos.housse_mortuaire || ''}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        housse_mortuaire: e.target.value,
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="">Aucune</option>
                    <option value="standard">Standard — 50 €</option>
                    <option value="requise">Requise — 100 €</option>
                  </select>
                </div>
                {isRapat && (
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
                        checked={infos.zinc === true}
                        onChange={(e) =>
                          setInfos((p: any) => ({
                            ...p,
                            zinc: e.target.checked,
                          }))
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
                        checked={infos.housse_cercueil === true}
                        onChange={(e) =>
                          setInfos((p: any) => ({
                            ...p,
                            housse_cercueil: e.target.checked,
                          }))
                        }
                      />
                      <label>Housse cercueil — 18 €</label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isRapat && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Creusement / Inhumation</label>
                <select
                  value={infos.creusement_type || ''}
                  onChange={(e) => {
                    const presta = prestationsCreusement.find(
                      (pc) => pc.libelle === e.target.value
                    );
                    setInfos((p: any) => ({
                      ...p,
                      creusement_type: e.target.value,
                      creusement_prix: presta ? String(presta.prix) : '',
                    }));
                  }}
                  style={selectStyle}
                >
                  <option value="">-- Sélectionner --</option>
                  {prestationsCreusement.map((pc) => (
                    <option key={pc.id} value={pc.libelle}>
                      {pc.libelle} — {pc.prix} €
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold' }}>Mairie du décès</label>
              <RechercheGoogleLieu
                value={infos.mairie_deces_nom || ''}
                onChange={(val) =>
                  setInfos((p: any) => ({ ...p, mairie_deces_nom: val }))
                }
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
                value={infos.mosquee_nom || ''}
                onChange={(val) =>
                  setInfos((p: any) => ({ ...p, mosquee_nom: val }))
                }
                placeholder="Rechercher une mosquée ou lieu de culte..."
                style={inputStyle}
                types={['establishment']}
              />
            </div>

            <div>
              <label>Déclarant</label>
              <select
                value={infos.declarant || ''}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, declarant: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="">-- Sélectionner --</option>
                {employes.map((em) => (
                  <option key={em.id} value={`${em.prenom} ${em.nom}`}>
                    {em.prenom} {em.nom} — {em.poste}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Taille du défunt</label>
              <select
                value={infos.taille_defunt}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    taille_defunt: e.target.value,
                  }))
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
                value={infos.immatriculation_vehicule}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    immatriculation_vehicule: e.target.value,
                  }))
                }
                style={selectStyle}
              >
                <option value="">-- Sélectionner un véhicule --</option>
                {vehicules.map((v) => (
                  <option key={v.id} value={v.immatriculation}>
                    {v.immatriculation}
                    {v.marque ? ` — ${v.marque}` : ''}
                    {v.modele ? ` ${v.modele}` : ''}
                  </option>
                ))}
                {infos.immatriculation_vehicule &&
                  !vehicules.some(
                    (v) => v.immatriculation === infos.immatriculation_vehicule
                  ) && (
                    <option value={infos.immatriculation_vehicule}>
                      {infos.immatriculation_vehicule} (actuel)
                    </option>
                  )}
              </select>
            </div>
            <div>
              <label>Convoi effectué par</label>
              <input
                value={infos.convoi_effectue_par}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    convoi_effectue_par: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure de présentation</label>
              <input
                type="time"
                value={infos.heure_presentation}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    heure_presentation: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Toilette rituelle le</label>
              <input
                type="date"
                value={infos.date_toilette}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    date_toilette: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure</label>
              <input
                type="time"
                value={infos.heure_toilette}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    heure_toilette: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#FAEEDA',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: '1px solid #854F0B',
              }}
            >
              <input
                type="checkbox"
                id="afficher_toilette"
                checked={infos.afficher_toilette !== false}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    afficher_toilette: e.target.checked,
                  }))
                }
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label
                htmlFor="afficher_toilette"
                style={{ cursor: 'pointer', fontSize: '14px', color: '#854F0B' }}
              >
                🕌 Afficher la toilette rituelle sur le document Déroulement
              </label>
            </div>
            <div>
              <label>Mise en bière le</label>
              <input
                type="date"
                value={infos.date_meb}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, date_meb: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure</label>
              <input
                type="time"
                value={infos.heure_meb}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, heure_meb: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Fermeture & Départ le</label>
              <input
                type="date"
                value={infos.date_fermeture_depart}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    date_fermeture_depart: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure</label>
              <input
                type="time"
                value={infos.heure_fermeture_depart}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    heure_fermeture_depart: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label>Heure Salat Al Janāza</label>
              <input
                type="time"
                value={infos.heure_salat || ''}
                onChange={(e) =>
                  setInfos((p: any) => ({
                    ...p,
                    heure_salat: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            {!isRapat && (
              <>
                <div>
                  <label>Inhumation le</label>
                  <input
                    type="date"
                    value={infos.date_inhumation}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        date_inhumation: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Heure</label>
                  <input
                    type="time"
                    value={infos.heure_inhumation}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        heure_inhumation: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° Concession</label>
                  <input
                    value={infos.numero_concession}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        numero_concession: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Division</label>
                  <input
                    value={infos.division_concession}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        division_concession: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Marbrier</label>
                  <select
                    value={infos.marbrier_id}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        marbrier_id: e.target.value,
                      }))
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
                    value={infos.travaux_realiser}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        travaux_realiser: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      height: '70px',
                    }}
                  />
                </div>
              </>
            )}
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
                🏥 IML
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
                    value={infos.numero_dossier_iml}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        numero_dossier_iml: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Docteur certificat</label>
                  <input
                    value={infos.nom_docteur_certificat}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        nom_docteur_certificat: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Taille (m)</label>
                  <input
                    value={infos.taille_iml}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        taille_iml: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Épaulement (cm)</label>
                  <input
                    value={infos.epaulement_iml}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        epaulement_iml: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Poids (kg)</label>
                  <input
                    value={infos.poids_iml}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        poids_iml: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Observations</label>
              <textarea
                value={infos.observations}
                onChange={(e) =>
                  setInfos((p: any) => ({ ...p, observations: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  height: '80px',
                }}
              />
            </div>
          </div>

          {isRapat && (
            <>
              {section('✈️ Fret aérien')}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: 'white',
                    borderRadius: '6px',
                    padding: '0.75rem',
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
                    value={infos.destination_id || ''}
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
                <div>
                  <label>Cimetière au pays</label>
                  <input
                    value={infos.cimetiere_pays}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        cimetiere_pays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Compagnie aérienne</label>
                  <input
                    value={infos.compagnie_aerienne}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        compagnie_aerienne: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° de vol</label>
                  <input
                    value={infos.numero_vol}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        numero_vol: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>LTA</label>
                  <input
                    value={infos.lta}
                    onChange={(e) =>
                      setInfos((p: any) => ({ ...p, lta: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° Passeport</label>
                  <input
                    value={infos.numero_passeport}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        numero_passeport: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Aéroport départ</label>
                  <input
                    value={infos.aeroport_depart}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        aeroport_depart: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Date vol</label>
                  <input
                    type="date"
                    value={infos.date_vol}
                    onChange={(e) =>
                      setInfos((p: any) => ({ ...p, date_vol: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Heure départ</label>
                  <input
                    type="time"
                    value={infos.heure_depart_vol}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        heure_depart_vol: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Aéroport arrivée</label>
                  <input
                    value={infos.aeroport_arrivee}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        aeroport_arrivee: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Heure arrivée</label>
                  <input
                    type="time"
                    value={infos.heure_arrivee_vol}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        heure_arrivee_vol: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Escale</label>
                  <input
                    value={infos.aeroport_escale}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        aeroport_escale: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Heure arrivée escale</label>
                  <input
                    type="time"
                    value={infos.heure_arrivee_escale}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        heure_arrivee_escale: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Date départ escale</label>
                  <input
                    type="date"
                    value={infos.date_depart_escale}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        date_depart_escale: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>N° vol escale</label>
                  <input
                    value={infos.numero_vol_escale}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        numero_vol_escale: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Contact au pays</label>
                  <input
                    value={infos.contact_pays}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        contact_pays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Téléphone contact</label>
                  <input
                    value={infos.telephone_contact_pays}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        telephone_contact_pays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Adresse contact au pays</label>
                  <input
                    value={infos.adresse_contact_pays}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        adresse_contact_pays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Ambulance au pays</label>
                  <input
                    value={infos.ambulance_pays}
                    onChange={(e) =>
                      setInfos((p: any) => ({
                        ...p,
                        ambulance_pays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}
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
          {saving ? '⏳ Enregistrement...' : '💾 Sauvegarder les modifications'}
        </button>
      </div>
    );
  }
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
        <h2 style={{ margin: 0 }}>
          {isRapat ? '✈️' : '⚰️'} {d?.civilite} {d?.prenom} {d?.nom}
        </h2>
        <span
          style={{
            marginLeft: 'auto',
            background: statutColor(dossier.statut).bg,
            color: statutColor(dossier.statut).color,
            padding: '0.3rem 0.8rem',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {statutColor(dossier.statut).label}
        </span>
      </div>

      <div
        style={{
          background: '#EEF2FF',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#888' }}>Numéro système</div>
          <div style={{ fontWeight: 'bold', color: '#4F46E5' }}>
            {dossier.numero_dossier}
          </div>
        </div>
        {dossier.compte_client && (
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Référence agence
            </div>
            <div style={{ fontWeight: 'bold' }}>{dossier.compte_client}</div>
          </div>
        )}
        {dossier.numero_devis && (
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>N° Devis</div>
            <div style={{ fontWeight: 'bold' }}>{dossier.numero_devis}</div>
          </div>
        )}
        {dossier.numero_facture && (
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>N° Facture</div>
            <div style={{ fontWeight: 'bold' }}>{dossier.numero_facture}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '12px', color: '#888' }}>Agence</div>
          <div style={{ fontWeight: 'bold' }}>{dossier.agences?.nom}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#888' }}>Créé le</div>
          <div style={{ fontWeight: 'bold' }}>
            {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
        {dossier.utilisateurs && (
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>Créé par</div>
            <div style={{ fontWeight: 'bold' }}>
              {dossier.utilisateurs.prenom} {dossier.utilisateurs.nom}
            </div>
          </div>
        )}
        {dossier.modificateur && (
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Modifié en dernier par
            </div>
            <div style={{ fontWeight: 'bold' }}>
              {dossier.modificateur.prenom} {dossier.modificateur.nom}
              {dossier.modifie_le && (
                <span style={{ fontWeight: 'normal', color: '#888' }}>
                  {' '}
                  le {new Date(dossier.modifie_le).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {section('👤 Défunt')}
        {ligne('Civilité', d?.civilite)}
        {ligne('Nom', d?.nom)}
        {ligne('Prénom', d?.prenom)}
        {ligne('Nom de jeune fille', d?.nom_jeune_fille)}
        {ligne('Sexe', d?.sexe)}
        {ligne(
          'Date de naissance',
          d?.date_naissance
            ? new Date(d.date_naissance).toLocaleDateString('fr-FR')
            : null
        )}
        {ligne('Lieu de naissance', d?.lieu_naissance)}
        {ligne('Nationalité', d?.nationalite)}
        {ligne('Profession', d?.profession)}
        {ligne('Domicile', d?.domicile)}
        {ligne('Situation familiale', d?.situation_familiale)}
        {ligne('Époux / Épouse', d?.epoux)}
        {ligne('Père', d?.filiation_pere)}
        {ligne('Mère', d?.filiation_mere)}

        {section('⚰️ Décès')}
        {ligne(
          'Date de décès',
          dossier.date_deces
            ? new Date(dossier.date_deces).toLocaleDateString('fr-FR')
            : null
        )}
        {ligne('Heure de décès', dossier.heure_deces)}
        {ligne('Lieu de décès', dossier.lieu_deces)}
        {ligne('Nom du médecin', dossier.nom_medecin)}

        {p && (
          <>
            {section('📋 Mandataire (Pouvoir)')}
            {ligne('Identité', `${p.civilite || ''} ${p.prenom} ${p.nom}`)}
            {ligne('Lien de parenté', p.lien_parente)}
            {ligne('Adresse', p.adresse)}
            {ligne('Téléphone 1', p.telephone_1)}
            {ligne('Téléphone 2', p.telephone_2)}
            {ligne('Email', p.email)}
          </>
        )}

        {section('🏥 Logistique')}
        {ligne('Chambre mortuaire', dossier.etablissements_sante?.nom)}
        {!isRapat && ligne('Cimetière', dossier.cimetieres?.nom)}
        {isRapat && ligne('Cimetière au pays', dossier.cimetiere_pays)}
        {ligne('Mairie', dossier.mairies?.commune)}
        {ligne('Taille du défunt', dossier.taille_defunt)}
        {ligne('Immatriculation véhicule', dossier.immatriculation_vehicule)}
        {ligne('Convoi effectué par', dossier.convoi_effectue_par)}
        {ligne('Heure de présentation', dossier.heure_presentation)}
        {ligne(
          'Toilette rituelle',
          dossier.date_toilette
            ? new Date(dossier.date_toilette).toLocaleDateString('fr-FR')
            : null
        )}
        {ligne(
          'Mise en bière',
          dossier.date_meb
            ? new Date(dossier.date_meb).toLocaleDateString('fr-FR')
            : null
        )}
        {ligne(
          'Fermeture & Départ',
          dossier.date_fermeture_depart
            ? new Date(dossier.date_fermeture_depart).toLocaleDateString(
                'fr-FR'
              )
            : null
        )}
        {!isRapat &&
          ligne(
            'Inhumation',
            dossier.date_inhumation
              ? new Date(dossier.date_inhumation).toLocaleDateString('fr-FR')
              : null
          )}
        {!isRapat && ligne('N° Concession', dossier.numero_concession)}
        {!isRapat && ligne('Division', dossier.division_concession)}
        {!isRapat && ligne('Marbrier', dossier.marbriers?.nom)}
        {!isRapat && ligne('Travaux à réaliser', dossier.travaux_realiser)}
        {ligne('N° Dossier IML', dossier.numero_dossier_iml)}
        {ligne('Docteur certificat', dossier.nom_docteur_certificat)}
        {ligne('Taille IML', dossier.taille_iml)}
        {ligne('Épaulement IML', dossier.epaulement_iml)}
        {ligne('Poids IML', dossier.poids_iml)}
        {ligne('Observations', dossier.observations)}

        {isRapat && (
          <>
            {section('✈️ Fret aérien')}
            {ligne('Compagnie', dossier.compagnie_aerienne)}
            {ligne('N° vol', dossier.numero_vol)}
            {ligne('LTA', dossier.lta)}
            {ligne('N° Passeport', dossier.numero_passeport)}
            {ligne('Aéroport départ', dossier.aeroport_depart)}
            {ligne(
              'Date vol',
              dossier.date_vol
                ? new Date(dossier.date_vol).toLocaleDateString('fr-FR')
                : null
            )}
            {ligne('Heure départ', dossier.heure_depart_vol)}
            {ligne("Aéroport d'arrivée", dossier.aeroport_arrivee)}
            {ligne("Heure d'arrivée", dossier.heure_arrivee_vol)}
            {dossier.aeroport_escale &&
              ligne('Escale', dossier.aeroport_escale)}
            {ligne('Contact au pays', dossier.contact_pays)}
            {ligne('Téléphone contact', dossier.telephone_contact_pays)}
            {ligne('Ambulance au pays', dossier.ambulance_pays)}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setMode('edition')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ✏️ Modifier
        </button>
        <button
          onClick={onDevis}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#854F0B',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          💰 Devis / Facture
        </button>
        <button
          onClick={() => onDocuments()}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#0F6E56',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📄 Documents
        </button>
      </div>
    </div>
  );
}
