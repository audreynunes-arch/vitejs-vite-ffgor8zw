import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import html2pdf from 'html2pdf.js';

interface Props {
  dossierId: string;
  onRetour: () => void;
}

type Onglet =
  | 'pouvoir'
  | 'declaration_deces'
  | 'apres_meb'
  | 'declaration_avant_meb'
  | 'acquisition'
  | 'demande_inhumation'
  | 'bon_travaux'
  | 'passage_mosquee'
  | 'chambre_mortuaire'
  | 'iml'
  | 'prefectorale'
  | 'admission'
  | 'deroulement'
  | 'page_de_garde'
  | 'calendrier'
  | 'attestation_meb'
  | 'prefecture_rapat'
  | 'consulat_rapat'
  | 'attestation_toilette'
  | 'ambulance_rapat';

export default function Documents({ dossierId, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('pouvoir');
  const [dossier, setDossier] = useState<any>(null);
  const [gerant, setGerant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [afficherSalat, setAfficherSalat] = useState(true);
  const [afficherInhumation, setAfficherInhumation] = useState(true);
  const [afficherMeb, setAfficherMeb] = useState(true);
  const [afficherDepart, setAfficherDepart] = useState(true);

  useEffect(() => {
    charger();
  }, [dossierId]);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('dossiers')
      .select(
        `*, defunts (*), pouvoirs (*), agences (*),
        cimetieres!dossiers_cimetiere_id_fkey (nom, adresse, ville, code_postal, telephone, email, contact_nom),
        marbriers (nom, adresse, ville, telephone)`
      )
      .eq('id', dossierId)
      .single();
    setDossier(data);
    // Charger le gérant de l'agence (employé avec poste = gérant)
    if (data?.agence_id) {
      const { data: gerants } = await supabase
        .from('employes')
        .select('nom, prenom, poste')
        .eq('agence_id', data.agence_id)
        .ilike('poste', '%gérant%');
      setGerant(gerants && gerants.length > 0 ? gerants[0] : null);
    }
    setLoading(false);
  }

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
  if (!dossier) return <p style={{ padding: '2rem' }}>Dossier introuvable</p>;

  const d = dossier.defunts;
  const p = dossier.pouvoirs?.[0];
  const agence = dossier.agences;
  const cim = dossier.cimetieres;
  const _mairie = dossier.mairie_deces_nom;
  const etab = dossier.chambre_mortuaire_nom;
  const mosquee = dossier.mosquee_nom;
  // Cimetière à afficher : celui du référentiel (inhumation locale) ou celui au pays (rapatriement)
  const nomCim = cim?.nom || dossier.cimetiere_pays || '';
  const adresseCim = cim
    ? `${cim.adresse || ''} ${cim.code_postal || ''} ${cim.ville || ''}`.trim()
    : '';
  const marb = dossier.marbriers;
  const aujourd_hui = new Date().toLocaleDateString('fr-FR');
  const couleur = agence?.couleur_principale || '#4F46E5';
  const nomGerant = gerant ? `${gerant.prenom || ''} ${gerant.nom || ''}`.trim() : '';

  const fmt = (date: string) =>
    date ? new Date(date).toLocaleDateString('fr-FR') : '...............';

  const calcAge = (dateNaissance: string, dateDeces?: string) => {
    if (!dateNaissance) return '...';
    const n = new Date(dateNaissance);
    const ref = dateDeces ? new Date(dateDeces) : new Date();
    let age = ref.getFullYear() - n.getFullYear();
    const m = ref.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) age--;
    return age + ' ans';
  };

  const tousOnglets = [
    { key: 'pouvoir', label: '📋 Pouvoir' },
    { key: 'declaration_deces', label: '📄 Déclaration décès' },
    { key: 'apres_meb', label: '🚗 Après MEB' },
    { key: 'declaration_avant_meb', label: '🚐 Avant MEB' },
    { key: 'acquisition', label: '🏛️ Acquisition' },
    { key: 'demande_inhumation', label: '⚰️ Inhumation' },
    { key: 'bon_travaux', label: '🪨 Bon travaux' },
    { key: 'passage_mosquee', label: '🕌 Passage Mosquée' },
    { key: 'chambre_mortuaire', label: '🏥 Chambre mortuaire' },
    { key: 'iml', label: '🏛️ IML' },
    { key: 'prefectorale', label: '📜 Préfectorale' },
    { key: 'admission', label: '🏠 Admission CF' },
    { key: 'deroulement', label: '📅 Déroulement' },
    { key: 'page_de_garde', label: '📁 Page de garde' },
    { key: 'calendrier', label: '📅 Calendrier' },
    ...(dossier.type_dossier === 'rapatriement'
      ? [
          { key: 'attestation_meb', label: '✈️ Attestation MEB' },
          { key: 'prefecture_rapat', label: '📜 Préfecture transport' },
          { key: 'consulat_rapat', label: '🏛️ Consulat' },
          { key: 'attestation_toilette', label: '🕌 Attestation toilette' },
          { key: 'ambulance_rapat', label: '🚑 Ambulance' },
        ]
      : []),
  ];

  const onglets =
    dossier.type_dossier === 'devis_libre'
      ? tousOnglets.filter((o) =>
          ['pouvoir', 'bon_travaux'].includes(o.key)
        )
      : tousOnglets;

  const ongletStyle = (o: string) => ({
    padding: '0.5rem 0.75rem',
    border: 'none',
    borderBottom:
      onglet === o ? `3px solid ${couleur}` : '3px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: onglet === o ? 'bold' : ('normal' as any),
    color: onglet === o ? couleur : '#666',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  });

  const docStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    maxWidth: '750px',
    margin: '0 auto',
    fontSize: '12.5px',
    lineHeight: '1.45',
  };

  const entete = (masquerInfos = false) => (
    <div style={{ marginBottom: '0.7rem' }}>
      <div
        style={{
          background: couleur,
          height: '3px',
          borderRadius: '2px',
          marginBottom: '0.5rem',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '0.6rem',
          borderBottom: `1px solid ${couleur}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {agence?.logo_url && (
            <img
              src={agence.logo_url}
              alt="logo"
              style={{ maxHeight: '44px', maxWidth: '110px' }}
            />
          )}
          <div>
            <div
              style={{ fontWeight: 'bold', fontSize: '15px', color: couleur }}
            >
              {agence?.nom}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {agence?.adresse_complete}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Tél : {agence?.telephone}
              {agence?.email ? ` — ${agence.email}` : ''}
            </div>
            {agence?.site_web && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {agence.site_web}
              </div>
            )}
            {agence?.habilitation && (
              <div
                style={{ fontSize: '11px', color: couleur, fontWeight: '500' }}
              >
                Hab. n° {agence.habilitation}
              </div>
            )}
          </div>
        </div>
        {!masquerInfos && (
          <div
            style={{
              textAlign: 'right',
              fontSize: '11px',
              color: '#666',
              background: `${couleur}11`,
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: `1px solid ${couleur}33`,
            }}
          >
            <div style={{ fontWeight: 'bold', color: couleur }}>
              {agence?.ville || ''} le {aujourd_hui}
            </div>
            {dossier.numero_dossier && (
              <div>
                N° dossier : <strong>{dossier.numero_dossier}</strong>
              </div>
            )}
            {dossier.compte_client && (
              <div>
                Réf : <strong>{dossier.compte_client}</strong>
              </div>
            )}
            {dossier.numero_devis && (
              <div>
                Devis : <strong>{dossier.numero_devis}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const titrePrincipal = (titre: string) => (
    <div style={{ textAlign: 'center', marginBottom: '0.7rem' }}>
      <h2
        style={{
          color: couleur,
          fontSize: '15px',
          margin: '0 0 0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {titre}
      </h2>
      <div
        style={{
          height: '2px',
          background: `linear-gradient(to right, transparent, ${couleur}, transparent)`,
          margin: '0 auto',
          width: '60%',
        }}
      />
    </div>
  );

  const piedPage = () => {
    const mentions = [
      agence?.rcs,
      agence?.siret && `SIRET ${agence.siret}`,
      agence?.tva_intra && `TVA ${agence.tva_intra}`,
      agence?.ape && `Code APE : ${agence.ape}`,
      agence?.habilitation && `Habilitation n°${agence.habilitation}`,
      agence?.site_web,
    ].filter(Boolean);
    return (
      <div
        style={{
          marginTop: '1rem',
          borderTop: `2px solid ${couleur}22`,
          paddingTop: '0.5rem',
        }}
      >
        <div
          style={{
            height: '2px',
            background: couleur,
            borderRadius: '1px',
            marginBottom: '0.4rem',
          }}
        />
        <div
          style={{
            fontSize: '8px',
            color: '#999',
            textAlign: 'center',
            lineHeight: '1.3',
          }}
        >
          {mentions.join(' — ')}
        </div>
      </div>
    );
  };

  const ligne = (label: string, valeur?: string) => (
    <div
      style={{
        marginBottom: '0.32rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          color: '#555',
          fontWeight: '500',
          minWidth: 'auto',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          borderBottom: '1px dotted #ccc',
          flex: 1,
          paddingBottom: '1px',
          fontWeight: valeur ? '500' : 'normal',
          color: valeur ? '#222' : '#aaa',
        }}
      >
        {valeur ||
          '................................................................'}
      </span>
    </div>
  );

  const encadreDefunt = (extra?: React.ReactNode) => (
    <div
      style={{
        background: `${couleur}08`,
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: `1px solid ${couleur}22`,
      }}
    >
      {ligne('Prénom & Nom :', `${d?.prenom || ''} ${d?.nom || ''}`)}
      {d?.nom_jeune_fille && ligne('Nom de jeune fille :', d.nom_jeune_fille)}
      {ligne(
        'Né(e) le :',
        d?.date_naissance
          ? `${fmt(d.date_naissance)}${
              d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
            }`
          : undefined
      )}
      {ligne(
        'Âgé(e) de :',
        d?.date_naissance
          ? calcAge(d.date_naissance, dossier.date_deces)
          : undefined
      )}
      {ligne('Domicilié(e) :', d?.domicile)}
      {ligne(
        'Décédé(e) le :',
        dossier.date_deces
          ? `${fmt(dossier.date_deces)}${
              dossier.lieu_deces ? ` à ${dossier.lieu_deces}` : ''
            }`
          : undefined
      )}
      {extra}
    </div>
  );

  const zoneSignature = (
    labelG: string,
    labelD: string,
    signatureAgence = false
  ) => {
    // La signature de l'agence ne doit JAMAIS aller dans une case "cachet" officiel
    // (mairie, préfecture, consulat...). On détecte quelle case est celle de l'agence.
    const estCaseAgence = (label: string) =>
      /signature/i.test(label) &&
      (/(^|\s)agence/i.test(label) ||
        /entrepreneur|soussign/i.test(label) ||
        (agence?.nom && label.includes(agence.nom)));
    const sigGauche = signatureAgence && estCaseAgence(labelG);
    const sigDroite = signatureAgence && estCaseAgence(labelD);
    // Si aucune case ne correspond explicitement à l'agence mais qu'on veut la
    // signature, on la met à gauche par défaut (jamais dans un cachet officiel).
    const caseOfficielleD = /(cachet|mairie|préfecture|prefecture|consulat)/i.test(
      labelD
    );
    const sigGaucheFinal = sigGauche || (signatureAgence && !sigDroite && caseOfficielleD);
    const sigDroiteFinal = sigDroite && !sigGaucheFinal;
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          marginTop: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              color: '#888',
              marginBottom: '0.5rem',
              whiteSpace: 'pre-line',
            }}
          >
            {labelG}
          </div>
          <div
            id="case-signature-mandant"
            style={{
              border: `1px solid ${couleur}33`,
              height: '56px',
              borderRadius: '4px',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sigGaucheFinal && agence?.signature_url && (
              <img
                src={agence.signature_url}
                alt="signature"
                style={{ maxHeight: '60px' }}
              />
            )}
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: '11px', color: '#888', marginBottom: '0.5rem' }}
          >
            {labelD}
          </div>
          <div
            style={{
              border: `1px solid ${couleur}33`,
              height: '56px',
              borderRadius: '4px',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sigDroiteFinal && agence?.signature_url && (
              <img
                src={agence.signature_url}
                alt="signature"
                style={{ maxHeight: '60px' }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const sectionTitre = (titre: string) => (
    <div
      style={{
        color: couleur,
        fontWeight: 'bold',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: `1px solid ${couleur}33`,
        paddingBottom: '0.25rem',
        marginTop: '1rem',
        marginBottom: '0.75rem',
      }}
    >
      {titre}
    </div>
  );

  const renderPouvoir = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('POUVOIR')}
      <p>
        <strong>Nom & Prénom :</strong>{' '}
        {p
          ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
          : '.................................'}
      </p>
      {ligne('Lien de parenté :', p?.lien_parente)}
      {ligne('Adresse :', p?.adresse)}
      {ligne('Téléphone :', p?.telephone_1)}
      <br />
      <p>
        <strong>Ayant qualité pour pourvoir aux funérailles de :</strong>
      </p>
      {encadreDefunt(
        <>
          {ligne('Profession :', d?.profession)}
          {ligne('Nom du père :', d?.filiation_pere)}
          {ligne('Nom de la mère :', d?.filiation_mere)}
        </>
      )}
      <p>
        Autorise les <strong style={{ color: couleur }}>{agence?.nom}</strong>,
        sise {agence?.adresse_complete}, habilitée sous le n°{' '}
        <strong>{agence?.habilitation}</strong>, représentée par son gérant
        {nomGerant ? ` ${nomGerant}` : ''}, à
        accomplir toutes les formalités administratives nécessaires à
        l'organisation des obsèques. Je m'engage à assurer le règlement intégral
        des obsèques et des frais accessoires sans division, ni réserve.
      </p>
      <br />
      <p style={{ fontSize: '12px', color: '#666' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(
        'Signature du mandant\n(précédée de "Bon pour pouvoir")',
        `Signature ${agence?.nom}`,
        true
      )}
      {piedPage()}
    </div>
  );

  const renderDeclarationDeces = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('DÉCLARATION DE DÉCÈS')}
      <p style={{ marginBottom: '1.5rem' }}>
        En date du <strong>{fmt(dossier.date_deces)}</strong> à{' '}
        <strong>{dossier.heure_deces || '........'}</strong> — Lieu de décès :{' '}
        <strong>
          {dossier.lieu_deces || '................................'}
        </strong>
      </p>
      {sectionTitre('RENSEIGNEMENTS DÉFUNT(E)')}
      {ligne('Nom :', d?.nom)}
      {ligne('Prénom :', d?.prenom)}
      {ligne('Nom de jeune fille :', d?.nom_jeune_fille)}
      {ligne('Sexe :', d?.sexe)}
      {ligne(
        'Né(e) le :',
        d?.date_naissance
          ? `${fmt(d.date_naissance)}${
              d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
            }`
          : d?.lieu_naissance
          ? `à ${d.lieu_naissance}`
          : undefined
      )}
      {ligne('De nationalité :', d?.nationalite)}
      {ligne('Profession :', d?.profession)}
      {ligne(
        'Âgé(e) de :',
        d?.date_naissance
          ? calcAge(d.date_naissance, dossier.date_deces)
          : undefined
      )}
      {ligne('Domicilié(e) :', d?.domicile)}
      {ligne('Situation familiale :', d?.situation_familiale)}
      {sectionTitre('AFFILIATION')}
      {ligne(
        'Père :',
        d?.filiation_pere
          ? `${d.filiation_pere}${d?.pere_statut ? ` (${d.pere_statut})` : ''}${
              d?.pere_adresse ? ` — ${d.pere_adresse}` : ''
            }`
          : undefined
      )}
      {ligne(
        'Mère :',
        d?.filiation_mere
          ? `${d.filiation_mere}${d?.mere_statut ? ` (${d.mere_statut})` : ''}${
              d?.mere_adresse ? ` — ${d.mere_adresse}` : ''
            }`
          : undefined
      )}
      {ligne('Époux(se) :', d?.epoux)}
      {sectionTitre('DÉCLARATION')}
      <p>
        Déclarant(e) :{' '}
        <strong>
          {dossier.declarant
            ? dossier.declarant
            : p
            ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
            : '.................................'}
        </strong>
        , des <strong style={{ color: couleur }}>{agence?.nom}</strong>,{' '}
        {agence?.adresse_complete}
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature('Signature du déclarant', 'Cachet de la mairie')}
      {piedPage()}
    </div>
  );

  const renderApresMeb = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('DÉCLARATION DE TRANSPORT APRÈS MISE EN BIÈRE')}
      <p>
        La société : <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Sise : {agence?.adresse_complete}
        <br />
        Habilitation : {agence?.habilitation}
      </p>
      <br />
      {ligne(
        'Mandaté par :',
        p ? `${p.civilite || ''} ${p.prenom} ${p.nom}` : undefined
      )}
      {ligne('Demeurant :', p?.adresse)}
      <br />
      <p>
        <strong>Ayant qualité pour pourvoir aux funérailles de :</strong>
      </p>
      {encadreDefunt()}
      {ligne('Lieu de départ :', etab)}
      {ligne('Vers le cimetière :', nomCim || undefined)}
      <br />
      <p>
        Le transport sera effectué par{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Véhicule immatriculé :{' '}
        <span style={{ borderBottom: '1px dotted #ccc' }}>
          {dossier.immatriculation_vehicule ||
            '.......................................'}
        </span>
      </p>
      {ligne(
        'Départ du corps le :',
        dossier.date_fermeture_depart
          ? `${fmt(dossier.date_fermeture_depart)}${
              dossier.heure_fermeture_depart
                ? ` à ${dossier.heure_fermeture_depart}`
                : ''
            }`
          : undefined
      )}
      {ligne('En présence de :', 'La Famille')}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Nous vous prions de croire, Monsieur Le Maire, en l'assurance de notre
        considération distinguée.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature('Signature', 'CACHET MAIRIE', true)}
      {piedPage()}
    </div>
  );

  const renderDeclarationAvantMeb = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal(
        'DÉCLARATION PRÉALABLE AU TRANSPORT DE CORPS AVANT MISE EN BIÈRE'
      )}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#666',
          marginBottom: '1.5rem',
        }}
      >
        (articles R.2213-7 à R.2213-14 du C.G.C.T)
      </p>
      <p>
        Je soussigné(e){nomGerant ? `, ${nomGerant}` : ''}, Gérant(e) de{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>, domiciliée{' '}
        {agence?.adresse_complete}, déclare par la présente que le transport du
        corps avant mise en bière de :
      </p>
      {encadreDefunt()}
      {ligne('Lieu de départ :', etab)}
      <p style={{ marginTop: '0.5rem' }}>Vers :</p>
      <div style={{ marginLeft: '1rem', marginBottom: '0.75rem' }}>
        {[
          'Résidence du défunt(e)',
          "Établissement de santé, d'enseignement ou de recherche (art. R.2213-13 et 14 du C.G.C.T)",
          'Chambre funéraire',
          'Résidence',
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.35rem',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                border: `1px solid ${couleur}`,
                borderRadius: '2px',
                flexShrink: 0,
              }}
            ></div>
            <span style={{ fontSize: '12px' }}>{item}</span>
          </div>
        ))}
      </div>
      {ligne('Degré de parenté :', p?.lien_parente)}
      {ligne('Située au :', p?.adresse)}
      <br />
      <p style={{ fontSize: '12px' }}>
        Conformément à la réglementation en vigueur, transport effectué par
        l'entreprise{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>, numéro
        d'habilitation {agence?.habilitation}.
      </p>
      <p style={{ fontSize: '12px' }}>
        • Atteste sur l'honneur avoir la qualité pour pourvoir aux funérailles
        du défunt sus-identifié(e) ; avoir réglementairement qualité pour agir
        au nom et pour le compte de la personne ayant qualité pour pourvoir aux
        funérailles du / de la défunt(e) sus-identifié(e).
      </p>
      <p style={{ fontSize: '12px' }}>
        • Reconnais être informé(e) que ma responsabilité civile et pénale peut
        être engagée en cas de fausse déclaration.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, '', true)}
      {piedPage()}
    </div>
  );

  const renderAcquisition = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal("DEMANDE D'ACQUISITION DE CONCESSION DE TERRAIN")}
      <p>
        Je soussigné(e) :{' '}
        <strong>
          {p
            ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
            : '.................................'}
        </strong>
      </p>
      {ligne('Lien de parenté :', p?.lien_parente)}
      {ligne('Adresse :', p?.adresse)}
      {ligne('Téléphone :', p?.telephone_1)}
      <br />
      <p>
        Demande à obtenir une concession dans le{' '}
        <strong style={{ color: couleur }}>
          Cimetière {nomCim || '.................................'}
        </strong>
      </p>
      {ligne(
        'Pour une durée de :',
        dossier.achat_concession?.replace(/_/g, ' ')
      )}
      {ligne('Creusement demandé :')}
      <br />
      <p>Cette concession est destinée à la sépulture du corps de :</p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Prénom :', d?.prenom)}
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.lieu_deces ? ` à ${dossier.lieu_deces}` : ''
              }`
            : undefined
        )}
        {ligne('Domicilié(e) :', d?.domicile)}
        {ligne(
          "L'inhumation aura lieu le :",
          dossier.date_inhumation
            ? `${fmt(dossier.date_inhumation)}${
                dossier.heure_inhumation ? ` à ${dossier.heure_inhumation}` : ''
              }`
            : undefined
        )}
      </div>
      <p>
        Je déclare avoir chargé la société :{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Adresse : {agence?.adresse_complete}
        <br />
        Téléphone : {agence?.telephone}
      </p>
      <p>D'exécuter les travaux nécessaires à cette opération.</p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(
        'Signature du demandeur',
        `Cachet ${nomCim || 'cimetière'}`
      )}
      {piedPage()}
    </div>
  );

  const renderDemandeInhumation = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal("DEMANDE D'INHUMATION")}
      <p>
        Je soussigné(e) :{' '}
        <strong>
          {p
            ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
            : '.................................'}
        </strong>
      </p>
      {ligne('Lien de parenté :', p?.lien_parente)}
      {ligne('Adresse :', p?.adresse)}
      <p>
        Agissant en tant que : <strong>Concessionnaire</strong>
      </p>
      {ligne('Téléphone :', p?.telephone_1)}
      <br />
      {ligne("Lieu d'inhumation :", nomCim || undefined)}
      {ligne(
        'Adresse :',
        cim
          ? `${cim.adresse || ''} ${cim.code_postal || ''} ${cim.ville || ''}`
          : undefined
      )}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
        <span>
          Concession n° :{' '}
          <span style={{ borderBottom: '1px dotted #ccc' }}>
            {dossier.numero_concession || '..................'}
          </span>
        </span>
        <span>
          Division n° :{' '}
          <span style={{ borderBottom: '1px dotted #ccc' }}>
            {dossier.division_concession || '..................'}
          </span>
        </span>
      </div>
      <br />
      <p>Demande à faire inhumer :</p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Prénom :', d?.prenom)}
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.lieu_deces ? ` à ${dossier.lieu_deces}` : ''
              }`
            : undefined
        )}
        {ligne('Domicilié(e) :', d?.domicile)}
        {ligne(
          "L'inhumation prévue le :",
          dossier.date_inhumation
            ? `${fmt(dossier.date_inhumation)}${
                dossier.heure_inhumation ? ` à ${dossier.heure_inhumation}` : ''
              }`
            : undefined
        )}
      </div>
      {ligne(
        'Nom de la société chargée des travaux :',
        marb?.nom || agence?.nom
      )}
      {ligne('Adresse :', marb?.adresse || agence?.adresse_complete)}
      {ligne('Téléphone :', marb?.telephone || agence?.telephone)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Volonté en matière de crémation administrative : La famille s'oppose à
        la crémation administrative.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(
        'Signature du demandeur',
        `Cachet ${nomCim || 'cimetière'}`
      )}
      {piedPage()}
    </div>
  );

  const renderBonTravaux = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('BON DE TRAVAUX — Inhumation')}
      {ligne(
        "Date et horaire de l'inhumation :",
        dossier.date_inhumation
          ? `${fmt(dossier.date_inhumation)}${
              dossier.heure_inhumation ? ` à ${dossier.heure_inhumation}` : ''
            }`
          : undefined
      )}
      <br />
      <p>
        Je soussigné(e) :{' '}
        <strong>
          {p
            ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
            : '.................................'}
        </strong>
      </p>
      {ligne('Lien de parenté :', p?.lien_parente)}
      {ligne('Adresse :', p?.adresse)}
      <p>
        Agissant en tant que : <strong>Concessionnaire</strong>
      </p>
      {ligne('Contact concessionnaire :', p?.telephone_1)}
      <br />
      <p>
        Je déclare autoriser l'entreprise :{' '}
        <strong style={{ color: couleur }}>{marb?.nom || agence?.nom}</strong>
        <br />
        Adresse : {marb?.adresse || agence?.adresse_complete} — Tél :{' '}
        {marb?.telephone || agence?.telephone}
      </p>
      <p>À exécuter les travaux pour la sépulture de :</p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne(
          'Nom & Prénom du défunt(e) :',
          `${d?.prenom || ''} ${d?.nom || ''}`
        )}
        {dossier.travaux_realiser ? (
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#555', fontWeight: '500' }}>
              Travaux à réaliser :{' '}
            </span>
            <span style={{ fontWeight: '500' }}>
              {dossier.travaux_realiser}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            {[
              'Creusement',
              'Semelle',
              'Fausse case',
              'Exhumation',
              'Dépose monument',
              'Repose monument',
              'Stèle',
              'Plaque identité',
            ].map((t) => (
              <div
                key={t}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: `1px solid ${couleur}`,
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                ></div>
                <span style={{ fontSize: '12px' }}>{t}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span>
              Concession :{' '}
              <span style={{ borderBottom: '1px dotted #ccc' }}>
                {dossier.numero_concession || '.............'}
              </span>
            </span>
            <span>
              Division :{' '}
              <span style={{ borderBottom: '1px dotted #ccc' }}>
                {dossier.division_concession || '.............'}
              </span>
            </span>
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <span>
              Durée :{' '}
              {dossier.achat_concession?.replace(/_/g, ' ') || '.............'}
            </span>
          </div>
        </div>
      </div>
      {ligne("Lieu d'inhumation :", nomCim || undefined)}
      {ligne(
        'Adresse :',
        cim
          ? `${cim.adresse || ''} ${cim.code_postal || ''} ${cim.ville || ''}`
          : undefined
      )}
      {ligne('Téléphone :', cim?.telephone)}
      {ligne('Email :', cim?.email)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Je m'engage à garantir la ville contre toute réclamation qui pourrait
        survenir du fait des travaux ci-dessus.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(
        "Signature de l'entrepreneur",
        'Signature concessionnaire',
        true
      )}
      {piedPage()}
    </div>
  );

  const renderPassageMosquee = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('DÉROULEMENT DES OBSÈQUES')}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '16px', marginBottom: '0.25rem' }}>
          السلام عليكم و رحمة الله و بركاته
        </div>
        <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#666' }}>
          Salam alaykum wa rahmatullahi wa barakatu
        </div>
        <div style={{ fontSize: '14px', margin: '0.5rem 0' }}>
          إنا لله وإنا إليه راجعون
        </div>
        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
          «C'est à Allah que nous appartenons et c'est à Lui que nous
          retournerons»
        </div>
      </div>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        Auront lieu le <strong>{fmt(dossier.date_meb)}</strong>
      </p>
      <div
        style={{
          borderLeft: `3px solid ${couleur}`,
          paddingLeft: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: couleur }}>
            🕌 Présentation à la famille
          </div>
          <div>
            Au :{' '}
            <strong>{mosquee || '.................................'}</strong>
          </div>
          <div>
            À partir de :{' '}
            <strong>{dossier.heure_presentation || '........'}</strong>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: couleur }}>
            ⚰️ Fermeture du cercueil & Départ
          </div>
          <div>
            Le : <strong>{fmt(dossier.date_fermeture_depart)}</strong> à{' '}
            <strong>{dossier.heure_fermeture_depart || '........'}</strong>
          </div>
          <div>Depuis : {etab || '.................................'}</div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: couleur }}>
            🕌 Salat Al Janāza
          </div>
          <div>Après Salât du Dohr</div>
          <div>
            À :{' '}
            <strong>{mosquee || '.................................'}</strong>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: couleur }}>
            ⚱️ Inhumation
          </div>
          <div>
            Cimetière :{' '}
            <strong>{nomCim || '.................................'}</strong>
          </div>
          <div>
            Adresse :{' '}
            {cim
              ? `${cim.adresse || ''} ${cim.code_postal || ''} ${
                  cim.ville || ''
                }`
              : '.................................'}
          </div>
          <div>
            À : <strong>{dossier.heure_inhumation || '........'}</strong>
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: '12px',
          fontStyle: 'italic',
          color: '#666',
          marginTop: '1rem',
        }}
      >
        <div>Kullu nafsin dhaiqatu almawt</div>
        <div>(Sourate 3: Al 'Imran; Verset 185)</div>
        <div style={{ marginTop: '0.5rem' }}>
          Allahumma ghfir lahum wa rhamhum Amine
        </div>
      </div>
      {piedPage()}
    </div>
  );

  const renderChambreMortuaire = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('ORGANISATION DES OBSÈQUES')}
      <div
        style={{
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Prénom & Nom :', `${d?.prenom || ''} ${d?.nom || ''}`)}
        {ligne('De sexe :', d?.sexe)}
        {ligne('Nom de jeune fille :', d?.nom_jeune_fille)}
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.lieu_deces ? ` à ${dossier.lieu_deces}` : ''
              }`
            : undefined
        )}
      </div>
      <div style={{ borderLeft: `3px solid ${couleur}`, paddingLeft: '1rem' }}>
        {ligne(
          'Toilette rituelle le :',
          dossier.date_toilette
            ? `${fmt(dossier.date_toilette)}${
                dossier.heure_toilette ? ` à ${dossier.heure_toilette}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Mise en bière le :',
          dossier.date_meb
            ? `${fmt(dossier.date_meb)}${
                dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Fermeture et départ le :',
          dossier.date_fermeture_depart
            ? `${fmt(dossier.date_fermeture_depart)}${
                dossier.heure_fermeture_depart
                  ? ` à ${dossier.heure_fermeture_depart}`
                  : ''
              }`
            : undefined
        )}
        {ligne('Qui doit être inhumé au cimetière de :', nomCim || undefined)}
      </div>
      <br />
      <p>Merci de nous indiquer l'adresse de la chambre mortuaire :</p>
      <div
        style={{
          border: `1px solid ${couleur}33`,
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem',
          minHeight: '60px',
          background: '#fafafa',
        }}
      >
        <div style={{ fontSize: '12px', color: '#888' }}>
          Adresse chambre mortuaire :
        </div>
        <div>{etab || ''}</div>
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet établissement', true)}
      {piedPage()}
    </div>
  );

  const renderIML = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal("DEMANDE DE TOILETTE RITUELLE POUR L'IML")}
      <p>
        <strong style={{ color: couleur }}>{agence?.nom}</strong>,{' '}
        {agence?.adresse_complete}
        <br />
        Habilitation n° {agence?.habilitation}
      </p>
      <br />
      <p>Vous sollicite par la présente pour la Toilette du :</p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Prénom & Nom :', `${d?.prenom || ''} ${d?.nom || ''}`)}
        {ligne('De sexe :', d?.sexe)}
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne(
          'Âgé(e) de :',
          d?.date_naissance
            ? calcAge(d.date_naissance, dossier.date_deces)
            : undefined
        )}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.heure_deces ? ` à ${dossier.heure_deces}` : ''
              }`
            : undefined
        )}
        <div style={{ marginBottom: '0.5rem' }}>
          <span>
            Dossier IML : N°{' '}
            <span
              style={{ borderBottom: '1px dotted #ccc', paddingBottom: '1px' }}
            >
              {dossier.numero_dossier_iml || '...........'}
            </span>
            ,{' '}
          </span>
          <span>
            taille{' '}
            <span
              style={{ borderBottom: '1px dotted #ccc', paddingBottom: '1px' }}
            >
              {dossier.taille_iml || '.......'} m
            </span>
            ,{' '}
          </span>
          <span>
            épaulement{' '}
            <span
              style={{ borderBottom: '1px dotted #ccc', paddingBottom: '1px' }}
            >
              {dossier.epaulement_iml || '.......'} cm
            </span>
            ,{' '}
          </span>
          <span>
            poids{' '}
            <span
              style={{ borderBottom: '1px dotted #ccc', paddingBottom: '1px' }}
            >
              {dossier.poids_iml || '.......'} kg
            </span>
          </span>
        </div>
        {ligne("Lieu d'inhumation :", nomCim || undefined)}
      </div>
      {ligne(
        'Mise en bière prévue le :',
        dossier.date_meb
          ? `${fmt(dossier.date_meb)}${
              dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
            }`
          : undefined
      )}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Nous vous remercions de bien vouloir nous contacter pour tout
        renseignement complémentaire.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet IML', true)}
      {piedPage()}
    </div>
  );

  const renderPrefectorale = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal(
        "DEMANDE D'AUTORISATION D'INHUMATION AU DELÀ DU DÉLAI LÉGAL"
      )}
      <p>Monsieur le Préfet,</p>
      <br />
      <p>
        Les <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Domicilié(e) : {agence?.adresse_complete}
      </p>
      <br />
      {ligne(
        'Ayant le pouvoir signé par :',
        p ? `${p.civilite || ''} ${p.prenom} ${p.nom}` : undefined
      )}
      {ligne('Ayant qualité pour pourvoir aux funérailles de :')}
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          marginTop: '0.5rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Prénom & Nom :', `${d?.prenom || ''} ${d?.nom || ''}`)}
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne('Domicilié(e) à :', d?.domicile)}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.lieu_deces
                  ? ` à ${dossier.lieu_deces}, à l'âge de ${calcAge(
                      d?.date_naissance,
                      dossier.date_deces
                    )}`
                  : ''
              }`
            : undefined
        )}
      </div>
      <p>
        Sollicite, suite au dépassement du délai légal de 6 jours,
        l'autorisation de procéder à l'inhumation prévue le{' '}
        <strong>{fmt(dossier.date_inhumation)}</strong> à{' '}
        <strong>{dossier.heure_inhumation || '........'}</strong>
      </p>
      {ligne('Au Cimetière :', nomCim || undefined)}
      {ligne('Lieu de mise en bière (départ) :', etab || undefined)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Je vous prie d'agréer, Monsieur le Préfet, l'expression de ma haute
        considération.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet Préfecture', true)}
      {piedPage()}
    </div>
  );

  const renderAdmission = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal(
        "DEMANDE D'ADMISSION D'UN CORPS DANS UNE CHAMBRE FUNÉRAIRE"
      )}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#666',
          marginBottom: '1.5rem',
        }}
      >
        (Décès hors centre de soin)
      </p>
      <p>
        Je soussigné(e),{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Domicilié(e) : {agence?.adresse_complete}
      </p>
      <br />
      {ligne(
        'Ayant qualité pour pourvoir aux funérailles de :',
        p ? `${p.civilite || ''} ${p.prenom} ${p.nom}` : undefined
      )}
      <br />
      <p>Sollicite l'admission à la chambre funéraire de :</p>
      <p style={{ marginLeft: '1rem', fontSize: '12px', color: '#666' }}>
        art. 2223-76 et 2223-78 du CGCT.
      </p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          marginTop: '0.5rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        <p>
          Du corps de :{' '}
          <strong>
            {d?.prenom || ''} {d?.nom || ''}
          </strong>
        </p>
        {ligne(
          'Né(e) le :',
          d?.date_naissance
            ? `${fmt(d.date_naissance)}${
                d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
              }`
            : undefined
        )}
        {ligne('Domicilié(e) à :', d?.domicile)}
        {ligne(
          'Décédé(e) le :',
          dossier.date_deces
            ? `${fmt(dossier.date_deces)}${
                dossier.lieu_deces ? ` à ${dossier.lieu_deces}` : ''
              }`
            : undefined
        )}
      </div>
      <p style={{ fontSize: '12px' }}>
        Ci-joint un extrait du certificat établi par le Docteur{' '}
        <strong>
          {dossier.nom_docteur_certificat ||
            dossier.nom_medecin ||
            '.................................'}
        </strong>
        , attestant que le décès n'est pas dû à une maladie contagieuse.
      </p>
      <p style={{ fontSize: '12px' }}>
        Le corps sera transporté dans une voiture agréée par{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>, habilitation
        n° {agence?.habilitation}.
      </p>
      <p style={{ fontSize: '12px' }}>
        Je m'engage à prendre en charge les frais de transport et de séjour en
        chambre funéraire.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(
        `Signature ${agence?.nom}`,
        'Cachet chambre funéraire',
        true
      )}
      {piedPage()}
    </div>
  );

  const renderDeroulement = () => {
    const gold = '#B08D3C';
    const etapes = [
      dossier.afficher_toilette !== false && {
        emoji: '🕌',
        label: 'Toilette rituelle',
        detail: [
          `${dossier.date_toilette ? fmt(dossier.date_toilette) : ''}${
            dossier.heure_toilette ? ` à ${dossier.heure_toilette}` : ''
          }`,
          mosquee || '',
        ]
          .filter(Boolean)
          .join(' · '),
        pastille: couleur,
      },
      afficherMeb && {
        emoji: '⚰️',
        label: 'Mise en bière',
        detail: [
          `${dossier.date_meb ? fmt(dossier.date_meb) : ''}${
            dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
          }`,
          etab || '',
        ]
          .filter(Boolean)
          .join(' · '),
        pastille: couleur,
      },
      afficherDepart && {
        emoji: '🚗',
        label: 'Fermeture & départ',
        detail: [
          `${
            dossier.date_fermeture_depart
              ? fmt(dossier.date_fermeture_depart)
              : ''
          }${
            dossier.heure_fermeture_depart
              ? ` à ${dossier.heure_fermeture_depart}`
              : ''
          }`,
          etab || '',
        ]
          .filter(Boolean)
          .join(' · '),
        pastille: couleur,
      },
      afficherSalat && {
        emoji: '🕌',
        label: 'Salat Al Janāza',
        detail: [
          dossier.date_inhumation ? fmt(dossier.date_inhumation) : '',
          mosquee || nomCim || '',
        ]
          .filter(Boolean)
          .join(' · '),
        pastille: couleur,
      },
      afficherInhumation && {
        emoji: '⚱️',
        label: 'Inhumation',
        detail: [
          `${dossier.date_inhumation ? fmt(dossier.date_inhumation) : ''}${
            dossier.heure_inhumation ? ` à ${dossier.heure_inhumation}` : ''
          }`,
          nomCim || '',
        ]
          .filter(Boolean)
          .join(' · '),
        pastille: gold,
      },
    ].filter(Boolean) as any[];

    const feminin = d?.sexe === 'Féminin';

    return (
      <div
        style={{
          ...docStyle,
          background: 'transparent',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '460px',
            maxWidth: '100%',
            background: '#FBF7EF',
            border: '1px solid #E7DFCC',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: couleur,
              color: '#fff',
              textAlign: 'center',
              padding: '1.4rem 1.25rem 1.5rem',
            }}
          >
            <div style={{ fontSize: '15px', opacity: 0.95 }}>
              إنا لله وإنا إليه راجعون
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
              C'est à Allah que nous appartenons et à Lui que nous retournons
            </div>
            <div
              style={{
                height: '1px',
                background: 'rgba(255,255,255,0.35)',
                margin: '0.9rem auto',
                width: '60px',
              }}
            />
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                lineHeight: 1.2,
                letterSpacing: '0.3px',
              }}
            >
              {d?.civilite} {d?.prenom} {d?.nom}
            </div>
            <div style={{ fontSize: '12.5px', opacity: 0.9, marginTop: '6px' }}>
              {feminin ? 'رحمها الله' : 'رحمه الله'} — rappelé(e) à Allah le{' '}
              {fmt(dossier.date_deces)}
            </div>
          </div>

          <div style={{ padding: '1.3rem 1.4rem 0.4rem' }}>
            <div
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#9A8F76',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '1.1rem',
              }}
            >
              Déroulement des obsèques
            </div>
            <div style={{ position: 'relative', paddingLeft: '34px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '8px',
                  bottom: '18px',
                  width: '2px',
                  background: '#D8CBAF',
                }}
              />
              {etapes.map((etape, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    marginBottom: i === etapes.length - 1 ? 0 : '1.1rem',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-34px',
                      top: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: etape.pastille,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                    }}
                  >
                    {etape.emoji}
                  </div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: couleur,
                      fontSize: '14.5px',
                    }}
                  >
                    {etape.label}
                  </div>
                  {etape.detail && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4A4A44',
                        marginTop: '2px',
                      }}
                    >
                      {etape.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '1.3rem 1.4rem 1.5rem',
              marginTop: '0.6rem',
            }}
          >
            <div
              style={{
                fontStyle: 'italic',
                color: '#6B6353',
                fontSize: '12.5px',
                lineHeight: 1.6,
              }}
            >
              « Toute âme goûtera la mort »
              <br />
              Sourate Al ʿImran, verset 185
            </div>
            <div
              style={{
                color: couleur,
                fontWeight: 500,
                fontSize: '13px',
                marginTop: '0.7rem',
              }}
            >
              {feminin
                ? 'Allahoumma ghfir lahâ wa rhamhâ'
                : 'Allahoumma ghfir lahou wa rhamhou'}{' '}
              — Âmîn
            </div>
            <div
              style={{
                height: '1px',
                background: '#E7DFCC',
                margin: '1rem auto 0.8rem',
                width: '80%',
              }}
            />
            <div style={{ fontSize: '11.5px', color: '#9A8F76' }}>
              {agence?.nom}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPageDeGarde = () => {
    const carte: React.CSSProperties = {
      background: '#f9f9f9',
      borderRadius: '8px',
      padding: '0.45rem 0.65rem',
      marginBottom: '0.4rem',
    };
    const titreCarte: React.CSSProperties = {
      color: couleur,
      margin: '0 0 0.3rem',
      fontSize: '12.5px',
      borderBottom: `1px solid ${couleur}22`,
      paddingBottom: '0.15rem',
    };
    const grille: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.12rem 0.6rem',
      fontSize: '11px',
    };
    const lib: React.CSSProperties = { color: '#888', fontSize: '10px' };
    const hw = '.....................';
    const champ = (label: string, valeur: any, pleineLargeur = false) => (
      <div style={pleineLargeur ? { gridColumn: '1 / -1' } : undefined}>
        <span style={lib}>{label} </span>
        <strong>{valeur ? valeur : hw}</strong>
      </div>
    );
    const estRapat = dossier.type_dossier === 'rapatriement';
    const checklist = [
      'Certificat de décès',
      'Avant mise en bière',
      'Non contagion',
      'Housse mortuaire',
      'Acte de décès',
      'Livret de famille ou autre',
      'Fermeture',
      'Carte Nationale / Passeport',
      'Préfecture Laisser Passer Mortuaire',
      'CI Pouvoir',
      'Attestation de mise en bière',
      'Contact au pays',
      "Déclaration sur l'Honneur Maroc",
      "Lieu d'inhumation",
      'Réservation Vol',
      'Ambulance',
      'Chambre Mortuaire / Funérarium',
      'Billet accompagnant',
      'Autorisation de Transfert de corps',
      'Prélèvement compte défunt(e)',
      'Plaque',
      'Déroulement des Obsèques',
      'Devis / Facture',
      'Passage Mosquée',
    ];
    return (
      <div style={{ ...docStyle, lineHeight: '1.25' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '0.5rem',
            borderBottom: `3px solid ${couleur}`,
            paddingBottom: '0.35rem',
          }}
        >
          {agence?.logo_url && (
            <img
              src={agence.logo_url}
              alt="logo"
              style={{
                maxHeight: '38px',
                display: 'block',
                margin: '0 auto 0.25rem',
              }}
            />
          )}
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: couleur }}>
            {agence?.nom}
          </div>
          <div style={{ fontSize: '10.5px', color: '#666' }}>
            {agence?.adresse_complete} — Tél : {agence?.telephone}
          </div>
        </div>
        <div
          style={{
            background: couleur,
            color: 'white',
            padding: '0.4rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {estRapat ? '✈️ RAPATRIEMENT' : '⚰️ INHUMATION LOCALE'}
            {dossier.numero_dossier ? ` — ${dossier.numero_dossier}` : ''}
          </div>
        </div>

        <div style={carte}>
          <h3 style={titreCarte}>👤 Défunt(e)</h3>
          <div style={grille}>
            {champ(
              'Civilité / Nom / Prénom :',
              `${d?.civilite || ''} ${d?.prenom || ''} ${d?.nom || ''}`.trim()
            )}
            {champ('Nom de jeune fille :', d?.nom_jeune_fille)}
            {champ(
              'Né(e) le :',
              d?.date_naissance
                ? `${fmt(d.date_naissance)}${
                    d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''
                  }`
                : null
            )}
            {champ(
              'Âge :',
              d?.date_naissance
                ? calcAge(d.date_naissance, dossier.date_deces)
                : null
            )}
            {champ('Nationalité :', d?.nationalite)}
            {champ('Domicile :', d?.domicile, true)}
            {champ(
              'Décédé(e) le :',
              dossier.date_deces ? fmt(dossier.date_deces) : null
            )}
            {champ('Heure du décès :', dossier.heure_deces)}
            {champ('Lieu du décès :', dossier.lieu_deces, true)}
          </div>
        </div>

        <div style={carte}>
          <h3 style={titreCarte}>📋 Pouvoir (mandataire)</h3>
          <div style={grille}>
            {champ(
              'Nom / Prénom :',
              p ? `${p.civilite || ''} ${p.prenom || ''} ${p.nom || ''}`.trim() : null
            )}
            {champ('Lien de parenté :', p?.lien_parente)}
            {champ('Téléphone 1 :', p?.telephone_1)}
            {champ('Téléphone 2 :', p?.telephone_2)}
            {champ('Email :', p?.email)}
            {champ('Adresse :', p?.adresse, true)}
          </div>
        </div>

        <div style={carte}>
          <h3 style={titreCarte}>🏥 Chambre mortuaire & mesures</h3>
          <div style={grille}>
            {champ('Chambre mortuaire :', etab, true)}
            {champ('Adresse :', null, true)}
            {champ('Téléphone :', null)}
            {champ('Taille du (de la) défunt(e) :', null)}
            {champ('Taille cercueil :', null)}
          </div>
        </div>

        <div style={carte}>
          <h3 style={titreCarte}>🗓️ Déroulement & intervenants</h3>
          <div style={grille}>
            {champ(
              'Toilette rituelle :',
              dossier.date_toilette
                ? `${fmt(dossier.date_toilette)} ${dossier.heure_toilette || ''}`
                : null
            )}
            {champ('Toilette par :', null)}
            {champ(
              'Mise en bière :',
              dossier.date_meb
                ? `${fmt(dossier.date_meb)} ${dossier.heure_meb || ''}`
                : null
            )}
            {champ('Convoi effectué par :', dossier.convoi_effectue_par)}
            {champ(
              'Fermeture & Départ :',
              dossier.date_fermeture_depart
                ? `${fmt(dossier.date_fermeture_depart)} ${
                    dossier.heure_fermeture_depart || ''
                  }`
                : null
            )}
            {champ(
              'Inhumation :',
              dossier.date_inhumation
                ? `${fmt(dossier.date_inhumation)} ${
                    dossier.heure_inhumation || ''
                  }`
                : null
            )}
            {champ('Cimetière :', cim?.nom || dossier.cimetiere_pays, true)}
            {champ('Mosquée :', mosquee, true)}
          </div>
        </div>

        {estRapat && (
          <div style={carte}>
            <h3 style={titreCarte}>✈️ Transport aérien</h3>
            <div style={grille}>
              {champ('Compagnie :', dossier.compagnie_aerienne)}
              {champ('LTA :', dossier.lta)}
              {champ(
                'Date du vol :',
                dossier.date_vol ? fmt(dossier.date_vol) : null
              )}
              {champ('Vol :', dossier.numero_vol)}
              {champ('Aéroport de départ :', dossier.aeroport_depart)}
              {champ('Heure de départ :', dossier.heure_depart_vol)}
              {champ("Aéroport d'escale :", dossier.aeroport_escale)}
              {champ("Heure d'arrivée escale :", dossier.heure_arrivee_escale)}
              {champ("Aéroport d'arrivée :", dossier.aeroport_arrivee)}
              {champ("Heure d'arrivée :", dossier.heure_arrivee_vol)}
            </div>
          </div>
        )}

        <div style={carte}>
          <h3 style={titreCarte}>📝 Observations</h3>
          <div style={{ fontSize: '11px', minHeight: '1.3rem' }}>
            {dossier.observations || hw}
          </div>
        </div>

        <div style={carte}>
          <h3 style={titreCarte}>☑️ Documents / à faire</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.1rem 0.7rem',
              fontSize: '10px',
            }}
          >
            {checklist.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.3rem' }}>
                <span style={{ color: couleur }}>☐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {piedPage()}
      </div>
    );
  };

  const renderCalendrier = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal("DÉCÈS D'UN PROCHE : LE CALENDRIER DES DÉMARCHES")}
      <p
        style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '13px',
          marginBottom: '2rem',
          fontStyle: 'italic',
        }}
      >
        Le tableau ci-dessous dresse le calendrier des démarches à suivre auprès
        de différents interlocuteurs après le décès d'un proche.
      </p>
      {[
        {
          delai: '⏰ Dans les 24 heures',
          couleurBloc: '#993C1D',
          bg: '#FAECE7',
          items: [
            'Faire constater le décès par un médecin',
            'Déclaration du décès en mairie',
            'Contacter les pompes funèbres',
            'Établir un faire-part ou un avis de décès',
            "Don d'organe (si consentement)",
          ],
        },
        {
          delai: '⏰ Dans les six jours (hors dimanches et jours fériés)',
          couleurBloc: '#854F0B',
          bg: '#FAEEDA',
          items: [
            "Informer l'employeur",
            'Informer Pôle emploi',
            "Avertir la caisse primaire d'Assurance maladie",
            'Prévenir les caisses de retraite',
            'Contacter les banques et organismes de crédit',
            'Si pacsé : prévenir le tribunal judiciaire',
          ],
        },
        {
          delai: '📅 Dans les 30 jours',
          couleurBloc: '#185FA5',
          bg: '#E3F2FD',
          items: [
            "Contacter les sociétés d'assurance",
            'Prévenir les allocations familiales',
            'Prévenir le bailleur ou locataire',
            'Prendre contact avec le notaire',
            'Suspension ou modification des contrats (eau, gaz, électricité, Internet…)',
            'Demande de réexpédition du courrier',
            'Prévenir le centre des impôts',
          ],
        },
        {
          delai: '📆 Dans les six mois',
          couleurBloc: '#0F6E56',
          bg: '#E1F5EE',
          items: [
            "Régularisation de l'impôt sur le revenu, taxe foncière et taxe d'habitation",
            "Modifier le certificat d'immatriculation du véhicule si nécessaire",
          ],
        },
      ].map((bloc, i) => (
        <div
          key={i}
          style={{
            marginBottom: '1.5rem',
            border: `1px solid ${bloc.couleurBloc}`,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: bloc.couleurBloc,
              color: 'white',
              padding: '0.75rem 1rem',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {bloc.delai}
          </div>
          <div style={{ background: bloc.bg, padding: '1rem' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {bloc.items.map((item, j) => (
                <li
                  key={j}
                  style={{
                    marginBottom: '0.4rem',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: '2rem',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          paddingTop: '1rem',
        }}
      >
        Pour toute question, n'hésitez pas à contacter{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>
        <br />
        Tél : {agence?.telephone} — {agence?.email}
      </div>
      {piedPage()}
    </div>
  );

  const renderAttestationMeb = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('ATTESTATION DE MISE EN BIÈRE')}
      <p
        style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '1rem' }}
      >
        À titre exécutoire de l'article L2213-14 - Modifié par LOI n°2015-177 du
        16 février 2015
      </p>
      <p>
        Nous soussignés,{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>,{' '}
        {agence?.adresse_complete}, Habilitation n° {agence?.habilitation}
      </p>
      <p>Attestons par la présente avoir placé :</p>
      {encadreDefunt()}
      <p>
        Le(a) défunt(e) sus-désigné(e) dans un{' '}
        <strong>double cercueil, dont un en zinc soudé hermétiquement</strong>,
        conformément à la réglementation en vigueur pour le transport
        international de corps.
      </p>
      {ligne('Lieu de mise en bière :', etab)}
      {ligne(
        'Mise en bière le :',
        dossier.date_meb
          ? `${fmt(dossier.date_meb)}${
              dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
            }`
          : undefined
      )}
      {ligne(
        'Qui doit être inhumé(e) au cimetière de :',
        dossier.cimetiere_pays
      )}
      <br />
      <p>
        Après vérification du (de la) défunt(e) en présence de :{' '}
        <strong>
          {p
            ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
            : '.................................'}
        </strong>
      </p>
      {ligne('Demeurant :', p?.adresse)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        "L'opération a été faite conformément aux instructions précitées avec
        toute la dignité et le respect dus aux défunts."
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet', true)}
      {piedPage()}
    </div>
  );

  const renderPrefectureRapat = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal(
        "DEMANDE D'AUTORISATION PRÉFECTORALE DE TRANSPORT DE CORPS EN DEHORS DU TERRITOIRE"
      )}
      <p>Monsieur le Préfet,</p>
      <br />
      <p>
        Je soussigné(e){nomGerant ? ` ${nomGerant}` : ''}, gérant(e) de{' '}
        <strong style={{ color: couleur }}>{agence?.nom}</strong>,{' '}
        {agence?.adresse_complete}, Habilitation n° {agence?.habilitation}
      </p>
      <br />
      <p>Déclarant avoir qualité pour pourvoir aux funérailles de :</p>
      {encadreDefunt(
        <>
          {ligne('Sexe :', d?.sexe)}
          {ligne('N° de passeport :', dossier.numero_passeport)}
        </>
      )}
      {ligne('Lieu de mise en bière :', etab)}
      <br />
      <p>
        Sollicite l'autorisation de faire procéder au transport de corps après
        mise en bière :
      </p>
      {ligne(
        'Mise en bière prévue le :',
        dossier.date_meb
          ? `${fmt(dossier.date_meb)}${
              dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
            }`
          : undefined
      )}
      {ligne('En présence de :', 'La Famille')}
      {ligne('Véhicule immatriculé :', dossier.immatriculation_vehicule)}
      <br />
      <p>
        Par voie routière de <strong>{agence?.ville}</strong> à l'aéroport{' '}
        <strong>{dossier.aeroport_depart}</strong>
      </p>
      <p>Puis par voie aérienne :</p>
      <div
        style={{
          marginLeft: '1rem',
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        {ligne('Vol :', dossier.numero_vol)}
        {ligne('Date :', dossier.date_vol ? fmt(dossier.date_vol) : undefined)}
        {ligne('Heure départ :', dossier.heure_depart_vol)}
        {ligne('Compagnie :', dossier.compagnie_aerienne)}
        {ligne('LTA :', dossier.lta)}
        {dossier.aeroport_escale && (
          <>
            {ligne("Aéroport d'escale :", dossier.aeroport_escale)}
            {ligne("Heure d'arrivée escale :", dossier.heure_arrivee_escale)}
            {ligne(
              'Date départ escale :',
              dossier.date_depart_escale
                ? fmt(dossier.date_depart_escale)
                : undefined
            )}
            {ligne('Vol escale :', dossier.numero_vol_escale)}
          </>
        )}
        {ligne("Aéroport d'arrivée :", dossier.aeroport_arrivee)}
        {ligne("Heure d'arrivée :", dossier.heure_arrivee_vol)}
      </div>
      {ligne(
        'Qui doit être inhumé(e) au cimetière de :',
        dossier.cimetiere_pays
      )}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Je vous prie d'agréer, Monsieur le Préfet, l'expression de ma haute
        considération.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet Préfecture', true)}
      {piedPage()}
    </div>
  );

  const renderConsulat = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal("DEMANDE D'AUTORISATION DE TRANSFERT DE CORPS")}
      <p>Monsieur le Consul,</p>
      <br />
      <p>
        Nous avons l'honneur de vous prier de bien vouloir nous faire délivrer
        l'autorisation de transfert du corps de :
      </p>
      {encadreDefunt(
        <>
          {ligne('Sexe :', d?.sexe)}
          {ligne('Nationalité :', d?.nationalite)}
          {ligne('N° de passeport :', dossier.numero_passeport)}
        </>
      )}
      <p>
        À cet effet, veuillez trouver, ci-joint, le dossier nécessaire
        comprenant :
      </p>
      <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
        {[
          'Pouvoir signé par le mandataire',
          'Autorisation de fermeture de cercueil',
          'Acte de décès délivré par la mairie',
          `Attestation de mise en bière de ${agence?.nom}`,
          'Autorisation de transport du corps délivrée par la préfecture',
          'Certificat de non contagion',
          'Attestation de toilette rituelle',
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                border: `1px solid ${couleur}`,
                borderRadius: '2px',
                flexShrink: 0,
              }}
            ></div>
            <span style={{ fontSize: '12px' }}>{item}</span>
          </div>
        ))}
      </div>
      {ligne(
        'Mise en bière prévue le :',
        dossier.date_meb
          ? `${fmt(dossier.date_meb)}${
              dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
            }`
          : undefined
      )}
      {ligne('En présence de :', 'La Famille')}
      <div
        style={{
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
          marginTop: '0.5rem',
        }}
      >
        <div
          style={{ fontWeight: 'bold', color: couleur, marginBottom: '0.5rem' }}
        >
          ✈️ Informations vol
        </div>
        {ligne(
          'Départ :',
          `Aéroport ${dossier.aeroport_depart || '.......'}, Vol ${
            dossier.numero_vol || '.......'
          }, le ${dossier.date_vol ? fmt(dossier.date_vol) : '.......'} à ${
            dossier.heure_depart_vol || '.......'
          }`
        )}
        {ligne('Compagnie :', dossier.compagnie_aerienne)}
        {ligne('LTA :', dossier.lta)}
        {dossier.aeroport_escale && (
          <>
            {ligne('Escale :', dossier.aeroport_escale)}
            {ligne('Heure arrivée escale :', dossier.heure_arrivee_escale)}
            {ligne(
              'Départ escale :',
              dossier.date_depart_escale
                ? `${fmt(dossier.date_depart_escale)} à ${
                    dossier.heure_depart_vol || '.......'
                  }, Vol ${dossier.numero_vol_escale || '.......'}`
                : undefined
            )}
          </>
        )}
        {ligne(
          'Arrivée :',
          `Aéroport ${dossier.aeroport_arrivee || '.......'} à ${
            dossier.heure_arrivee_vol || '.......'
          }`
        )}
      </div>
      {ligne('Qui sera inhumé(e) au cimetière de :', dossier.cimetiere_pays)}
      {ligne('Ambulance au pays :', dossier.ambulance_pays)}
      {ligne(
        'Contact au pays :',
        dossier.contact_pays
          ? `${dossier.contact_pays}${
              dossier.telephone_contact_pays
                ? ` — Tél : ${dossier.telephone_contact_pays}`
                : ''
            }`
          : undefined
      )}
      {ligne('Adresse contact :', dossier.adresse_contact_pays)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        Veuillez agréer, Monsieur le Consul, l'expression de notre parfaite
        considération.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet Consulat', true)}
      {piedPage()}
    </div>
  );

  const renderAttestationToilette = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('ATTESTATION DE TOILETTE RITUELLE')}
      <p>
        <strong style={{ color: couleur }}>{agence?.nom}</strong>,{' '}
        {agence?.adresse_complete}
        <br />
        Habilitation n° {agence?.habilitation}
      </p>
      <br />
      <p>Atteste avoir procédé à la toilette rituelle de :</p>
      {encadreDefunt(
        <>
          {ligne('Sexe :', d?.sexe)}
          {ligne('Nationalité :', d?.nationalite)}
        </>
      )}
      {ligne('Lieu de mise en bière :', etab)}
      {ligne(
        'Toilette le :',
        dossier.date_toilette
          ? `${fmt(dossier.date_toilette)}${
              dossier.heure_toilette ? ` à ${dossier.heure_toilette}` : ''
            }`
          : undefined
      )}
      {ligne(
        'Mise en bière le :',
        dossier.date_meb
          ? `${fmt(dossier.date_meb)}${
              dossier.heure_meb ? ` à ${dossier.heure_meb}` : ''
            }`
          : undefined
      )}
      {ligne('Toilette effectuée par :', agence?.nom)}
      <br />
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
        La toilette rituelle a été effectuée conformément aux rites islamiques,
        avec toute la dignité et le respect dus au défunt.
      </p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, 'Cachet', true)}
      {piedPage()}
    </div>
  );

  const renderAmbulance = () => (
    <div style={docStyle}>
      {entete()}
      {titrePrincipal('RÉSERVATION AMBULANCE')}
      <p>Salem a3leykom,</p>
      <br />
      <p>
        Veuillez trouver ci-joint les informations concernant le transport de
        corps de :
      </p>
      {encadreDefunt(
        <>
          {ligne('Sexe :', d?.sexe)}
          {ligne('Nationalité :', d?.nationalite)}
        </>
      )}
      <div
        style={{
          background: `${couleur}08`,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${couleur}22`,
        }}
      >
        <div
          style={{ fontWeight: 'bold', color: couleur, marginBottom: '0.5rem' }}
        >
          ✈️ Informations vol
        </div>
        {ligne(
          'Départ :',
          `Aéroport ${dossier.aeroport_depart || '.......'}, Vol ${
            dossier.numero_vol || '.......'
          }`
        )}
        {ligne('Date :', dossier.date_vol ? fmt(dossier.date_vol) : undefined)}
        {ligne('Heure départ :', dossier.heure_depart_vol)}
        {ligne('Compagnie :', dossier.compagnie_aerienne)}
        {ligne('LTA :', dossier.lta)}
        {dossier.aeroport_escale &&
          ligne(
            'Escale :',
            `${dossier.aeroport_escale} — arrivée ${
              dossier.heure_arrivee_escale || '.......'
            }`
          )}
        {ligne("Aéroport d'arrivée :", dossier.aeroport_arrivee)}
        {ligne("Heure d'arrivée :", dossier.heure_arrivee_vol)}
      </div>
      {ligne('Qui sera inhumé(e) au cimetière de :', dossier.cimetiere_pays)}
      {ligne('Ambulance au pays :', dossier.ambulance_pays)}
      {ligne(
        'Contact au pays :',
        dossier.contact_pays
          ? `${dossier.contact_pays}${
              dossier.telephone_contact_pays
                ? ` — Tél : ${dossier.telephone_contact_pays}`
                : ''
            }`
          : undefined
      )}
      {ligne('Adresse contact :', dossier.adresse_contact_pays)}
      <br />
      <p style={{ fontSize: '12px' }}>
        Tous les documents vous seront transmis ultérieurement.
      </p>
      <p style={{ fontSize: '12px' }}>
        Nous restons à votre disposition pour tout complément d'information.
      </p>
      <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Cordialement.</p>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
        Fait à {agence?.ville || '............'}, le {aujourd_hui}
      </p>
      {zoneSignature(`Signature ${agence?.nom}`, '', true)}
      {piedPage()}
    </div>
  );

  function imprimer() {
    const contenu = document.querySelector('.document-print');
    if (!contenu) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document — ${d?.prenom} ${d?.nom}</title><style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 0; font-size: 11px; line-height: 1.4; color: #333; margin: 0; }
      .print-hint { background: #EEF2FF; border: 1px solid ${couleur}; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; font-size: 13px; color: ${couleur}; text-align: center; }
      .no-print { display: none !important; }
      /* Compactage pour tenir sur une page A4 */
      .document-print > div, body > div { max-width: 100% !important; border: none !important; padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
      p { margin: 0.35rem 0 !important; }
      br { line-height: 0.7 !important; }
      h2 { font-size: 15px !important; margin: 0 0 0.25rem !important; }
      @media print {
        .print-hint { display: none; }
        body { font-size: 10px; line-height: 1.25; }
        p { margin: 0.25rem 0 !important; }
      }
      @page { margin: 0.7cm 1.1cm; size: A4; }
    </style></head><body><div class="print-hint">💡 <strong>Ctrl+P</strong> → <strong>"Enregistrer en PDF"</strong> → <strong>Enregistrer</strong></div>${contenu.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async function envoyerPouvoirSignature() {
    if (!p?.email) {
      alert("⚠️ Le mandataire n'a pas d'email renseigné dans le dossier.");
      return;
    }
    if (
      !confirm(
        `Envoyer le Pouvoir pour signature à ${p.prenom} ${p.nom} (${p.email}) ?`
      )
    )
      return;
    const contenu = document.querySelector('.document-print');
    if (!contenu) return;
    setEnvoi(true);
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { box-sizing: border-box; } body { margin:0; font-family: Arial, sans-serif; }</style></head><body>${contenu.innerHTML}</body></html>`;
      const conteneur = document.createElement('div');
      conteneur.style.width = '756px';
      conteneur.innerHTML = html;
      document.body.appendChild(conteneur);

      // 1) Mesurer le cadre de signature (avant de retirer le conteneur)
      const PT = 2.83465; // mm -> points
      const A4_W = 210; // largeur A4 (mm)
      const A4_H = 297; // hauteur A4 (mm)
      const A4_W_PT = 595; // largeur A4 (points)
      const A4_H_PT = 842; // hauteur A4 (points)
      const marge = 5; // marge du PDF en mm
      const contentPageH = A4_H - 2 * marge; // hauteur utile d'une page (mm)
      const cRect = conteneur.getBoundingClientRect();
      const sc = (A4_W - 2 * marge) / cRect.width; // px -> mm (largeur utile)
      const caseSig = conteneur.querySelector(
        '#case-signature-mandant'
      ) as HTMLElement | null;
      let mesure: any = null;
      if (caseSig) {
        const bRect = caseSig.getBoundingClientRect();
        const xFromContent = (bRect.left - cRect.left) * sc; // mm
        const yFromContent = (bRect.top - cRect.top) * sc; // mm
        const pageIndex = Math.floor(yFromContent / contentPageH); // 0-based
        mesure = {
          pageIndex,
          xOnPage: marge + xFromContent, // mm depuis le bord gauche de la page
          yOnPage: marge + (yFromContent - pageIndex * contentPageH), // mm depuis le haut de la page
          wMM: bRect.width * sc,
          hMM: bRect.height * sc,
        };
      }

      // 2) Générer le PDF ET récupérer le vrai nombre de pages
      const worker = (html2pdf as any)()
        .set({
          margin: marge,
          pagebreak: { mode: ['css', 'legacy'] },
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(conteneur)
        .toPdf();
      const pdfObj = await worker.get('pdf');
      const totalPages = pdfObj.internal.getNumberOfPages();
      const pdfBlob = pdfObj.output('blob');
      document.body.removeChild(conteneur);

      // 3) Convertir en points (le PDF est un A4 réel : 595 x 842 pt),
      //    origine en haut-gauche, avec bornage de sécurité.
      let champ: any = null;
      if (mesure) {
        const page = Math.min(mesure.pageIndex + 1, totalPages);
        let xPt = mesure.xOnPage * PT;
        let yPt = mesure.yOnPage * PT;
        let wPt = mesure.wMM * PT;
        let hPt = mesure.hMM * PT;
        // petite marge intérieure + hauteur de signature raisonnable
        xPt += wPt * 0.1;
        wPt *= 0.8;
        if (hPt > 40) {
          yPt += (hPt - 40) / 2;
          hPt = 40;
        }
        const x = Math.max(0, Math.min(Math.round(xPt), A4_W_PT - 20));
        const y = Math.max(0, Math.min(Math.round(yPt), A4_H_PT - 20));
        const width = Math.max(40, Math.min(Math.round(wPt), A4_W_PT - x));
        const height = Math.max(20, Math.min(Math.round(hPt), A4_H_PT - y));
        champ = { page, x, y, width, height };
      }

      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const { data, error } = await supabase.functions.invoke('yousign', {
        body: {
          pdf_base64: base64,
          champ,
          nom_document: `Pouvoir — ${d?.prenom || ''} ${d?.nom || ''}`,
          signataire: { prenom: p.prenom, nom: p.nom, email: p.email },
        },
      });

      if (error) alert('Erreur : ' + error.message);
      else if (data && data.ok) {
        await supabase.from('signatures').insert({
          dossier_id: dossierId,
          agence_id: dossier?.agence_id,
          type_document: 'pouvoir',
          demande_id: data.demande_id,
          signataire_email: p.email,
          statut: 'en_attente',
        });
        alert(data.message || '✅ Demande de signature envoyée !');
      }
      else
        alert(
          '❌ Problème : ' + JSON.stringify(data?.erreur || data || 'inconnu')
        );
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setEnvoi(false);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>📑 Documents administratifs</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
          {d?.civilite} {d?.prenom} {d?.nom}
        </span>
        <button
          onClick={imprimer}
          style={{
            padding: '0.5rem 1.2rem',
            background: couleur,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📥 Télécharger / PDF
        </button>
        {onglet === 'pouvoir' && (
          <button
            onClick={envoyerPouvoirSignature}
            disabled={envoi}
            style={{
              padding: '0.5rem 1.2rem',
              background: envoi ? '#ccc' : '#0F6E56',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: envoi ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            📤 Envoyer pour signature
          </button>
        )}
      </div>
      <div
        className="no-print"
        style={{
          borderBottom: '1px solid #eee',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto',
        }}
      >
        {onglets.map((o) => (
          <button
            key={o.key}
            style={ongletStyle(o.key)}
            onClick={() => setOnglet(o.key as Onglet)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {onglet === 'deroulement' && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            background: `${couleur}0d`,
            border: `1px solid ${couleur}22`,
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            marginBottom: '1rem',
            fontSize: '13px',
          }}
        >
          <span style={{ fontWeight: 600, color: '#555' }}>
            Afficher sur le déroulement :
          </span>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={afficherMeb}
              onChange={(e) => setAfficherMeb(e.target.checked)}
            />
            ⚰️ Mise en bière
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={afficherDepart}
              onChange={(e) => setAfficherDepart(e.target.checked)}
            />
            🚗 Fermeture & Départ
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={afficherSalat}
              onChange={(e) => setAfficherSalat(e.target.checked)}
            />
            🕌 Salat Al Janāza
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={afficherInhumation}
              onChange={(e) => setAfficherInhumation(e.target.checked)}
            />
            ⚱️ Lieu d'inhumation
          </label>
        </div>
      )}
      <div className="document-print">
        {onglet === 'pouvoir' && renderPouvoir()}
        {onglet === 'declaration_deces' && renderDeclarationDeces()}
        {onglet === 'apres_meb' && renderApresMeb()}
        {onglet === 'declaration_avant_meb' && renderDeclarationAvantMeb()}
        {onglet === 'acquisition' && renderAcquisition()}
        {onglet === 'demande_inhumation' && renderDemandeInhumation()}
        {onglet === 'bon_travaux' && renderBonTravaux()}
        {onglet === 'passage_mosquee' && renderPassageMosquee()}
        {onglet === 'chambre_mortuaire' && renderChambreMortuaire()}
        {onglet === 'iml' && renderIML()}
        {onglet === 'prefectorale' && renderPrefectorale()}
        {onglet === 'admission' && renderAdmission()}
        {onglet === 'deroulement' && renderDeroulement()}
        {onglet === 'page_de_garde' && renderPageDeGarde()}
        {onglet === 'calendrier' && renderCalendrier()}
        {onglet === 'attestation_meb' && renderAttestationMeb()}
        {onglet === 'prefecture_rapat' && renderPrefectureRapat()}
        {onglet === 'consulat_rapat' && renderConsulat()}
        {onglet === 'attestation_toilette' && renderAttestationToilette()}
        {onglet === 'ambulance_rapat' && renderAmbulance()}
      </div>
    </div>
  );
}
