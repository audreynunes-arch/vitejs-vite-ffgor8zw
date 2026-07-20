import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import html2pdf from 'html2pdf.js';

interface Props {
  dossierId: string;
  onRetour: () => void;
}

interface Ligne {
  libelle: string;
  tva: 'exonere' | 'tva_10' | 'tva_20';
  prix_ttc: number;
  inclus: boolean;
  ordre: number;
}

type Onglet = 'devis' | 'bon_commande' | 'facture';

export default function DevisLibre({ dossierId, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('devis');
  const [lignes, setLignes] = useState<Ligne[]>([
    { libelle: '', tva: 'tva_10', prix_ttc: 0, inclus: true, ordre: 1 },
  ]);
  const [objet, setObjet] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [statutDevis, setStatutDevis] = useState('en_attente');
  const [statutFacture, setStatutFacture] = useState('non_payee');
  const [statutBonCommande, setStatutBonCommande] = useState('en_attente');
  const [acompte, setAcompte] = useState(0);
  const [modesPaiement, setModesPaiement] = useState<string[]>([]);
  const [datePaiement, setDatePaiement] = useState('');

  useEffect(() => {
    chargerDossier();
  }, [dossierId]);

  async function chargerDossier() {
    const { data } = await supabase
      .from('dossiers')
      .select('*, defunts(*), agences(*), pouvoirs(*)')
      .eq('id', dossierId)
      .single();
    if (data) {
      setDossier(data);
      setStatutDevis(data.statut_devis || 'en_attente');
      setStatutFacture(data.statut_facture || 'non_payee');
      setStatutBonCommande(data.statut_bon_commande || 'en_attente');
      setAcompte(data.acompte_verse || 0);
      setModesPaiement(data.modes_paiement || []);
      setDatePaiement(data.date_paiement || '');
      if (data.objet_devis_libre) setObjet(data.objet_devis_libre);
    }
    const { data: lignesSaved } = await supabase
      .from('lignes_dossier')
      .select('*')
      .eq('dossier_id', dossierId)
      .eq('type_document', 'devis')
      .order('ordre');
    if (lignesSaved && lignesSaved.length > 0) {
      setLignes(
        lignesSaved.map((l) => ({
          libelle: l.libelle,
          tva: l.tva,
          prix_ttc: l.prix_ttc,
          inclus: l.inclus,
          ordre: l.ordre,
        }))
      );
    }
  }

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

  function updateLigne(index: number, champ: keyof Ligne, valeur: any) {
    setLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    );
  }

  function ajouterLigne() {
    setLignes((prev) => [
      ...prev,
      {
        libelle: '',
        tva: 'tva_10',
        prix_ttc: 0,
        inclus: true,
        ordre: prev.length + 1,
      },
    ]);
  }

  function supprimerLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  const lignesIncluses = lignes.filter((l) => l.inclus);
  const tva0 = lignesIncluses
    .filter((l) => l.tva === 'exonere')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const tva10ttc = lignesIncluses
    .filter((l) => l.tva === 'tva_10')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const tva10ht = tva10ttc / 1.1;
  const tva10montant = tva10ttc - tva10ht;
  const tva20ttc = lignesIncluses
    .filter((l) => l.tva === 'tva_20')
    .reduce((s, l) => s + l.prix_ttc, 0);
  const tva20ht = tva20ttc / 1.2;
  const tva20montant = tva20ttc - tva20ht;
  const totalHT = tva10ht + tva20ht + tva0;
  const totalTVA = tva10montant + tva20montant;
  const totalTTC = totalHT + totalTVA;
  const resteAPayer = totalTTC - acompte;

  async function sauvegarder(override?: {
    statutDevis?: string;
    statutBonCommande?: string;
  }) {
    setSaving(true);
    if (dossier?.facture_verrouillee && onglet === 'facture') {
      alert('🔒 Cette facture est verrouillée et ne peut plus être modifiée.');
      setSaving(false);
      return;
    }
    try {
      await supabase
        .from('lignes_dossier')
        .delete()
        .eq('dossier_id', dossierId)
        .eq('type_document', 'devis');
      await supabase.from('lignes_dossier').insert(
        lignes.map((l) => ({
          dossier_id: dossierId,
          type_document: 'devis',
          categorie: 'prestations_non_obligatoires',
          section: objet,
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
      await supabase
        .from('dossiers')
        .update({
          statut_devis: override?.statutDevis ?? statutDevis,
          statut_bon_commande: override?.statutBonCommande ?? statutBonCommande,
          statut_facture: statutFacture,
          acompte_verse: acompte,
          modes_paiement: modesPaiement,
          date_paiement: datePaiement || null,
          objet_devis_libre: objet,
        })
        .eq('id', dossierId);
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
      partiellement_payee: { label: 'Partiel', bg: '#FAEEDA', color: '#854F0B' },
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

  async function imprimer() {
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
    const tvaLabel = (tva: string) =>
      tva === 'tva_20' ? ' (2)' : tva === 'tva_10' ? ' (1)' : '';

    const lignesHTML = lignesIncluses
      .map(
        (l) => `<tr>
        <td style="padding:0.4rem 0.5rem; font-size:11px; border-bottom:1px solid #eee;">${
          l.libelle
        }${tvaLabel(l.tva)}</td>
        <td style="padding:0.4rem 0.5rem; font-size:11px; text-align:right; border-bottom:1px solid #eee;">${(l.tva ===
        'tva_20'
          ? l.prix_ttc / 1.2
          : l.tva === 'tva_10'
          ? l.prix_ttc / 1.1
          : l.prix_ttc
        ).toFixed(2)} €</td>
        <td style="padding:0.4rem 0.5rem; font-size:11px; text-align:right; border-bottom:1px solid #eee;">${l.prix_ttc.toFixed(
          2
        )} €</td>
      </tr>`
      )
      .join('');

    const clientNom = p
      ? `${p.civilite || ''} ${p.prenom || ''} ${p.nom || ''}`
      : '';
    const refDefunt = d ? `${d.prenom || ''} ${d.nom || ''}`.trim() : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titreDoc}${objet ? ' — ' + objet : ''}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
  table { width: 100%; border-collapse: collapse; }
  .print-hint { background: #EEF2FF; border: 1px solid ${couleur}; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; font-size: 12px; color: ${couleur}; text-align: center; }
  @media print { .print-hint { display: none; } body { font-size: 10.5px; } }
  @page { margin: 1cm; size: A4; }
</style>
</head><body>
<div class="print-hint">💡 <strong>Ctrl+P</strong> → <strong>"Enregistrer en PDF"</strong> → <strong>Enregistrer</strong></div>

<table style="margin-bottom:1rem;"><tr>
  <td style="width:30%; vertical-align:top;">${
    agence?.logo_url
      ? `<img src="${agence.logo_url}" style="max-height:70px; max-width:150px;">`
      : ''
  }</td>
  <td style="vertical-align:top; text-align:center;">
    <strong style="font-size:14px;">${agence?.nom || ''}</strong><br>
    ${agence?.adresse_complete || ''}<br>
    Tél : ${agence?.telephone || ''}<br>
    Mail : ${agence?.email || ''}<br>
    ${agence?.site_web || ''}
  </td>
  <td style="width:30%; vertical-align:top; text-align:right;">
    <div style="border:1px solid ${couleur}; padding:0.4rem; display:inline-block;">
      <strong style="color:${couleur};">${titreDoc} n° ${numeroDocument()}</strong>
    </div>
    <div style="margin-top:0.5rem; font-size:10px;">${
      agence?.nom || ''
    } le : ${new Date().toLocaleDateString('fr-FR')}</div>
  </td>
</tr></table>

<table style="margin-bottom:1rem; font-size:11px;"><tr>
  <td style="width:50%; vertical-align:top;">
    ${clientNom ? `<strong>Client : ${clientNom}</strong><br>` : ''}
    ${p?.adresse ? `${p.adresse}<br>` : ''}
    ${p?.telephone_1 ? `Tél : ${p.telephone_1}<br>` : ''}
    ${p?.email ? `Email : ${p.email}<br>` : ''}
    ${refDefunt ? `<br>Réf : ${refDefunt}` : ''}
  </td>
  <td style="width:50%; vertical-align:top; text-align:right;">
    ${
      dossier?.compte_client
        ? `Référence dossier : <strong>${dossier.compte_client}</strong><br>`
        : ''
    }
  </td>
</tr></table>

<table style="border:1px solid #333; margin-bottom:1rem;">
  <thead>
    <tr>
      <th style="background:${couleur}; color:white; padding:0.4rem 0.5rem; text-align:left; font-size:11px; width:60%;">Désignation</th>
      <th style="background:${couleur}; color:white; padding:0.4rem 0.5rem; text-align:right; font-size:11px;">HT</th>
      <th style="background:${couleur}; color:white; padding:0.4rem 0.5rem; text-align:right; font-size:11px;">TTC</th>
    </tr>
  </thead>
  <tbody>
    ${
      objet
        ? `<tr><td colspan="3" style="background:${couleur}; color:white; padding:0.3rem 0.5rem; font-size:11px; font-weight:bold;">${objet}</td></tr>`
        : ''
    }
    ${lignesHTML}
    <tr style="font-weight:bold; background:#f0f0f0;">
      <td style="padding:0.4rem 0.5rem; font-size:11px;">TOTAL ${titreDoc.toUpperCase()} T.T.C. :</td>
      <td style="padding:0.4rem 0.5rem; text-align:right; font-size:11px;">${totalHT.toFixed(
        2
      )} €</td>
      <td style="padding:0.4rem 0.5rem; text-align:right; font-size:11px; color:${couleur};">${totalTTC.toFixed(
      2
    )} €</td>
    </tr>
  </tbody>
</table>

<table style="margin-bottom:1rem; border:1px solid #ddd; width:60%;">
  <tr style="background:#f9f9f9;">
    <th style="padding:0.3rem 0.5rem; text-align:left; font-size:11px;">Récapitulatif TVA</th>
    <th style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">H.T.</th>
    <th style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">TTC</th>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Total non soumis TVA</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva0.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva0.toFixed(
      2
    )} €</td>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Total TVA 10% (1)</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva10ht.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva10ttc.toFixed(
      2
    )} €</td>
  </tr>
  <tr>
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Total TVA 20% (2)</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva20ht.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${tva20ttc.toFixed(
      2
    )} €</td>
  </tr>
  <tr style="font-weight:bold; background:#f0f0f0;">
    <td style="padding:0.3rem 0.5rem; font-size:11px;">TOTAL</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px;">${totalHT.toFixed(
      2
    )} €</td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:${couleur};">${totalTTC.toFixed(
      2
    )} €</td>
  </tr>
  ${
    onglet === 'facture' && acompte > 0
      ? `<tr style="font-weight:bold;">
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Acompte versé</td>
    <td></td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:#854F0B;">-${acompte.toFixed(
      2
    )} €</td>
  </tr>
  <tr style="font-weight:bold;">
    <td style="padding:0.3rem 0.5rem; font-size:11px;">Reste à payer</td>
    <td></td>
    <td style="padding:0.3rem 0.5rem; text-align:right; font-size:11px; color:${
      resteAPayer <= 0 ? '#0F6E56' : '#993C1D'
    };">${resteAPayer.toFixed(2)} €</td>
  </tr>`
      : ''
  }
</table>

<div style="font-size:10px; margin-bottom:0.5rem;">
  ${titreDoc} fait le : <strong>${new Date().toLocaleDateString('fr-FR')}</strong>
</div>

${
  agence?.rib_texte
    ? `<div style="font-size:9px; background:#f0f0f0; padding:0.5rem; margin-bottom:0.5rem;">${agence.rib_texte}</div>`
    : ''
}

<div style="font-size:8px; color:#666; font-style:italic; margin-bottom:0.5rem;">
  Indemnité forfaitaire de 40 euros pour frais de recouvrement selon le décret n°2021-115 du 2/10/2012 en cas de dépassement des délais de paiement.
</div>

<table style="margin-bottom:0.5rem; margin-top:1.5rem;"><tr>
  <td style="width:50%; font-size:10px; padding:0.5rem;">
    Je soussigné(e) ${clientNom || '.........................'}<br><br>
    Accepte le présent ${titreDoc.toLowerCase()}<br><br>
    Le ${new Date().toLocaleDateString('fr-FR')}<br>
    <div style="border:1px solid #eee; height:55px; margin-top:0.5rem; background:#fafafa;"></div>
  </td>
  <td style="width:50%; font-size:10px; padding:0.5rem;">
    Signature ${agence?.nom || ''}<br>
    <div style="border:1px solid #eee; height:55px; margin-top:0.5rem; background:#fafafa; display:flex; align-items:center; justify-content:center;">
      ${
        agence?.signature_url
          ? `<img src="${agence.signature_url}" style="max-height:50px;">`
          : ''
      }
    </div>
  </td>
</tr></table>

<div style="font-size:8px; color:#666; border-top:1px solid #eee; padding-top:0.3rem; margin-top:0.5rem; text-align:center;">
  ${[
    agence?.rcs,
    agence?.siret && `SIRET ${agence.siret}`,
    agence?.tva_intra && `TVA ${agence.tva_intra}`,
    agence?.ape && `Code APE : ${agence.ape}`,
    agence?.habilitation && `Habilitation n°${agence.habilitation}`,
    agence?.site_web,
  ]
    .filter(Boolean)
    .join(' — ')}
</div>
</body></html>`;

    const conteneur = document.createElement('div');
    conteneur.style.width = '756px';
    conteneur.innerHTML = html;
    const hint = conteneur.querySelector('.print-hint');
    if (hint) hint.remove();
    document.body.appendChild(conteneur);
    try {
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
      await (html2pdf as any)()
        .set({
          margin: 8,
          filename: `${titreDoc}-${numeroDocument() || 'document'}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 756 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(conteneur)
        .save();
    } finally {
      document.body.removeChild(conteneur);
    }
  }

  const couleurAgence = dossier?.agences?.couleur_principale || '#2d6a4f';
  const devisValide = statutDevis === 'accepte';
  const bonCommandeValide = devisValide && statutBonCommande === 'valide';

  if (onglet === 'bon_commande' && !devisValide && dossier) setOnglet('devis');
  if (onglet === 'facture' && !bonCommandeValide && dossier) setOnglet('devis');

  if (!dossier) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  const p = dossier?.pouvoirs?.[0];

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>📝 Devis libre</h2>
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
            onClick={imprimer}
            style={{
              padding: '0.6rem 1.2rem',
              background: couleurAgence,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: 0.85,
            }}
          >
            📥 Télécharger PDF
          </button>
        </div>
      </div>

      {/* Infos client */}
      {p && (
        <div
          style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            fontSize: '13px',
          }}
        >
          <strong>Client :</strong> {p.civilite} {p.prenom} {p.nom}
          {p.adresse ? ` — ${p.adresse}` : ''}
          {p.telephone_1 ? ` — ${p.telephone_1}` : ''}
        </div>
      )}

      {/* Onglets */}
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

      {/* Statut devis */}
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
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: couleurAgence }}>
            Statut du devis :
          </label>
          <select
            value={statutDevis}
            onChange={(e) => setStatutDevis(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="en_attente">En attente</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
          </select>
          {statutBadge(statutDevis)}
          {!devisValide ? (
            <button
              onClick={async () => {
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
              ✅ Valider le devis → bon de commande
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

      {/* Bon de commande */}
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
            📝 Le bon de commande reprend les mêmes lignes que le devis.
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
              ✅ Valider le bon de commande → facture
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <button
                onClick={() => setStatutBonCommande('en_attente')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'none',
                  color: '#993C1D',
                  border: '1px solid #993C1D',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Dévalider
              </button>
            </div>
          )}
        </div>
      )}

      {/* Facture */}
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
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Statut :</label>
            <select
              value={statutFacture}
              onChange={(e) => setStatutFacture(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="non_payee">Non payée</option>
              <option value="partiellement_payee">Partiellement payée</option>
              <option value="payee">Payée</option>
            </select>
            {statutBadge(statutFacture)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Acompte :</label>
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
            <div style={{ marginLeft: 'auto', fontWeight: 'bold', fontSize: '16px', color: '#0F6E56' }}>
              Reste à payer : {resteAPayer.toFixed(2)} €
            </div>
          )}
        </div>
      )}

      {/* Objet du devis */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Objet / Intitulé :
        </label>
        <input
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.25rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
          placeholder="ex: Sous-traitance - Transport, Pose monument, Toilette rituelle..."
        />
      </div>

      {/* Tableau des lignes */}
      <div
        style={{
          background: 'white',
          border: `1px solid ${couleurAgence}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: couleurAgence,
            color: 'white',
            padding: '0.4rem 0.75rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '13px',
            marginBottom: '0.75rem',
            display: 'grid',
            gridTemplateColumns: '1fr 110px 90px auto',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <span>{objet}</span>
          <span style={{ textAlign: 'center' }}>TVA</span>
          <span style={{ textAlign: 'right' }}>Prix TTC</span>
          <span></span>
        </div>

        {lignes.map((l, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 110px 90px auto',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.5rem',
              opacity: l.inclus ? 1 : 0.4,
            }}
          >
            <input
              value={l.libelle}
              onChange={(e) => updateLigne(i, 'libelle', e.target.value)}
              placeholder="Libellé de la prestation"
              style={{
                padding: '0.4rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            />
            <select
              value={l.tva}
              onChange={(e) => updateLigne(i, 'tva', e.target.value)}
              style={{ padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
            >
              <option value="tva_10">TVA 10%</option>
              <option value="tva_20">TVA 20%</option>
              <option value="exonere">Exonéré</option>
            </select>
            <input
              type="number"
              value={l.prix_ttc}
              onChange={(e) =>
                updateLigne(i, 'prix_ttc', parseFloat(e.target.value) || 0)
              }
              style={{
                padding: '0.4rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                textAlign: 'right',
                fontSize: '13px',
              }}
            />
            <button
              onClick={() => supprimerLigne(i)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ccc',
                fontSize: '18px',
              }}
              title="Supprimer"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={ajouterLigne}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'none',
            border: `1px dashed ${couleurAgence}`,
            borderRadius: '4px',
            color: couleurAgence,
            cursor: 'pointer',
            fontSize: '13px',
            marginTop: '0.5rem',
          }}
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Totaux */}
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', color: couleurAgence }}>
          Récapitulatif
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '0.5rem',
            fontSize: '14px',
          }}
        >
          <div></div>
          <div style={{ fontWeight: 'bold', textAlign: 'right', color: '#888' }}>
            H.T.
          </div>
          <div style={{ fontWeight: 'bold', textAlign: 'right', color: '#888' }}>
            T.T.C.
          </div>
          <div>Total non soumis TVA</div>
          <div style={{ textAlign: 'right' }}>{tva0.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva0.toFixed(2)} €</div>
          <div>Total TVA 10%</div>
          <div style={{ textAlign: 'right' }}>{tva10ht.toFixed(2)} €</div>
          <div style={{ textAlign: 'right' }}>{tva10ttc.toFixed(2)} €</div>
          <div>Total TVA 20%</div>
          <div style={{ textAlign: 'right' }}>{tva20ht.toFixed(2)} €</div>
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
              fontSize: '18px',
              color: couleurAgence,
            }}
          >
            {totalTTC.toFixed(2)} €
          </div>
        </div>
        {onglet === 'facture' && acompte > 0 && (
          <div
            style={{
              marginTop: '1rem',
              borderTop: '1px solid #eee',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
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
      </div>
    </div>
  );
}
