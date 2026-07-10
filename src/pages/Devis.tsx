import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import DevisLibre from './DevisLibre';
import html2pdf from 'html2pdf.js';

interface Props {
  dossierId: string;
  onRetour: () => void;
}

interface Ligne {
  id?: string;
  libelle: string;
  tva: 'exonere' | 'tva_10' | 'tva_20';
  categorie: 'prestations_obligatoires' | 'prestations_non_obligatoires';
  section: string;
  prix_ttc: number;
  inclus: boolean;
  ordre: number;
}

type Onglet = 'devis' | 'facture' | 'bon_commande';

const LIGNES_DEFAUT: Ligne[] = [
  {
    libelle:
      '* Cercueil Local Adulte (essence de peuplier, forme lyonnaise, 22mm, 4 poignées, cuvette étanche, capiton) (*)',
    tva: 'tva_20',
    categorie: 'prestations_obligatoires',
    section: '3 - Cercueil & Accessoires',
    prix_ttc: 960,
    inclus: true,
    ordre: 1,
  },
  {
    libelle: "* Plaque d'identité apposée sur le cercueil (*)",
    tva: 'tva_20',
    categorie: 'prestations_obligatoires',
    section: '3 - Cercueil & Accessoires',
    prix_ttc: 20,
    inclus: true,
    ordre: 2,
  },
  {
    libelle: 'Creusement',
    tva: 'tva_20',
    categorie: 'prestations_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 500,
    inclus: true,
    ordre: 3,
  },
  {
    libelle: '* Taille : 1m50 Adulte',
    tva: 'tva_20',
    categorie: 'prestations_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: true,
    ordre: 4,
  },
  {
    libelle: '* Exhumation (**)',
    tva: 'tva_20',
    categorie: 'prestations_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 5,
  },
  {
    libelle:
      "* Démarches et formalités administratives (demandes d'autorisation auprès de la Mairie, Préfecture, Consulat, Organisation de départ…) (**)",
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '1 - Préparation / Organisation des Obsèques',
    prix_ttc: 150,
    inclus: true,
    ordre: 1,
  },
  {
    libelle:
      '* Coffret Adulte toilette rituelle (Linceul musulman, savon & musk…) (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '1 - Préparation / Organisation des Obsèques',
    prix_ttc: 20,
    inclus: true,
    ordre: 2,
  },
  {
    libelle: '* Housse Mortuaire de transfert (*)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '1 - Préparation / Organisation des Obsèques',
    prix_ttc: 0,
    inclus: false,
    ordre: 3,
  },
  {
    libelle: '* Personnel supplémentaire pour le transfert (hors forfait) (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '1 - Préparation / Organisation des Obsèques',
    prix_ttc: 0,
    inclus: false,
    ordre: 4,
  },
  {
    libelle: "* Retrait d'une prothèse fonctionnant au moyen d'une pile (**)",
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '1 - Préparation / Organisation des Obsèques',
    prix_ttc: 0,
    inclus: false,
    ordre: 5,
  },
  {
    libelle: '* Forfait transport de base (60 km) (*)',
    tva: 'tva_10',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 350,
    inclus: true,
    ordre: 1,
  },
  {
    libelle: '* Transport pour un trajet de km aller (sans défunt) (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 2,
  },
  {
    libelle: '* Transport pour un trajet de km retour (sans défunt) (**)',
    tva: 'tva_10',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 3,
  },
  {
    libelle:
      '* Supplément pour transport durant les heures de nuit, le dimanche et les jours fériés (**)',
    tva: 'tva_10',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 4,
  },
  {
    libelle: '* Personnel (dont nombre de porteur) (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 5,
  },
  {
    libelle: '* Forfait transport Adulte (60km) (*)',
    tva: 'tva_10',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 6,
  },
  {
    libelle: '* Péage Aller / Retour (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '5 - Transport du défunt après mise en bière',
    prix_ttc: 0,
    inclus: false,
    ordre: 7,
  },
  {
    libelle: '* Véhicule de cérémonie (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 1,
  },
  {
    libelle: '* Personnel (dont nombre de porteur) (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 2,
  },
  {
    libelle: '* Toilette rituelle offerte (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: true,
    ordre: 3,
  },
  {
    libelle:
      '* Chambre Funéraire ou Maison Funéraire ou Funérarium ou Athanée (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 4,
  },
  {
    libelle: '* Vacation de police (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 5,
  },
  {
    libelle: '* Toilette rituelle Mosquée de Paris (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 6,
  },
  {
    libelle: '* Taxes Institut Médico Légal (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '6 - Cérémonie funéraire',
    prix_ttc: 0,
    inclus: false,
    ordre: 7,
  },
  {
    libelle: '* Stèle en pierre de granit (*)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 70,
    inclus: true,
    ordre: 1,
  },
  {
    libelle: "* Plaque d'identité apposée sur la stèle (*)",
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 20,
    inclus: true,
    ordre: 2,
  },
  {
    libelle: '* Fourniture et pose semelle ciment adulte (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 490,
    inclus: true,
    ordre: 3,
  },
  {
    libelle: '* Construction fausse case béton (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 4,
  },
  {
    libelle: '* Frais de Déplacement plus de 50 km (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 5,
  },
  {
    libelle: '* Dépose monument (**)',
    tva: 'tva_20',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 6,
  },
  {
    libelle: '* Achat Concession Adulte & Enfant (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 7,
  },
  {
    libelle: '* Taxe municipale (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 8,
  },
  {
    libelle: '* Taxe Mairie (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 9,
  },
  {
    libelle: '* Taxe exhumation (**)',
    tva: 'exonere',
    categorie: 'prestations_non_obligatoires',
    section: '7A - Inhumation / Exhumation',
    prix_ttc: 0,
    inclus: false,
    ordre: 10,
  },
];
function appliquerTarifsPartenaire(
  base: Ligne[],
  tarifsP: any[],
  prestasRef: any[]
): Ligne[] {
  if (!tarifsP || tarifsP.length === 0) return base;
  let result = [...base];
  const libres: Ligne[] = [];
  let partenaireACercueil = false;

  tarifsP.forEach((tp, idx) => {
    const prix = parseFloat(tp.prix) || 0;
    if (tp.libelle_libre) {
      const estObl = tp.categorie === 'prestations_obligatoires';
      if (estObl && tp.libelle_libre.toLowerCase().includes('cercueil')) {
        partenaireACercueil = true;
      }
      libres.push({
        libelle: tp.libelle_libre,
        tva: (tp.tva as Ligne['tva']) || 'tva_20',
        categorie: estObl
          ? 'prestations_obligatoires'
          : 'prestations_non_obligatoires',
        section: estObl
          ? '3 - Cercueil & Accessoires'
          : '1 - Préparation / Organisation des Obsèques',
        prix_ttc: prix,
        inclus: prix > 0,
        ordre: 90 + idx,
      });
    } else if (tp.prestation_id) {
      const presta = prestasRef.find((p) => p.id === tp.prestation_id);
      if (presta) {
        result = result.map((l) =>
          l.libelle === presta.libelle
            ? { ...l, prix_ttc: prix, inclus: prix > 0 }
            : l
        );
      }
    }
  });

  // Si le partenaire a son propre cercueil, on retire le cercueil par défaut
  if (partenaireACercueil) {
    result = result.filter(
      (l) =>
        !(
          l.categorie === 'prestations_obligatoires' &&
          l.section === '3 - Cercueil & Accessoires' &&
          l.libelle.toLowerCase().includes('cercueil') &&
          !l.libelle.toLowerCase().includes('plaque') &&
          !l.libelle.toLowerCase().includes('housse')
        )
    );
  }

  return [...result, ...libres];
}

export default function Devis({ dossierId, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('devis');
  const [lignes, setLignes] = useState<Ligne[]>(LIGNES_DEFAUT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [cimetiere, setCimetiere] = useState<any>(null);
  const [concessionChoisie, setConcessionChoisie] = useState('');
  const [statutDevis, setStatutDevis] = useState('en_attente');
  const [statutFacture, setStatutFacture] = useState('non_payee');
  const [statutBonCommande, setStatutBonCommande] = useState('en_attente');
  const [acompte, setAcompte] = useState(0);
  const [modesPaiement, setModesPaiement] = useState<string[]>([]);
  const [datePaiement, setDatePaiement] = useState('');
  const [remise, setRemise] = useState(0);
  const [tarifsRapatriement, setTarifsRapatriement] = useState<any[]>([]);
  const [destinationChoisie, setDestinationChoisie] = useState('');
  const [typeRapatrie, setTypeRapatrie] = useState<'adulte' | 'enfant'>(
    'adulte'
  );
  const [catalogueCercueils, setCatalogueCercueils] = useState<any[]>([]);
  const [prestationsRef, setPrestationsRef] = useState<any[]>([]);
  const [tarifsPartenaire, setTarifsPartenaire] = useState<any[]>([]);
  const [partenaireNom, setPartenaireNom] = useState('');

  useEffect(() => {
    chargerDossier();
  }, [dossierId]);

  // Génère un numéro dédié (DEV / BC / FAC) la 1re fois qu'on ouvre chaque onglet
  useEffect(() => {
    if (!dossier) return;
    const col =
      onglet === 'devis'
        ? 'numero_devis'
        : onglet === 'bon_commande'
        ? 'numero_bon_commande'
        : 'numero_facture';
    if (!(dossier as any)[col]) genererNumero(onglet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet, dossier]);

  async function genererNumero(type: Onglet) {
    if (!dossier) return;
    const config: Record<Onglet, { col: string; pfx: string }> = {
      devis: { col: 'numero_devis', pfx: 'DEV' },
      bon_commande: { col: 'numero_bon_commande', pfx: 'BC' },
      facture: { col: 'numero_facture', pfx: 'FAC' },
    };
    const { col, pfx } = config[type];
    if ((dossier as any)[col]) return; // déjà un numéro
    try {
      const annee = new Date().getFullYear();
      const prefixe = `${pfx}-${annee}-`;
      const { data: derniers } = await supabase
        .from('dossiers')
        .select(col)
        .eq('agence_id', dossier.agence_id)
        .like(col, `${prefixe}%`)
        .order(col, { ascending: false })
        .limit(1);
      let seq = 1;
      if (derniers && derniers.length > 0 && (derniers[0] as any)[col]) {
        const n = parseInt(
          String((derniers[0] as any)[col]).split('-').pop() || '0',
          10
        );
        if (!isNaN(n)) seq = n + 1;
      }
      const nouveau = `${prefixe}${String(seq).padStart(4, '0')}`;
      await supabase
        .from('dossiers')
        .update({ [col]: nouveau })
        .eq('id', dossierId);
      setDossier((d: any) => (d ? { ...d, [col]: nouveau } : d));
    } catch (e) {
      // En cas d'échec, on n'empêche pas l'ouverture du document
    }
  }

  // Numéro du document actuellement affiché
  const numeroDocument = () =>
    (onglet === 'devis'
      ? dossier?.numero_devis
      : onglet === 'bon_commande'
      ? dossier?.numero_bon_commande
      : dossier?.numero_facture) || '';

  async function chargerDossier(forceRebuild = false) {
    const { data } = await supabase
      .from('dossiers')
      .select(
        '*, cimetieres!dossiers_cimetiere_id_fkey(*), defunts(*), agences(*), pouvoirs(*), mairies!dossiers_mairie_deces_id_fkey(commune)'
      )
      .eq('id', dossierId)
      .single();
    if (data) {
      setDossier(data);
      if (data.cimetieres) setCimetiere(data.cimetieres);
      setStatutDevis(data.statut_devis || 'en_attente');
      setStatutFacture(data.statut_facture || 'non_payee');
      setStatutBonCommande(data.statut_bon_commande || 'en_attente');
      setAcompte(data.acompte_verse || 0);
      setRemise(data.remise || 0);
      setModesPaiement(data.modes_paiement || []);
      setDatePaiement(data.date_paiement || '');
      if (data.type_dossier === 'rapatriement') {
        const { data: tarifs } = await supabase
          .from('tarifs_rapatriement')
          .select('*')
          .eq('agence_id', data.agence_id)
          .order('ordre');
        setTarifsRapatriement(tarifs || []);
      }
      const { data: cercueils } = await supabase
        .from('catalogue_cercueils')
        .select('*')
        .eq('actif', true)
        .eq('agence_id', data.agence_id)
        .order('nom');
      setCatalogueCercueils(cercueils || []);
      const { data: prestas } = await supabase
        .from('prestations')
        .select('*')
        .eq('agence_id', data.agence_id)
        .order('section')
        .order('ordre');
        setPrestationsRef(prestas || []);
        if (data.partenaire_id) {
          const { data: part } = await supabase
            .from('partenaires')
            .select('nom')
            .eq('id', data.partenaire_id)
            .maybeSingle();
          setPartenaireNom(part?.nom || '');
          const { data: tp } = await supabase
            .from('tarifs_partenaires')
            .select('*')
            .eq('partenaire_id', data.partenaire_id);
          setTarifsPartenaire(tp || []);
        }
      }
    const { data: lignesSaved } = await supabase
      .from('lignes_dossier')
      .select('*')
      .eq('dossier_id', dossierId)
      .eq('type_document', 'devis')
      .order('ordre');
    if (!forceRebuild && lignesSaved && lignesSaved.length > 0) {
      setLignes(
        lignesSaved.map((l) => ({
          libelle: l.libelle,
          tva: l.tva,
          categorie: l.categorie,
          section: l.section || '',
          prix_ttc: l.prix_ttc,
          inclus: l.inclus,
          ordre: l.ordre,
        }))
      );
      if (data?.achat_concession) setConcessionChoisie(data.achat_concession);
    } else {
      // Charger les prestations du référentiel pour cette agence
      const { data: prestasInit } = await supabase
        .from('prestations')
        .select('*')
        .eq('agence_id', data?.agence_id)
        .order('section')
        .order('ordre');

      // Tarifs du partenaire (pour la construction du devis)
      let tarifsPLocal: any[] = [];
      if (data?.partenaire_id) {
        const { data: tpl } = await supabase
          .from('tarifs_partenaires')
          .select('*')
          .eq('partenaire_id', data.partenaire_id);
        tarifsPLocal = tpl || [];
      }

      let lignesInit: Ligne[];
// Rapatriement : pré-remplir automatiquement depuis la destination du dossier
if (data?.type_dossier === 'rapatriement') {
  const { data: tarifsR } = await supabase
    .from('tarifs_rapatriement')
    .select('*')
    .eq('agence_id', data.agence_id)
    .order('ordre');
  const t = (tarifsR || []).find(
    (x: any) => x.id === data.destination_id
  );
  const typeR =
    data?.defunts?.civilite === 'Enfant' || data?.defunts?.civilite === 'Bébé'
      ? 'enfant'
      : 'adulte';
  setTypeRapatrie(typeR);
  if (t) {
    setDestinationChoisie(t.id);
    setLignes(
      appliquerTarifsPartenaire(
        construireLignesRapatriement(t, typeR),
        tarifsPLocal,
        prestasInit || []
      )
    );
  } else {
    setLignes([]);
  }
  return;
}
      if (
        data?.type_dossier === 'inhumation_locale' &&
        prestasInit &&
        prestasInit.length > 0
      ) {
        // Lignes OBLIGATOIRES gardées en dur (cercueil, plaque, creusement, taille, exhumation)
        const obligatoires = LIGNES_DEFAUT.filter(
          (l) => l.categorie === 'prestations_obligatoires'
        );
        // Lignes NON-OBLIGATOIRES depuis le référentiel (prix enfant si bébé/enfant)
        const estEnfant =
          data?.defunts?.civilite === 'Enfant' ||
          data?.defunts?.civilite === 'Bébé';
        const nonObligatoires: Ligne[] = prestasInit.map((p, idx) => {
          const prixEnfantOk =
            estEnfant && p.prix_enfant != null && p.prix_enfant !== '';
          const prix = prixEnfantOk
            ? parseFloat(p.prix_enfant)
            : parseFloat(p.prix);
          return {
            libelle: p.libelle,
            tva: (p.tva as Ligne['tva']) || 'tva_20',
            categorie: 'prestations_non_obligatoires' as const,
            section: p.section || '',
            prix_ttc: prix || 0,
            inclus: (prix || 0) > 0,
            ordre: p.ordre || idx + 1,
          };
        });
        lignesInit = [...obligatoires, ...nonObligatoires];
      } else {
        // Sécurité : si pas de prestations au référentiel, ou rapatriement, on garde le défaut
        lignesInit = [...LIGNES_DEFAUT];
      }

      const cim = data?.cimetieres;
      if (data?.achat_concession && data?.montant_concession && cim) {
        setConcessionChoisie(data.achat_concession);
        lignesInit = lignesInit.map((l) =>
          l.libelle.includes('Achat Concession')
            ? {
                ...l,
                prix_ttc: parseFloat(data.montant_concession) || 0,
                inclus: parseFloat(data.montant_concession) > 0,
                libelle: `Achat Concession ${data.achat_concession.replace(
                  /_/g,
                  ' '
                )} — ${cim.nom}`,
              }
            : l
        );
      }
      if (cim?.semelle_imposee)
        lignesInit = lignesInit.map((l) =>
          l.libelle.includes('semelle ciment') ? { ...l, inclus: true } : l
        );
      if (cim?.fausse_case_imposee)
        lignesInit = lignesInit.map((l) =>
          l.libelle.includes('fausse case') ? { ...l, inclus: true } : l
        );

      // Pré-remplir cercueil depuis le catalogue (uniquement la ligne cercueil, pas la plaque)
      if (data?.cercueil_id) {
        const cercueil = catalogueCercueils?.find(
          (c: any) => c.id === data.cercueil_id
        );
        if (cercueil) {
          let cercueilFait = false;
          lignesInit = lignesInit.map((l) => {
            if (
              !cercueilFait &&
              l.categorie === 'prestations_obligatoires' &&
              l.section === '3 - Cercueil & Accessoires' &&
              l.libelle.toLowerCase().includes('cercueil') &&
              !l.libelle.toLowerCase().includes('plaque')
            ) {
              cercueilFait = true;
              return {
                ...l,
                libelle: cercueil.nom,
                prix_ttc: cercueil.prix_ttc || 0,
                inclus: true,
              };
            }
            return l;
          });
        }
      }

      // Plaque d'identité
      if (data?.plaque_identite) {
        const prix = data.plaque_identite === '2' ? 40 : 20;
        const libelle =
          data.plaque_identite === '2'
            ? "* 2 Plaques d'identité (**)"
            : "* 1 Plaque d'identité (**)";
        lignesInit = lignesInit.map((l) =>
          l.libelle.toLowerCase().includes("plaque d'identité") &&
          l.categorie === 'prestations_obligatoires'
            ? { ...l, libelle, prix_ttc: prix, inclus: true }
            : l
        );
      }

      // Housse mortuaire
      if (data?.housse_mortuaire) {
        const prix = data.housse_mortuaire === 'requise' ? 100 : 50;
        lignesInit = lignesInit.map((l) =>
          l.libelle.toLowerCase().includes('housse mortuaire')
            ? { ...l, prix_ttc: prix, inclus: true }
            : l
        );
      }

      // Zinc rapatriement
      if (data?.zinc) {
        lignesInit = lignesInit.map((l) =>
          l.libelle.toLowerCase().includes('zinc') ? { ...l, inclus: true } : l
        );
      }

      // Housse cercueil rapatriement
      if (data?.housse_cercueil_rapat) {
        lignesInit = lignesInit.map((l) =>
          l.libelle.toLowerCase().includes('housse cercueil')
            ? { ...l, inclus: true }
            : l
        );
      }
      // Creusement choisi dans le dossier
      if (data?.creusement_type) {
        let creusementFait = false;
        lignesInit = lignesInit.map((l) => {
          if (
            !creusementFait &&
            l.section === '7A - Inhumation / Exhumation' &&
            l.libelle === 'Creusement'
          ) {
            creusementFait = true;
            return {
              ...l,
              libelle: data.creusement_type,
              prix_ttc: parseFloat(data.creusement_prix) || 0,
              inclus: true,
            };
          }
          return l;
        });
      }
      lignesInit = appliquerTarifsPartenaire(
        lignesInit,
        tarifsPLocal,
        prestasInit || []
      );
      setLignes(lignesInit);
    }
  }

  // Verrou : un document validé/verrouillé ne peut plus être modifié
  function estVerrouille() {
    return (
      (onglet === 'devis' && statutDevis === 'accepte') ||
      (onglet === 'bon_commande' && statutBonCommande === 'valide') ||
      (onglet === 'facture' && dossier?.facture_verrouillee)
    );
  }
  function alerteVerrou() {
    alert(
      '🔒 Ce document est validé et ne peut plus être modifié (obligation légale d\'inaltérabilité).\n\nEn cas d\'erreur : annulez le dossier et créez-en un nouveau.'
    );
  }

  function updateLigne(index: number, champ: keyof Ligne, valeur: any) {
    if (estVerrouille()) return alerteVerrou();
    setLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    );
  }

  function ajouterLigne(categorie: Ligne['categorie'], section: string) {
    if (estVerrouille()) return alerteVerrou();
    setLignes((prev) => [
      ...prev,
      {
        libelle: '',
        tva: 'tva_20',
        categorie,
        section,
        prix_ttc: 0,
        inclus: true,
        ordre: 99,
      },
    ]);
  }

  function supprimerLigne(index: number) {
    if (estVerrouille()) return alerteVerrou();
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  function choisirConcession(val: string) {
    setConcessionChoisie(val);
    if (!val || !cimetiere) return;
    const prix =
      val === '10ans_adulte'
        ? cimetiere.tarif_10ans_adulte
        : val === '15ans_adulte'
        ? cimetiere.tarif_15ans_adulte
        : val === '30ans_adulte'
        ? cimetiere.tarif_30ans_adulte
        : val === '50ans_adulte'
        ? cimetiere.tarif_50ans_adulte
        : val === 'perpet_adulte'
        ? cimetiere.tarif_perpet_adulte
        : val === '10ans_enfant'
        ? cimetiere.tarif_10ans_enfant
        : val === '15ans_enfant'
        ? cimetiere.tarif_15ans_enfant
        : val === '30ans_enfant'
        ? cimetiere.tarif_30ans_enfant
        : val === '50ans_enfant'
        ? cimetiere.tarif_50ans_enfant
        : val === 'perpet_enfant'
        ? cimetiere.tarif_perpet_enfant
        : 0;
    setLignes((prev) =>
      prev.map((l) =>
        l.libelle.includes('Achat Concession')
          ? {
              ...l,
              prix_ttc: prix || 0,
              inclus: (prix || 0) > 0,
              libelle: `Achat Concession ${val.replace(/_/g, ' ')} — ${
                cimetiere.nom
              }`,
            }
          : l
      )
    );
  }

  function construireLignesRapatriement(
    t: any,
    type: 'adulte' | 'enfant' = 'adulte'
  ): Ligne[] {
    const estEnfant = type === 'enfant';
    return [
      {
        libelle: estEnfant
          ? '* Cercueil Enfant couleur bois (essence de peuplier, forme lyonnaise, avec cuvette étanche, 4 poignées, capiton) (*)'
          : '* Cercueil Prestige couleur bois (essence de peuplier, forme lyonnaise, avec cuvette étanche, 4 poignées, capiton) (*)',
        tva: 'tva_20',
        categorie: 'prestations_obligatoires',
        section: '3 - Cercueil & Accessoires',
        prix_ttc: estEnfant
          ? t.cercueil_enfant || 510
          : t.cercueil_adulte || 960,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: '* Zinc pour transport aérien (*)',
        tva: 'exonere',
        categorie: 'prestations_obligatoires',
        section: '3 - Cercueil & Accessoires',
        prix_ttc: t.zinc || 70,
        inclus: true,
        ordre: 2,
      },
      {
        libelle: "* Plaque d'identité apposée sur le cercueil (*)",
        tva: 'exonere',
        categorie: 'prestations_obligatoires',
        section: '3 - Cercueil & Accessoires',
        prix_ttc: 20,
        inclus: true,
        ordre: 3,
      },
      {
        libelle: '* Housse cercueil (**)',
        tva: 'exonere',
        categorie: 'prestations_obligatoires',
        section: '3 - Cercueil & Accessoires',
        prix_ttc: t.housse_cercueil || 18,
        inclus: true,
        ordre: 4,
      },
      {
        libelle:
          "* Démarches et formalités administratives (demandes d'autorisation auprès de la Mairie, Préfecture, Consulat, Organisation de départ…) (**)",
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: 150,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: estEnfant
          ? '* Coffret Enfant toilette rituelle (Linceul, savon & musk…) (**)'
          : '* Coffret Adulte toilette rituelle (Linceul musulman, savon & musk…) (**)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: 20,
        inclus: true,
        ordre: 2,
      },
      {
        libelle: '* Housse Mortuaire de transfert (*)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: t.housse_mortuaire || 50,
        inclus: false,
        ordre: 3,
      },
      {
        libelle:
          '* Personnel supplémentaire pour le transfert (hors forfait) (**)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: 0,
        inclus: false,
        ordre: 4,
      },
      {
        libelle:
          "* Retrait d'une prothèse fonctionnant au moyen d'une pile (**)",
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: 0,
        inclus: false,
        ordre: 5,
      },
      {
        libelle: '* Diagnos en compagnie (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '1 - Préparation / Organisation des Obsèques',
        prix_ttc: t.diagnos || 75,
        inclus: true,
        ordre: 6,
      },
      {
        libelle: estEnfant
          ? "* Transport Avant MEB Enfant - mise à disposition d'un véhicule funéraire agréé avec son équipe - forfait (60 km) (*)"
          : "* Transport Avant MEB Adulte - mise à disposition d'un véhicule funéraire agréé avec son équipe - forfait (60 km) (*)",
        tva: 'tva_10',
        categorie: 'prestations_non_obligatoires',
        section: '2 - Transport avant mise en bière',
        prix_ttc: estEnfant
          ? t.transport_avant_meb_enfant || 160
          : t.transport_avant_meb_adulte || 250,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: '* Transport pour un trajet aller (sans défunt) (**)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '2 - Transport avant mise en bière',
        prix_ttc: 0,
        inclus: false,
        ordre: 2,
      },
      {
        libelle: '* Transport pour un trajet retour (sans défunt) (**)',
        tva: 'tva_10',
        categorie: 'prestations_non_obligatoires',
        section: '2 - Transport avant mise en bière',
        prix_ttc: 0,
        inclus: false,
        ordre: 3,
      },
      {
        libelle: '* Supplément transport nuit/dimanche/férié (**)',
        tva: 'tva_10',
        categorie: 'prestations_non_obligatoires',
        section: '2 - Transport avant mise en bière',
        prix_ttc: 0,
        inclus: false,
        ordre: 4,
      },
      {
        libelle: estEnfant
          ? "* Transport Après MEB Enfant - mise à disposition d'un véhicule funéraire agréé avec son équipe - forfait (60 km) (*)"
          : "* Transport Après MEB Adulte - mise à disposition d'un véhicule funéraire agréé avec son équipe - forfait (60 km) (*)",
        tva: 'tva_10',
        categorie: 'prestations_non_obligatoires',
        section: '5 - Transport après mise en bière',
        prix_ttc: estEnfant
          ? t.transport_apres_meb_enfant || 160
          : t.transport_apres_meb_adulte || 350,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: '* Transport pour un trajet aller (sans défunt) (**)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '5 - Transport après mise en bière',
        prix_ttc: 0,
        inclus: false,
        ordre: 2,
      },
      {
        libelle: '* Péage Aller / Retour (**)',
        tva: 'tva_20',
        categorie: 'prestations_non_obligatoires',
        section: '5 - Transport après mise en bière',
        prix_ttc: 0,
        inclus: false,
        ordre: 3,
      },
      {
        libelle: `* Fret aérien / Billet défunt — ${t.label} — ${t.compagnie}`,
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '7 - Exhumation & Rapatriement',
        prix_ttc: estEnfant ? t.billet_enfant || 0 : t.billet_adulte || 0,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: '* Frais dépositoire 1 nuit (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '7 - Exhumation & Rapatriement',
        prix_ttc: t.frais_depositoire_1nuit || 185,
        inclus: false,
        ordre: 2,
      },
      {
        libelle: '* Frais dépositoire 2 nuits (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '7 - Exhumation & Rapatriement',
        prix_ttc: t.frais_depositoire_2nuits || 370,
        inclus: false,
        ordre: 3,
      },
      {
        libelle: '* Frais dépositoire 3 nuits (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '7 - Exhumation & Rapatriement',
        prix_ttc: t.frais_depositoire_3nuits || 555,
        inclus: false,
        ordre: 4,
      },
      {
        libelle: '* Toilette rituelle offerte (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '6 - Cérémonie funéraire',
        prix_ttc: 0,
        inclus: true,
        ordre: 1,
      },
      {
        libelle: '* Vacation de police (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '6 - Cérémonie funéraire',
        prix_ttc: 0,
        inclus: false,
        ordre: 2,
      },
      {
        libelle: '* Chambre Funéraire ou Funérarium (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '6 - Cérémonie funéraire',
        prix_ttc: 0,
        inclus: false,
        ordre: 3,
      },
      {
        libelle: '* Taxes Institut Médico Légal (**)',
        tva: 'exonere',
        categorie: 'prestations_non_obligatoires',
        section: '6 - Cérémonie funéraire',
        prix_ttc: 0,
        inclus: false,
        ordre: 4,
      },
    ];
  }

  async function choisirDestination(
    id: string,
    type: 'adulte' | 'enfant' = typeRapatrie
  ) {
    setDestinationChoisie(id);
    if (!id) {
      setLignes([]);
      return;
    }
    const t = tarifsRapatriement.find((t) => t.id === id);
    if (!t) return;
    setLignes(
      appliquerTarifsPartenaire(
        construireLignesRapatriement(t, type),
        tarifsPartenaire,
        prestationsRef
      )
    );
    // Synchroniser le choix dans le dossier (un seul et même choix partout)
    await supabase
      .from('dossiers')
      .update({ destination_id: id })
      .eq('id', dossierId);
    setDossier((d: any) => (d ? { ...d, destination_id: id } : d));
  }

  function changerTypeRapatrie(type: 'adulte' | 'enfant') {
    setTypeRapatrie(type);
    if (destinationChoisie) choisirDestination(destinationChoisie, type);
  }

  const lignesObl = lignes.filter(
    (l) => l.categorie === 'prestations_obligatoires'
  );
  const lignesNonObl = lignes.filter(
    (l) => l.categorie === 'prestations_non_obligatoires'
  );
  const totalObl = lignesObl
    .filter((l) => l.inclus)
    .reduce((s, l) => s + l.prix_ttc, 0);
  const totalNonObl = lignesNonObl
    .filter((l) => l.inclus)
    .reduce((s, l) => s + l.prix_ttc, 0);
  const lignesIncluses = lignes.filter((l) => l.inclus && l.prix_ttc > 0);
  // --- Totaux BRUTS par taux de TVA (avant remise) ---
  const tva0Brut = lignesIncluses
    .filter((l) => l.tva === 'exonere')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const tva10Brut = lignesIncluses
    .filter((l) => l.tva === 'tva_10')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const tva20Brut = lignesIncluses
    .filter((l) => l.tva === 'tva_20')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const ttcBrut = tva0Brut + tva10Brut + tva20Brut;
  // --- Remise globale : ventilée AU PRORATA de chaque taux de TVA ---
  // (chaque bloc baisse du même pourcentage → chaque TVA reste juste)
  const remiseAppliquee = Math.max(0, Math.min(remise, ttcBrut));
  const k = ttcBrut > 0 ? (ttcBrut - remiseAppliquee) / ttcBrut : 1;
  const tva0 = tva0Brut * k;
  const tva10ttc = tva10Brut * k;
  const tva10ht = tva10ttc / 1.1;
  const tva10montant = tva10ttc - tva10ht;
  const tva20ttc = tva20Brut * k;
  const tva20ht = tva20ttc / 1.2;
  const tva20montant = tva20ttc - tva20ht;
  const totalHT = tva10ht + tva20ht + tva0;
  const totalTVA = tva10montant + tva20montant;
  const totalTTC = ttcBrut - remiseAppliquee;
  const resteAPayer = totalTTC - acompte;

  async function sauvegarder(override?: {
    statutDevis?: string;
    statutBonCommande?: string;
    statutFacture?: string;
  }) {
    setSaving(true);
    const factureVerr = dossier?.facture_verrouillee;
    try {
      // Facture verrouillée : le CONTENU est figé (obligation légale),
      // mais on peut TOUJOURS enregistrer le PAIEMENT (statut, acompte, date, modes).
      if (factureVerr) {
        const { error } = await supabase
          .from('dossiers')
          .update({
            statut_facture: override?.statutFacture ?? statutFacture,
            acompte_verse: acompte,
            modes_paiement: modesPaiement,
            date_paiement: datePaiement || null,
          })
          .eq('id', dossierId);
        if (error) {
          alert('❌ Erreur enregistrement paiement : ' + error.message);
          setSaving(false);
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setSaving(false);
        return;
      }
      await supabase
        .from('lignes_dossier')
        .delete()
        .eq('dossier_id', dossierId)
        .eq('type_document', 'devis');
      await supabase.from('lignes_dossier').insert(
        lignes.map((l) => ({
          dossier_id: dossierId,
          type_document: 'devis',
          categorie: l.categorie,
          section: l.section || '',
          libelle: l.libelle,
          tva: l.tva,
          prix_ttc: l.prix_ttc,
          prix_ht:
            l.tva === 'tva_20'
              ? l.prix_ttc / 1.2
              : l.tva === 'tva_10'
              ? l.prix_ttc / 1.1
              : l.prix_ttc,
          inclus: l.inclus,
          ordre: l.ordre,
        }))
      );
      const { error: errMaj } = await supabase
        .from('dossiers')
        .update({
          statut_devis: override?.statutDevis ?? statutDevis,
          statut_bon_commande:
            override?.statutBonCommande ?? statutBonCommande,
          statut_facture: override?.statutFacture ?? statutFacture,
          acompte_verse: acompte,
          remise: remise,
          modes_paiement: modesPaiement,
          date_paiement: datePaiement || null,
        })
        .eq('id', dossierId);
      if (errMaj) {
        alert(
          '❌ Erreur enregistrement statut : ' +
            errMaj.message +
            '\n\n(Souvent une colonne manquante — vérifie que le SQL a bien été passé.)'
        );
        setSaving(false);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
    setSaving(false);
  }

  const statutBadge = (statut: string) => {
    const map: any = {
      en_attente: { label: 'En attente', bg: '#FAEEDA', color: '#854F0B' },
      accepte: { label: 'Accepté', bg: '#E1F5EE', color: '#0F6E56' },
      refuse: { label: 'Refusé', bg: '#FAECE7', color: '#993C1D' },
      valide: { label: 'Validé', bg: '#E1F5EE', color: '#0F6E56' },
      non_payee: { label: 'Non payée', bg: '#FAECE7', color: '#993C1D' },
      partiellement_payee: {
        label: 'Partiel',
        bg: '#FAEEDA',
        color: '#854F0B',
      },
      payee: { label: 'Payée ✅', bg: '#E1F5EE', color: '#0F6E56' },
    };
    const s = map[statut] || { label: statut, bg: '#f0f0f0', color: '#666' };
    return (
      <span
        style={{
          background: s.bg,
          color: s.color,
          padding: '0.3rem 0.8rem',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        {s.label}
      </span>
    );
  };

  const inputPrix = {
    width: '80px',
    padding: '0.3rem',
    textAlign: 'right' as const,
    border: '1px solid #ddd',
    borderRadius: '4px',
  };

  const getSections = (
    categorie: 'prestations_obligatoires' | 'prestations_non_obligatoires'
  ) => {
    return [
      ...new Set(
        lignes.filter((l) => l.categorie === categorie).map((l) => l.section)
      ),
    ].filter(Boolean);
  };

  const renderColonne = (
    categorie: 'prestations_obligatoires' | 'prestations_non_obligatoires',
    titre: string,
    couleur: string,
    bg: string
  ) => {
    const sections = getSections(categorie);
    const total = lignes
      .filter((l) => l.categorie === categorie && l.inclus)
      .reduce((s, l) => s + l.prix_ttc, 0);
    return (
      <div
        style={{
          flex: 1,
          background: bg,
          border: `1px solid ${couleur}`,
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <h3
          style={{
            color: couleur,
            fontSize: '13px',
            margin: '0 0 1rem',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {titre}
        </h3>
        {categorie === 'prestations_non_obligatoires' && cimetiere && (
          <div
            style={{
              background: 'white',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              border: `1px solid ${couleur}`,
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: couleur,
                marginBottom: '0.4rem',
              }}
            >
              🏛️ Concession — {cimetiere.nom}
            </div>
            <select
              value={concessionChoisie}
              onChange={(e) => choisirConcession(e.target.value)}
              style={{ width: '100%', padding: '0.3rem', fontSize: '11px' }}
            >
              <option value="">-- Choisir la durée --</option>
              {cimetiere.tarif_10ans_adulte > 0 && (
                <option value="10ans_adulte">
                  10 ans adulte — {cimetiere.tarif_10ans_adulte} €
                </option>
              )}
              {cimetiere.tarif_15ans_adulte > 0 && (
                <option value="15ans_adulte">
                  15 ans adulte — {cimetiere.tarif_15ans_adulte} €
                </option>
              )}
              {cimetiere.tarif_30ans_adulte > 0 && (
                <option value="30ans_adulte">
                  30 ans adulte — {cimetiere.tarif_30ans_adulte} €
                </option>
              )}
              {cimetiere.tarif_50ans_adulte > 0 && (
                <option value="50ans_adulte">
                  50 ans adulte — {cimetiere.tarif_50ans_adulte} €
                </option>
              )}
              {cimetiere.tarif_perpet_adulte > 0 && (
                <option value="perpet_adulte">
                  Perpétuelle adulte — {cimetiere.tarif_perpet_adulte} €
                </option>
              )}
              {cimetiere.tarif_10ans_enfant > 0 && (
                <option value="10ans_enfant">
                  10 ans enfant — {cimetiere.tarif_10ans_enfant} €
                </option>
              )}
              {cimetiere.tarif_15ans_enfant > 0 && (
                <option value="15ans_enfant">
                  15 ans enfant — {cimetiere.tarif_15ans_enfant} €
                </option>
              )}
              {cimetiere.tarif_30ans_enfant > 0 && (
                <option value="30ans_enfant">
                  30 ans enfant — {cimetiere.tarif_30ans_enfant} €
                </option>
              )}
              {cimetiere.tarif_50ans_enfant > 0 && (
                <option value="50ans_enfant">
                  50 ans enfant — {cimetiere.tarif_50ans_enfant} €
                </option>
              )}
              {cimetiere.tarif_perpet_enfant > 0 && (
                <option value="perpet_enfant">
                  Perpétuelle enfant — {cimetiere.tarif_perpet_enfant} €
                </option>
              )}
            </select>
          </div>
        )}
        {sections.map((section) => (
          <div key={section} style={{ marginBottom: '1rem' }}>
            <div
              style={{
                background: couleur,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              {section}
            </div>
            {lignes.map((l, i) =>
              l.categorie === categorie && l.section === section ? (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '0.25rem',
                    alignItems: 'center',
                    marginBottom: '0.3rem',
                    opacity: l.inclus ? 1 : 0.4,
                  }}
                >
                  <input
                    value={l.libelle}
                    onChange={(e) => updateLigne(i, 'libelle', e.target.value)}
                    style={{
                      fontSize: '11px',
                      padding: '0.25rem',
                      border: '1px solid #eee',
                      borderRadius: '3px',
                      width: '100%',
                    }}
                  />
                  <input
                    type="number"
                    value={l.prix_ttc}
                    onChange={(e) =>
                      updateLigne(
                        i,
                        'prix_ttc',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    style={inputPrix}
                  />
                  <input
                    type="checkbox"
                    checked={l.inclus}
                    onChange={(e) => updateLigne(i, 'inclus', e.target.checked)}
                    title="Inclure"
                  />
                  <button
                    onClick={() => supprimerLigne(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ccc',
                      fontSize: '14px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : null
            )}
            <button
              onClick={() => ajouterLigne(categorie, section)}
              style={{
                width: '100%',
                padding: '0.25rem',
                background: 'none',
                border: `1px dashed ${couleur}`,
                borderRadius: '4px',
                color: couleur,
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '0.25rem',
              }}
            >
              + Ajouter
            </button>
          </div>
        ))}
        <div
          style={{
            borderTop: `2px solid ${couleur}`,
            marginTop: '1rem',
            paddingTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            color: couleur,
          }}
        >
          <span>Total TTC</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>
    );
  };

  function construireHTMLDocument() {
    const titreDoc =
      onglet === 'devis'
        ? 'Devis'
        : onglet === 'facture'
        ? 'Facture'
        : 'Bon de commande';
    const d = dossier?.defunts;
    const p = dossier?.pouvoirs?.[0];
    const agence = dossier?.agences;
    const couleur = agence?.couleur_principale || '#2d6a4f';
    const lignesOblHTML = lignesObl.filter((l) => l.inclus);
    const lignesNonOblHTML = lignesNonObl.filter((l) => l.inclus);
    const grouper = (items: Ligne[]) => {
      const map: { [k: string]: Ligne[] } = {};
      items.forEach((l) => {
        if (!map[l.section]) map[l.section] = [];
        map[l.section].push(l);
      });
      return map;
    };
    const oblGroups = grouper(lignesOblHTML);
    const nonOblGroups = grouper(lignesNonOblHTML);
    const allSections = [
      ...new Set([...Object.keys(oblGroups), ...Object.keys(nonOblGroups)]),
    ];
    const tableauLignes = allSections
      .map((section) => {
        const obl = oblGroups[section] || [];
        const nonObl = nonOblGroups[section] || [];
        const maxRows = Math.max(obl.length, nonObl.length);
        let rows = `<tr><td colspan="4" style="background:${couleur}; color:white; padding:0.3rem 0.5rem; font-size:11px; font-weight:bold;">${section}</td></tr>`;
        for (let i = 0; i < maxRows; i++) {
          const o = obl[i];
          const n = nonObl[i];
          const tvaLabel = (tva: string) =>
            tva === 'tva_20' ? ' (1)' : tva === 'tva_10' ? ' (2)' : ' (3)';
          rows += `<tr>
          <td style="padding:0.3rem 0.5rem; font-size:11px; border-bottom:1px solid #f0f0f0;">${
            o ? o.libelle + tvaLabel(o.tva) : ''
          }</td>
          <td style="padding:0.3rem 0.5rem; font-size:11px; text-align:right; border-bottom:1px solid #f0f0f0;">${
            o && o.prix_ttc > 0 ? o.prix_ttc.toFixed(2) + ' €' : ''
          }</td>
          <td style="padding:0.3rem 0.5rem; font-size:11px; border-bottom:1px solid #f0f0f0;">${
            n ? n.libelle + tvaLabel(n.tva) : ''
          }</td>
          <td style="padding:0.3rem 0.5rem; font-size:11px; text-align:right; border-bottom:1px solid #f0f0f0;">${
            n && n.prix_ttc > 0 ? n.prix_ttc.toFixed(2) + ' €' : ''
          }</td>
        </tr>`;
        }
        return rows;
      })
      .join('');

    const servicesHTML =
      dossier?.type_dossier === 'rapatriement'
        ? `
<div style="border:1px solid #ddd; padding:0.5rem; margin-bottom:0.5rem; font-size:10px; background:#fafafa;">
  <strong style="font-size:11px;">Services funéraires</strong><br><br>
  ${
    dossier?.date_toilette
      ? `<strong>Toilette rituelle</strong> : le ${new Date(
          dossier.date_toilette
        ).toLocaleDateString('fr-FR')}${
          dossier?.heure_toilette ? ` à ${dossier.heure_toilette}` : ''
        }<br>`
      : ''
  }
  ${
    dossier?.date_meb
      ? `<strong>Mise en bière</strong> : le ${new Date(
          dossier.date_meb
        ).toLocaleDateString('fr-FR')}${
          dossier?.heure_meb ? ` à ${dossier.heure_meb}` : ''
        }<br>`
      : ''
  }
  ${
    dossier?.date_fermeture_depart
      ? `<strong>Fermeture & Départ</strong> : le ${new Date(
          dossier.date_fermeture_depart
        ).toLocaleDateString('fr-FR')}${
          dossier?.heure_fermeture_depart
            ? ` à ${dossier.heure_fermeture_depart}`
            : ''
        }<br>`
      : ''
  }
  ${
    dossier?.date_vol
      ? `<strong>Vol</strong> : ${dossier?.compagnie_aerienne || ''} ${
          dossier?.numero_vol || ''
        } le ${new Date(dossier.date_vol).toLocaleDateString('fr-FR')}${
          dossier?.heure_depart_vol ? ` à ${dossier.heure_depart_vol}` : ''
        } — ${dossier?.aeroport_depart || ''} → ${
          dossier?.aeroport_arrivee || ''
        }${
          dossier?.aeroport_escale ? ` (escale ${dossier.aeroport_escale})` : ''
        }<br>`
      : ''
  }
  ${
    dossier?.cimetiere_pays
      ? `<strong>Inhumation</strong> : ${dossier.cimetiere_pays}<br>`
      : ''
  }
</div>`
        : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titreDoc} — ${
      d?.prenom
    } ${d?.nom}</title>
<style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 10.5px; color: #333; margin: 0; padding: 0.15cm 0.6cm; line-height: 1.18; }table { width: 100%; border-collapse: collapse; margin-bottom: 0.25rem !important; } td, th { padding: 0.1rem 0.4rem !important; font-size: 10px !important; } img { max-height: 44px !important; } body > div { margin-bottom: 0.25rem !important; } .print-hint { background: #EEF2FF; border: 1px solid ${couleur}; border-radius: 8px; padding: 0.6rem; margin-bottom: 0.6rem; font-size: 12px; color: ${couleur}; text-align: center; } @media print { .print-hint { display: none; } } @page { margin: 0.4cm; size: A4; }</style>
</head><body>
<div class="print-hint">💡 <strong>Ctrl+P</strong> → <strong>"Enregistrer en PDF"</strong> → <strong>Enregistrer</strong></div>
<table style="margin-bottom:0.5rem;"><tr>
  <td style="width:30%; vertical-align:top;">${
    agence?.logo_url
      ? `<img src="${agence.logo_url}" style="max-height:70px; max-width:150px;">`
      : ''
  }</td>
  <td style="vertical-align:top; text-align:center;"><strong style="font-size:12px;">${
    agence?.nom || ''
  }</strong><br>${agence?.adresse_complete || ''}<br>Tél : ${
      agence?.telephone || ''
    }<br>Mail : ${agence?.email || ''}<br>${
      agence?.site_web ? `Site internet : ${agence.site_web}<br>` : ''
    }Habilitation : ${agence?.habilitation || ''}<br>Siret : ${
      agence?.siret || ''
    }</td>
  <td style="width:30%;"></td>
</tr></table>
<table style="margin-bottom:0.5rem; font-size:11px;"><tr>
  <td style="width:50%; vertical-align:top;">
    <strong>Référence dossier : ${dossier?.numero_dossier || ''}</strong><br>
    <strong>${titreDoc} n° ${numeroDocument()}</strong><br>
    ${titreDoc} établi le : ${new Date().toLocaleDateString(
      'fr-FR'
    )}, valable ${agence?.validite_devis_jours || 30} jours<br>
    Votre conseiller : ${agence?.nom || ''}<br>Tél : ${
      agence?.telephone || ''
    }<br>
    Lien de parenté avec le défunt : ${
      p?.lien_parente || ''
    }<br>Compte client : ${dossier?.compte_client || ''}
  </td>
  <td style="width:50%; vertical-align:top; text-align:right;">
    <strong>${p ? `${p.civilite || ''} ${p.prenom} ${p.nom}` : ''}</strong><br>
    ${p?.adresse || ''}<br>Tél : ${p?.telephone_1 || ''}${
      p?.telephone_2 ? ` / ${p.telephone_2}` : ''
    }<br>
    ${p?.email ? `Email : ${p.email}` : ''}
  </td>
</tr></table>
<div style="border:1px solid #333; padding:0.5rem; margin-bottom:0.5rem; font-size:11px;">
  Obsèques de <strong>${d?.civilite || ''} ${d?.prenom || ''} ${
      d?.nom || ''
    }</strong>
  ${
    d?.date_naissance
      ? ` né(e) le ${new Date(d.date_naissance).toLocaleDateString('fr-FR')}`
      : ''
  }
  ${d?.lieu_naissance ? ` à ${d.lieu_naissance}` : ''}
  ${
    dossier?.date_deces
      ? ` et décédé(e) le ${new Date(dossier.date_deces).toLocaleDateString(
          'fr-FR'
        )}`
      : ''
  }
  ${dossier?.heure_deces ? ` à ${dossier.heure_deces}` : ''}
  ${
    d?.date_naissance && dossier?.date_deces
      ? ` à l'âge de ${Math.floor(
          (new Date(dossier.date_deces).getTime() -
            new Date(d.date_naissance).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )} ans`
      : ''
  }
  ${dossier?.lieu_deces ? `, à ${dossier.lieu_deces}` : ''}
</div>
${servicesHTML}
<div style="font-size:9px; margin-bottom:0.5rem; font-style:italic; border:1px solid #ddd; padding:0.4rem;">
  Il est recommandé aux familles de consulter l'association pour la gestion des informations sur le risque en assurance (AGIRA) pour vérifier l'existence ou non d'une assurance obsèques souscrite par le défunt avant son décès (https://www.agira-vie.fr/obseques).
  En cas d'acceptation, le présent devis doit mener à la signature d'un bon de commande permettant la réalisation des obsèques dans les délais réglementaires prévus aux articles R. 2213-33 et R. 2213-35 du CGCT.
</div>
<table style="border:1px solid #333; margin-bottom:0.5rem;">
  <thead><tr>
    <th style="background:${couleur}; color:white; padding:0.4rem; width:40%; text-align:center; font-size:11px;">PRESTATIONS OBLIGATOIRES</th>
    <th style="background:${couleur}; color:white; padding:0.4rem; width:10%; text-align:center; font-size:11px;">Montant (TTC)</th>
    <th style="background:${couleur}; color:white; padding:0.4rem; width:40%; text-align:center; font-size:11px;">PRESTATIONS NON OBLIGATOIRES</th>
    <th style="background:${couleur}; color:white; padding:0.4rem; width:10%; text-align:center; font-size:11px;">Montant (TTC)</th>
  </tr></thead>
  <tbody>${tableauLignes}
    <tr style="font-weight:bold; background:#f0f0f0;">
      <td style="padding:0.4rem; font-size:11px;">Total TTC prestations obligatoires :</td>
      <td style="padding:0.4rem; text-align:right; font-size:11px;">${totalObl.toFixed(
        2
      )} €</td>
      <td style="padding:0.4rem; font-size:11px;">Total TTC prestations non obligatoires :</td>
      <td style="padding:0.4rem; text-align:right; font-size:11px;">${totalNonObl.toFixed(
        2
      )} €</td>
    </tr>
  </tbody>
</table>
<table style="margin-bottom:0.5rem; border:1px solid #ddd;">
  <tr style="background:#f9f9f9;">
    <th style="padding:0.3rem 0.5rem; text-align:left; font-size:11px;">TVA</th>
    <th style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">Base TVA</th>
    <th style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">Montant TVA</th>
    <th style="width:30%;"></th>
    <th style="padding:0.3rem 0.5rem; text-align:left; font-size:11px;">Total HT</th>
    <th style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${totalHT.toFixed(
      2
    )} €</th>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">0%</td><td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva0.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">0,00 €</td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Total TVA</td><td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${totalTVA.toFixed(
      2
    )} €</td>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">10%</td><td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva10ht.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva10montant.toFixed(
      2
    )} €</td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px; font-weight:bold;">Total TTC</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; font-weight:bold; color:${couleur};">${totalTTC.toFixed(
      2
    )} €</td>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">20%</td><td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva20ht.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva20montant.toFixed(
      2
    )} €</td><td></td><td></td><td></td>
  </tr>
  ${
    remiseAppliquee > 0
      ? `
  <tr><td colspan="3"></td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Total TTC avant remise</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${ttcBrut.toFixed(
      2
    )} €</td>
  </tr>
  <tr><td colspan="3"></td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Remise accordée</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:#993C1D;">-${remiseAppliquee.toFixed(
      2
    )} €</td>
  </tr>`
      : ''
  }
  ${
    onglet === 'facture' && acompte > 0
      ? `
  <tr style="font-weight:bold;"><td colspan="3"></td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Acompte versé</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:#854F0B;">-${acompte.toFixed(
      2
    )} €</td>
  </tr>
  <tr style="font-weight:bold;"><td colspan="3"></td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Reste à payer</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:${
      resteAPayer <= 0 ? '#0F6E56' : '#993C1D'
    };">${resteAPayer.toFixed(2)} €</td>
  </tr>`
      : ''
  }
  ${
    onglet === 'facture' && modesPaiement.length > 0
      ? `
  <tr><td colspan="3"></td><td></td>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Mode(s) de paiement</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${modesPaiement.join(
      ', '
    )}</td>
  </tr>`
      : ''
  }
</table>
<table style="margin-bottom:0.5rem;"><tr>
  <td style="width:50%; font-size:10px; padding:0.5rem;">
    Je soussigné(e) ${
      p
        ? `${p.civilite || ''} ${p.prenom} ${p.nom}`
        : '.................................'
    }<br><br>
    Accepte le présent ${titreDoc.toLowerCase()} prévisionnel<br><br>
    Le ${new Date().toLocaleDateString('fr-FR')} à ${
      agence?.ville || '............'
    }<br><br>
    <em>Signature précédée de la mention "Lu et Approuvé, bon pour acceptation"</em><br>
    <div id="case-signature-client" style="border:1px solid #eee; height:45px; margin-top:0.3rem; background:#fafafa;"></div>
  </td>
  <td style="width:50%; font-size:10px; padding:0.5rem;">
    Signature ${agence?.nom || ''}<br>
    <div style="border:1px solid #eee; height:45px; margin-top:0.3rem; background:#fafafa; display:flex; align-items:center; justify-content:center;">
      ${
        agence?.signature_url
          ? `<img src="${agence.signature_url}" style="max-height:55px;">`
          : ''
      }
    </div>
  </td>
</tr></table>
${
  agence?.zone_texte_1 &&
  ((onglet === 'devis' && agence.zone_texte_1_devis) ||
    (onglet === 'facture' && agence.zone_texte_1_facture) ||
    (onglet === 'bon_commande' && agence.zone_texte_1_bon_commande))
    ? `<div style="font-size:9px; color:#333; border:1px solid #ddd; padding:0.5rem; margin-bottom:0.5rem;">${agence.zone_texte_1}</div>`
    : ''
}
${
  agence?.zone_texte_2 &&
  ((onglet === 'devis' && agence.zone_texte_2_devis) ||
    (onglet === 'facture' && agence.zone_texte_2_facture) ||
    (onglet === 'bon_commande' && agence.zone_texte_2_bon_commande))
    ? `<div style="font-size:9px; color:#333; border:1px solid #ddd; padding:0.5rem; margin-bottom:0.5rem;">${agence.zone_texte_2}</div>`
    : ''
}
${
  agence?.zone_texte_3 &&
  ((onglet === 'devis' && agence.zone_texte_3_devis) ||
    (onglet === 'facture' && agence.zone_texte_3_facture) ||
    (onglet === 'bon_commande' && agence.zone_texte_3_bon_commande))
    ? `<div style="font-size:9px; color:#333; border:1px solid #ddd; padding:0.5rem; margin-bottom:0.5rem;">${agence.zone_texte_3}</div>`
    : ''
}
<div style="font-size:8px; color:#666; border-top:1px solid #eee; padding-top:0.5rem; margin-top:0.5rem;">${
      agence?.mention_legale || ''
    }</div>
<div style="font-size:8px; color:#666; margin-top:0.5rem;">
  (1) TVA 20% — (2) TVA 10% transport corps avant/après mise en bière — (3) Non soumis à TVA<br>
  "Nous vous informons de votre droit d'inscription à la liste d'opposition pour le démarchage téléphonique sur Bloctel : https://www.bloctel.gouv.fr/"
</div>
<div style="font-size:8px; color:#666; border-top:1px solid #eee; padding-top:0.3rem; margin-top:0.5rem; text-align:center;">
  ${agence?.rcs ? `RCS ${agence.rcs} — ` : ''}${
      agence?.siret ? `SIRET ${agence.siret} — ` : ''
    }${agence?.tva_intra ? `TVA ${agence.tva_intra} — ` : ''}${
      agence?.ape ? `Code APE : ${agence.ape} — ` : ''
    }${agence?.habilitation ? `Habilitation n°${agence.habilitation}` : ''}${
      agence?.site_web ? ` — ${agence.site_web}` : ''
    }
</div>
</body></html>`;

return html;
}

function imprimer() {
  const html = construireHTMLDocument();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

async function telechargerPDF() {
  const html = construireHTMLDocument();
  const conteneur = document.createElement('div');
  conteneur.innerHTML = html;
  // Retirer le bandeau d'aide "Ctrl+P" qui ne doit pas apparaître dans le PDF
  const hint = conteneur.querySelector('.print-hint');
  if (hint) hint.remove();
  document.body.appendChild(conteneur);
  try {
    await (html2pdf as any)()
      .set({
        margin: 4,
          pagebreak: { mode: ['css', 'legacy'] },
          filename: `${onglet}-${
          numeroDocument() || dossier?.numero_dossier || 'document'
        }.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(conteneur)
      .save();
  } finally {
    document.body.removeChild(conteneur);
  }
}

async function envoyerPourSignature() {
  if (onglet === 'facture') {
    alert(
      "🧾 Une facture ne se signe pas : elle est émise, pas acceptée.\n\nSeuls le Devis, le Bon de commande et le Pouvoir se signent."
    );
    return;
  }
  const pouvoir = dossier?.pouvoirs?.[0];
  if (!pouvoir?.email) {
    alert(
      "⚠️ Impossible d'envoyer : le mandataire n'a pas d'email renseigné dans le dossier."
    );
    return;
  }
  if (
    !confirm(
      `Envoyer le document pour signature à ${pouvoir.prenom} ${pouvoir.nom} (${pouvoir.email}) ?`
    )
  )
    return;

  setSaving(true);
  try {
    // 1) Générer le PDF (largeur A4 fixe pour des positions fiables)
    const html = construireHTMLDocument();
    const conteneur = document.createElement('div');
    conteneur.style.width = '756px'; // largeur A4 fixe = mesure fiable
    conteneur.innerHTML = html;
    const hint = conteneur.querySelector('.print-hint');
    if (hint) hint.remove();
    document.body.appendChild(conteneur);

    // Attendre le chargement des images (logo, signature) pour une mesure fiable
    await Promise.all(
      Array.from(conteneur.querySelectorAll('img')).map((img: any) =>
        img.complete && img.naturalHeight !== 0
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            })
      )
    );

    // 2) Mesurer le cadre de signature (dans le MÊME rendu que le PDF)
    const PT = 2.83465; // mm -> points
    const A4_W = 210; // largeur A4 (mm)
    const A4_H = 297; // hauteur A4 (mm)
    const A4_W_PT = 595; // largeur A4 (points)
    const A4_H_PT = 842; // hauteur A4 (points)
    const marge = 4; // marge du PDF en mm
    const contentPageH = A4_H - 2 * marge; // hauteur utile d'une page (mm)
    const cRect = conteneur.getBoundingClientRect();
    const sc = (A4_W - 2 * marge) / cRect.width; // px -> mm (largeur utile)
    const caseSig = conteneur.querySelector(
      '#case-signature-client'
    ) as HTMLElement | null;
    let mesure: any = null;
    if (caseSig) {
      const bRect = caseSig.getBoundingClientRect();
      mesure = {
        xBoxPx: bRect.left - cRect.left,
        yBoxPx: bRect.top - cRect.top,
        wPx: bRect.width,
        hPx: bRect.height,
        contentWidthPx: cRect.width,
        contentHeightPx: cRect.height,
      };
    }

    // 3) Générer le PDF ET récupérer le vrai nombre de pages
    const worker = (html2pdf as any)()
      .set({
        margin: marge,
        pagebreak: { mode: ['css', 'legacy'] },
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 756 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(conteneur)
      .toPdf();
    const pdfObj = await worker.get('pdf');
    const totalPages = pdfObj.internal.getNumberOfPages();
    const pdfBlob = pdfObj.output('blob');
    document.body.removeChild(conteneur);

    // 3b) SignWell attend les coordonnées en PIXELS de la page rendue
    //     (≈ contentHeightPx), et NON en points A4. On envoie donc les
    //     pixels bruts mesurés — origine haut-gauche.
    let champ: any = null;
    if (mesure) {
      let x = mesure.xBoxPx;
      let y = mesure.yBoxPx;
      let width = mesure.wPx;
      let height = mesure.hPx;
      // petite marge intérieure + hauteur de signature raisonnable
      x += width * 0.1;
      width *= 0.8;
      if (height > 60) {
        y += (height - 60) / 2;
        height = 60;
      }
      x = Math.max(0, Math.min(Math.round(x), mesure.contentWidthPx - 20));
      y = Math.max(0, Math.min(Math.round(y), mesure.contentHeightPx - 20));
      width = Math.max(60, Math.round(width));
      height = Math.max(25, Math.round(height));
      champ = { page: 1, x, y, width, height };
    }

    // 4) PDF -> base64
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    // 5) Envoyer à l'Edge Function
    const { data, error } = await supabase.functions.invoke('yousign', {
      body: {
        pdf_base64: base64,
        champ,
        nom_document: `${
          onglet === 'devis'
            ? 'Devis'
            : onglet === 'bon_commande'
            ? 'Bon de commande'
            : 'Facture'
        } — ${dossier?.agences?.nom || ''} — ${
          dossier?.defunts?.prenom || ''
        } ${dossier?.defunts?.nom || ''}`,
        signataire: {
          prenom: pouvoir.prenom,
          nom: pouvoir.nom,
          email: pouvoir.email,
        },
      },
    });

    if (error) {
      alert('Erreur : ' + error.message);
    } else if (data && data.ok) {
      await supabase.from('signatures').insert({
        dossier_id: dossierId,
        agence_id: dossier?.agence_id,
        type_document: onglet,
        demande_id: data.demande_id,
        signataire_email: pouvoir.email,
        statut: 'en_attente',
      });
      alert(data.message || '✅ Demande de signature envoyée !');
    } else {
      alert(
        '❌ Problème : ' + JSON.stringify(data?.erreur || data || 'inconnu')
      );
    }
  } catch (e: any) {
    alert('Erreur : ' + e.message);
  }
  setSaving(false);
}

  const couleurAgence = dossier?.agences?.couleur_principale || '#2d6a4f';

  // Cascade de validation : devis -> bon de commande -> facture
  const devisValide = statutDevis === 'accepte';
  const bonCommandeValide = devisValide && statutBonCommande === 'valide';

  // Sécurité : si l'onglet actif n'est plus débloqué, on revient au devis
  if (onglet === 'bon_commande' && !devisValide && dossier) {
    setOnglet('devis');
  }
  if (onglet === 'facture' && !bonCommandeValide && dossier) {
    setOnglet('devis');
  }

  if (!dossier) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  if (dossier?.type_dossier === 'devis_libre') {
    return <DevisLibre dossierId={dossierId} onRetour={onRetour} />;
  }
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>📄 Documents financiers</h2>
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
            onClick={() => sauvegarder()}
            disabled={saving}
            style={{
              padding: '0.6rem 1.2rem',
              background: saving ? '#ccc' : couleurAgence,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {saving ? '⏳...' : '💾 Sauvegarder'}
          </button>
          <button
            onClick={telechargerPDF}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'white',
              color: couleurAgence,
              border: `1px solid ${couleurAgence}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            📄 PDF
          </button>
          {onglet !== 'facture' && (
            <button
              onClick={envoyerPourSignature}
              disabled={saving}
              style={{
                padding: '0.6rem 1.2rem',
                background: saving ? '#ccc' : '#0F6E56',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              📤 Envoyer pour signature
            </button>
          )}
        </div>
      </div>

      {partenaireNom && (
        <div
          style={{
            background: '#FAEEDA',
            border: '2px solid #854F0B',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#854F0B',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          🤝 Tarifs partenaire « {partenaireNom} » appliqués — modifiables ligne
          par ligne.
        </div>
      )}

      <div
        style={{
          borderBottom: `2px solid ${couleurAgence}`,
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        {(['devis', 'bon_commande', 'facture'] as Onglet[]).map((o) => {
          const verrouille =
            (o === 'bon_commande' && !devisValide) ||
            (o === 'facture' && !bonCommandeValide);
          return (
            <button
              key={o}
              onClick={() => {
                if (verrouille) return;
                setOnglet(o);
              }}
              disabled={verrouille}
              title={
                verrouille
                  ? o === 'bon_commande'
                    ? 'Validez le devis pour débloquer le bon de commande'
                    : 'Validez le bon de commande pour débloquer la facture'
                  : ''
              }
              style={{
                padding: '0.6rem 1.5rem',
                border: 'none',
                borderBottom:
                  onglet === o
                    ? `3px solid ${couleurAgence}`
                    : '3px solid transparent',
                background: 'none',
                cursor: verrouille ? 'not-allowed' : 'pointer',
                fontWeight: onglet === o ? 'bold' : 'normal',
                color: verrouille
                  ? '#bbb'
                  : onglet === o
                  ? couleurAgence
                  : '#666',
                fontSize: '15px',
                opacity: verrouille ? 0.6 : 1,
              }}
            >
              {o === 'devis'
                ? '📋 Devis'
                : o === 'bon_commande'
                ? `${verrouille ? '🔒' : '📝'} Bon de commande`
                : `${verrouille ? '🔒' : '🧾'} Facture`}
            </button>
          );
        })}
      </div>

      {dossier?.type_dossier === 'rapatriement' && (
        <div
          style={{
            background: '#FAECE7',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #993C1D',
          }}
        >
          <label
            style={{ fontWeight: 'bold', color: '#993C1D', fontSize: '14px' }}
          >
            ✈️ Choisir la destination pour pré-remplir le devis :
          </label>
          <select
            value={destinationChoisie}
            onChange={(e) => choisirDestination(e.target.value, typeRapatrie)}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #993C1D',
            }}
          >
            <option value="">-- Sélectionner une destination --</option>
            {tarifsRapatriement.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.compagnie}
              </option>
            ))}
          </select>
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#993C1D',
              }}
            >
              Tarif :
            </span>
            <label
              style={{
                fontSize: '13px',
                color: '#993C1D',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <input
                type="radio"
                name="typeRapatrie"
                checked={typeRapatrie === 'adulte'}
                onChange={() => changerTypeRapatrie('adulte')}
              />
              Adulte
            </label>
            <label
              style={{
                fontSize: '13px',
                color: '#993C1D',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <input
                type="radio"
                name="typeRapatrie"
                checked={typeRapatrie === 'enfant'}
                onChange={() => changerTypeRapatrie('enfant')}
              />
              Enfant
            </label>
          </div>
          {destinationChoisie && (
            <div
              style={{
                fontSize: '12px',
                color: '#993C1D',
                marginTop: '0.5rem',
              }}
            >
              ⚠️ Sélectionner une destination (ou changer Adulte/Enfant) remplace
              toutes les lignes du devis
            </div>
          )}
        </div>
      )}
      {/* SÉLECTEUR CERCUEIL CATALOGUE */}
      {catalogueCercueils.length > 0 && (
        <div
          style={{
            background: '#f0fdf4',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #0F6E56',
          }}
        >
          <label
            style={{ fontWeight: 'bold', color: '#0F6E56', fontSize: '14px' }}
          >
            ⚰️ Choisir un cercueil depuis le catalogue :
          </label>
          <select
            onChange={async (e) => {
              const id = e.target.value;
              if (!id) return;
              if (estVerrouille()) return alerteVerrou();
              const c = catalogueCercueils.find((c) => c.id === id);
              if (!c) return;
              // Mémoriser le cercueil choisi dans le dossier (pour le stock)
              await supabase
                .from('dossiers')
                .update({ cercueil_id: id })
                .eq('id', dossierId);
              setDossier((d: any) => (d ? { ...d, cercueil_id: id } : d));
              setLignes((prev) => {
                let fait = false;
                return prev.map((l) => {
                  if (
                    !fait &&
                    l.categorie === 'prestations_obligatoires' &&
                    l.section === '3 - Cercueil & Accessoires' &&
                    l.libelle.toLowerCase().includes('cercueil') &&
                    !l.libelle.toLowerCase().includes('plaque') &&
                    !l.libelle.toLowerCase().includes('housse')
                  ) {
                    fait = true;
                    return {
                      ...l,
                      libelle: c.nom,
                      prix_ttc: c.prix_ttc || 0,
                      inclus: true,
                    };
                  }
                  return l;
                });
              });
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #0F6E56',
            }}
            value={dossier?.cercueil_id || ''}
          >
            <option value="">-- Sélectionner un cercueil --</option>
            {catalogueCercueils
              .filter((c) => c.type !== 'accessoire')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {c.type} — {c.prix_ttc} € TTC
                </option>
              ))}
          </select>
          <div
            style={{ fontSize: '12px', color: '#0F6E56', marginTop: '0.5rem' }}
          >
            ℹ️ Sélectionner un cercueil met à jour la ligne cercueil dans les
            prestations obligatoires
          </div>
        </div>
      )}
      {onglet === 'devis' && (
        <div
          style={{
            background: `${couleurAgence}11`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            border: `1px solid ${couleurAgence}33`,
          }}
        >
          <label
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: couleurAgence,
            }}
          >
            Statut du devis :
          </label>
          <select
            value={statutDevis}
            disabled={statutDevis === 'accepte'}
            onChange={async (e) => {
              const v = e.target.value;
              if (statutDevis === 'accepte') return;
              if (
                v === 'accepte' &&
                !confirm(
                  '⚠️ Valider le devis le rend DÉFINITIF : il ne pourra plus être modifié ni dévalidé (obligation légale). Continuer ?'
                )
              )
                return;
              setStatutDevis(v);
              await sauvegarder({ statutDevis: v });
            }}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: statutDevis === 'accepte' ? '#f0f0f0' : 'white',
              cursor: statutDevis === 'accepte' ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="en_attente">En attente</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
          </select>
          {statutBadge(statutDevis)}
          {!devisValide ? (
            <button
              onClick={async () => {
                if (
                  !confirm(
                    '⚠️ Valider le devis le rend DÉFINITIF : il ne pourra plus être modifié ni dévalidé (obligation légale). Continuer ?'
                  )
                )
                  return;
                setStatutDevis('accepte');
                await sauvegarder({ statutDevis: 'accepte' });
                setOnglet('bon_commande');
              }}
              style={{
                marginLeft: 'auto',
                padding: '0.6rem 1.2rem',
                background: '#0F6E56',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✅ Valider le devis → ouvrir le bon de commande
            </button>
          ) : (
            <button
              onClick={() => setOnglet('bon_commande')}
              style={{
                marginLeft: 'auto',
                padding: '0.6rem 1.2rem',
                background: couleurAgence,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Aller au bon de commande →
            </button>
          )}
        </div>
      )}

      {onglet === 'facture' && (
        <div
          style={{
            background: '#E1F5EE',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Statut :
            </label>
            <select
              value={statutFacture}
              onChange={async (e) => {
                const v = e.target.value;
                setStatutFacture(v);
                await sauvegarder({ statutFacture: v });
              }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
              }}
            >
              <option value="non_payee">Non payée</option>
              <option value="partiellement_payee">Partiellement payée</option>
              <option value="payee">Payée</option>
            </select>
            {statutBadge(statutFacture)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Acompte versé :
            </label>
            <input
              type="number"
              value={acompte}
              onChange={(e) => setAcompte(parseFloat(e.target.value) || 0)}
              style={{
                width: '100px',
                padding: '0.4rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                textAlign: 'right',
              }}
            />
            <span>€</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Date paiement :
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              style={{
                padding: '0.4rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Mode(s) de paiement :
            </label>
            {[
              'Carte',
              'Virement',
              'Espèces',
              'Chèque',
              'Prélèvement compte défunt',
            ].map((mode) => {
              const coche = modesPaiement.includes(mode);
              return (
                <label
                  key={mode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={coche}
                    onChange={(e) =>
                      setModesPaiement((cur) =>
                        e.target.checked
                          ? [...cur, mode]
                          : cur.filter((m) => m !== mode)
                      )
                    }
                  />
                  {mode}
                </label>
              );
            })}
          </div>
          {acompte > 0 && (
            <div
              style={{
                marginLeft: 'auto',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#0F6E56',
              }}
            >
              Reste à payer : {resteAPayer.toFixed(2)} €
            </div>
          )}
          {/* VERROUILLAGE FACTURE */}
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
            }}
          >
            {dossier?.facture_verrouillee ? (
              <div
                style={{
                  background: '#FAECE7',
                  border: '1px solid #993C1D',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '18px' }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#993C1D' }}>
                    Facture verrouillée
                  </div>
                  <div style={{ fontSize: '12px', color: '#993C1D' }}>
                    Cette facture ne peut plus être modifiée
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      'Verrouiller définitivement cette facture ? Cette action est irréversible.'
                    )
                  )
                    return;

                  // --- Déduction automatique du stock cercueil ---
                  const cercueilId = dossier?.cercueil_id;
                  const agenceId = dossier?.agence_id;
                  if (cercueilId && agenceId) {
                    const { data: stock } = await supabase
                      .from('stocks_cercueils')
                      .select('*')
                      .eq('cercueil_id', cercueilId)
                      .eq('agence_id', agenceId)
                      .maybeSingle();

                    if (stock) {
                      const nouvelleQuantite = stock.quantite - 1;
                      if (nouvelleQuantite < 0) {
                        alert(
                          '⚠️ Attention : ce cercueil n\'est plus en stock. La facture sera verrouillée mais le stock passe en négatif. Pensez à recommander.'
                        );
                      }
                      await supabase
                        .from('stocks_cercueils')
                        .update({ quantite: nouvelleQuantite })
                        .eq('id', stock.id);
                      await supabase.from('mouvements_stock').insert({
                        cercueil_id: cercueilId,
                        agence_id: agenceId,
                        type_mouvement: 'sortie',
                        quantite: 1,
                        dossier_id: dossierId,
                        notes: 'Sortie automatique — facture verrouillée',
                      });
                    } else {
                      // Aucune ligne de stock : on la crée à -1 pour ne pas perdre la sortie
                      await supabase.from('stocks_cercueils').insert({
                        cercueil_id: cercueilId,
                        agence_id: agenceId,
                        quantite: -1,
                        seuil_alerte: 2,
                      });
                      await supabase.from('mouvements_stock').insert({
                        cercueil_id: cercueilId,
                        agence_id: agenceId,
                        type_mouvement: 'sortie',
                        quantite: 1,
                        dossier_id: dossierId,
                        notes: 'Sortie automatique — facture verrouillée',
                      });
                      alert(
                        '⚠️ Ce cercueil n\'avait pas de stock enregistré. La sortie a été comptabilisée : le stock passe à -1. Pensez à saisir le stock réel.'
                      );
                    }
                  }

                  await supabase
                    .from('dossiers')
                    .update({ facture_verrouillee: true })
                    .eq('id', dossierId);
                  await chargerDossier();
                }}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#993C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🔒 Verrouiller la facture
              </button>
            )}
          </div>
        </div>
      )}

      {onglet === 'bon_commande' && (
        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: '0 0 1rem', fontSize: '13px', color: '#666' }}>
            📝 Le bon de commande reprend les mêmes lignes que le devis. Il est
            destiné à être imprimé et signé par la famille.
          </p>
          {!bonCommandeValide ? (
            <button
              onClick={async () => {
                setStatutBonCommande('valide');
                await sauvegarder({ statutBonCommande: 'valide' });
                setOnglet('facture');
              }}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#0F6E56',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✅ Valider le bon de commande → éditer la facture
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#0F6E56', fontWeight: 'bold' }}>
                ✅ Bon de commande validé
              </span>
              <button
                onClick={() => setOnglet('facture')}
                style={{
                  padding: '0.5rem 1rem',
                  background: couleurAgence,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Aller à la facture →
              </button>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {renderColonne(
          'prestations_obligatoires',
          'Prestations obligatoires',
          couleurAgence,
          `${couleurAgence}11`
        )}
        {renderColonne(
          'prestations_non_obligatoires',
          'Prestations non obligatoires',
          '#1565C0',
          '#E3F2FD'
        )}
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', color: couleurAgence }}>
          Récapitulatif TVA
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '0.5rem',
            fontSize: '14px',
          }}
        >
          <div></div>
          <div
            style={{ fontWeight: 'bold', textAlign: 'right', color: '#888' }}
          >
            H.T.
          </div>
          <div
            style={{ fontWeight: 'bold', textAlign: 'right', color: '#888' }}
          >
            T.V.A.
          </div>
          <div
            style={{ fontWeight: 'bold', textAlign: 'right', color: '#888' }}
          >
            T.T.C.
          </div>
          <div>Total non soumis T.V.A. (0%)</div>
          <div style={{ textAlign: 'right' }}>{tva0.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>0,00 €</div>
          <div style={{ textAlign: 'right' }}>{tva0.toFixed(2)} €</div>
          <div>Total T.V.A. 10%</div>
          <div style={{ textAlign: 'right' }}>{tva10ht.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva10montant.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva10ttc.toFixed(2)} €</div>
          <div>Total T.V.A. 20%</div>
          <div style={{ textAlign: 'right' }}>{tva20ht.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva20montant.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva20ttc.toFixed(2)} €</div>
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '16px',
              borderTop: '2px solid #333',
              paddingTop: '0.5rem',
            }}
          >
            TOTAL
          </div>
          <div
            style={{
              fontWeight: 'bold',
              textAlign: 'right',
              borderTop: '2px solid #333',
              paddingTop: '0.5rem',
            }}
          >
            {totalHT.toFixed(2)} €
          </div>
          <div
            style={{
              fontWeight: 'bold',
              textAlign: 'right',
              borderTop: '2px solid #333',
              paddingTop: '0.5rem',
            }}
          >
            {totalTVA.toFixed(2)} €
          </div>
          <div
            style={{
              fontWeight: 'bold',
              textAlign: 'right',
              borderTop: '2px solid #333',
              paddingTop: '0.5rem',
              fontSize: '18px',
              color: couleurAgence,
            }}
          >
            {totalTTC.toFixed(2)} €
          </div>
        </div>
        <div
          style={{
            marginTop: '1rem',
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
            Remise globale (€) :
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={remise}
            disabled={estVerrouille()}
            onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
            style={{
              padding: '0.4rem 0.6rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              width: '130px',
              background: estVerrouille() ? '#f0f0f0' : 'white',
            }}
          />
          {remiseAppliquee > 0 && (
            <span style={{ fontSize: '13px', color: '#555' }}>
              Total avant remise : <strong>{ttcBrut.toFixed(2)} €</strong> →
              après remise : <strong>{totalTTC.toFixed(2)} €</strong>{' '}
              <span style={{ color: '#888' }}>
                (répartie proportionnellement sur chaque taux de TVA)
              </span>
            </span>
          )}
        </div>
        {onglet === 'facture' && acompte > 0 && (
          <div
            style={{
              marginTop: '1rem',
              borderTop: '1px solid #eee',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Acompte versé :</span>
            <span style={{ fontWeight: 'bold', color: '#854F0B' }}>
              - {acompte.toFixed(2)} €
            </span>
            <span>Reste à payer :</span>
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '20px',
                color: resteAPayer <= 0 ? '#0F6E56' : '#993C1D',
              }}
            >
              {resteAPayer.toFixed(2)} €
            </span>
          </div>
        )}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '2rem',
            fontSize: '13px',
            color: '#666',
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
          }}
        >
          <span>
            Obligatoires : <strong>{totalObl.toFixed(2)} €</strong>
          </span>
          <span>
            Non obligatoires : <strong>{totalNonObl.toFixed(2)} €</strong>
          </span>
          <span>
            Total général :{' '}
            <strong style={{ color: couleurAgence }}>
              {totalTTC.toFixed(2)} €
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
