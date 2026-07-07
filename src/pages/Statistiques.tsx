import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
interface Props {
agenceId: string;
onRetour: () => void;
}
export default function Statistiques({ agenceId, onRetour }: Props) {
const [loading, setLoading] = useState(true);
const [dossiers, setDossiers] = useState<any[]>([]);
const [periode, setPeriode] = useState('mois');
const [dateDebut, setDateDebut] = useState('');
const [dateFin, setDateFin] = useState('');
useEffect(() => {
charger();
}, [agenceId]);
async function charger() {
setLoading(true);
const { data } = await supabase
.from('dossiers')
.select('*, defunts(*), lignes_dossier(*)')
.eq('agence_id', agenceId)
.order('created_at', { ascending: false });
setDossiers(data || []);
setLoading(false);
}
function getDateFiltres() {
const now = new Date();
if (periode === 'mois') {
const d = new Date(now.getFullYear(), now.getMonth(), 1);
return { debut: d.toISOString(), fin: now.toISOString() };
}
if (periode === '3mois') {
const d = new Date(now);
d.setMonth(d.getMonth() - 3);
return { debut: d.toISOString(), fin: now.toISOString() };
}
if (periode === '6mois') {
const d = new Date(now);
d.setMonth(d.getMonth() - 6);
return { debut: d.toISOString(), fin: now.toISOString() };
}
if (periode === 'annee') {
const d = new Date(now.getFullYear(), 0, 1);
return { debut: d.toISOString(), fin: now.toISOString() };
}
if (periode === 'perso' && dateDebut && dateFin) {
return {
debut: new Date(dateDebut).toISOString(),
fin: new Date(dateFin + 'T23:59:59').toISOString(),
};
}
return { debut: new Date(0).toISOString(), fin: now.toISOString() };
}
const { debut, fin } = getDateFiltres();
const filtres = dossiers.filter(
(d) => d.created_at >= debut && d.created_at <= fin
);
// Stats générales
const total = filtres.length;
const inhumations = filtres.filter(
(d) => d.type_dossier === 'inhumation_locale'
).length;
const rapatriements = filtres.filter(
(d) => d.type_dossier === 'rapatriement'
).length;
const devisLibres = filtres.filter(
(d) => d.type_dossier === 'devis_libre'
).length;
const statutDossier = (d: any): string => {
if (d.statut === 'annule') return 'annule';
if (d.statut_devis === 'refuse') return 'refuse';
const dateEvent = d.date_inhumation || d.date_vol;
const auj = new Date();
auj.setHours(0, 0, 0, 0);
const datePassee = dateEvent && new Date(dateEvent) < auj;
if (d.statut_devis === 'accepte') return datePassee ? 'termine' : 'valide';
return 'en_cours';
};
const enCours = filtres.filter((d) => statutDossier(d) === 'en_cours').length;
const valides = filtres.filter((d) => statutDossier(d) === 'valide').length;
const termines = filtres.filter((d) => statutDossier(d) === 'termine').length;
const refuses = filtres.filter((d) => statutDossier(d) === 'refuse').length;
const annules = filtres.filter((d) => statutDossier(d) === 'annule').length;
// Stats financières
const totalFacture = filtres.reduce((sum, d) => {
const lignes = d.lignes_dossier || [];
return sum + lignes.reduce((s: number, l: any) => s + (l.prix_ttc || 0), 0);
}, 0);
const totalAcompte = filtres.reduce(
(sum, d) => sum + (d.acompte_verse || 0),
0
);
const resteAPayer = totalFacture - totalAcompte;
// Top 5 villes inhumation
const villesCount: { [k: string]: number } = {};
filtres
.filter((d) => d.type_dossier === 'inhumation_locale')
.forEach((d) => {
const ville = d.lieu_deces?.split(' ').pop() || 'Inconnue';
villesCount[ville] = (villesCount[ville] || 0) + 1;
});
const top5Villes = Object.entries(villesCount)
.sort((a, b) => b[1] - a[1])
.slice(0, 5);
// Top destinations rapatriement
const destCount: { [k: string]: number } = {};
filtres
.filter((d) => d.type_dossier === 'rapatriement')
.forEach((d) => {
const dest = d.cimetiere_pays || d.aeroport_arrivee || 'Inconnue';
destCount[dest] = (destCount[dest] || 0) + 1;
});
const topDest = Object.entries(destCount)
.sort((a, b) => b[1] - a[1])
.slice(0, 5);
// Top compagnies
const compCount: { [k: string]: number } = {};
filtres
.filter((d) => d.compagnie_aerienne)
.forEach((d) => {
compCount[d.compagnie_aerienne] =
(compCount[d.compagnie_aerienne] || 0) + 1;
});
const topComp = Object.entries(compCount)
.sort((a, b) => b[1] - a[1])
.slice(0, 5);
// Évolution mensuelle (12 derniers mois)
const moisLabels: string[] = [];
const moisData = [];
for (let i = 11; i >= 0; i--) {
const d = new Date();
d.setMonth(d.getMonth() - i);
const label = d.toLocaleDateString('fr-FR', {
month: 'short',
year: '2-digit',
});
const debut_m = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
const fin_m = new Date(
d.getFullYear(),
d.getMonth() + 1,
0,
23,
59,
59
).toISOString();
const count = dossiers.filter(
(dos) => dos.created_at >= debut_m && dos.created_at <= fin_m
).length;
moisLabels.push(label);
moisData.push(count);
}
const maxMois = Math.max(...moisData, 1);
const card = (
titre: string,
valeur: any,
couleurV = '#333',
sousTitre?: string
) => (
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1.5rem',
border: '1px solid #eee',
textAlign: 'center',
}}
>
<div style={{ fontSize: '12px', color: '#888', marginBottom: '0.5rem' }}>
{titre}
</div>
<div style={{ fontSize: '2rem', fontWeight: 'bold', color: couleurV }}>
{valeur}
</div>
{sousTitre && (
<div style={{ fontSize: '11px', color: '#aaa', marginTop: '0.25rem' }}>
{sousTitre}
</div>
)}
</div>
);
const sectionTitre = (titre: string) => (
<h3
style={{
margin: '2rem 0 1rem',
color: '#333',
borderBottom: '2px solid #eee',
paddingBottom: '0.5rem',
}}
>
{titre}
</h3>
);
const barChart = (data: [string, number][], couleur: string) => {
const max = Math.max(...data.map((d) => d[1]), 1);
return (
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
{data.map(([label, count]) => (
<div
key={label}
style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
>
<div
style={{
minWidth: '150px',
fontSize: '12px',
color: '#555',
textAlign: 'right',
overflow: 'hidden',
textOverflow: 'ellipsis',
whiteSpace: 'nowrap',
}}
>
{label}
</div>
<div
style={{
flex: 1,
background: '#f0f0f0',
borderRadius: '4px',
height: '20px',
position: 'relative',
}}
>
<div
style={{
width: `${(count / max) * 100}%`,
background: couleur,
height: '100%',
borderRadius: '4px',
transition: 'width 0.5s',
}}
/>
</div>
<div
style={{
minWidth: '30px',
fontSize: '12px',
fontWeight: 'bold',
color: couleur,
}}
>
{count}
</div>
</div>
))}
</div>
);
};
if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>;
return (
<div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
<div
style={{
display: 'flex',
alignItems: 'center',
gap: '1rem',
marginBottom: '2rem',
}}
>
<button onClick={onRetour}>← Retour</button>
<h2 style={{ margin: 0 }}>📊Statistiques</h2>
</div>
{/* FILTRE PÉRIODE */}
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1rem',
border: '1px solid #eee',
marginBottom: '2rem',
display: 'flex',
gap: '0.75rem',
alignItems: 'center',
flexWrap: 'wrap',
}}
>
<span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>
📅Période :
</span>
{[
{ val: 'mois', label: 'Ce mois' },
{ val: '3mois', label: '3 mois' },
{ val: '6mois', label: '6 mois' },
{ val: 'annee', label: 'Cette année' },
{ val: 'tout', label: 'Tout' },
{ val: 'perso', label: 'Personnalisé' },
].map((p) => (
<button
key={p.val}
onClick={() => setPeriode(p.val)}
style={{
padding: '0.4rem 0.8rem',
background: periode === p.val ? '#4F46E5' : '#f0f0f0',
color: periode === p.val ? 'white' : '#555',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',
fontSize: '12px',
fontWeight: periode === p.val ? 'bold' : 'normal',
}}
>
{p.label}
</button>
))}
{periode === 'perso' && (
<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
<input
type="date"
value={dateDebut}
onChange={(e) => setDateDebut(e.target.value)}
style={{
padding: '0.3rem',
fontSize: '12px',
borderRadius: '4px',
border: '1px solid #ddd',
}}
/>
<span style={{ fontSize: '12px' }}>→</span>
<input
type="date"
value={dateFin}
onChange={(e) => setDateFin(e.target.value)}
style={{
padding: '0.3rem',
fontSize: '12px',
borderRadius: '4px',
border: '1px solid #ddd',
}}
/>
</div>
)}
<span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
{filtres.length} dossier(s) sur la période
</span>
</div>
{/* CARDS GÉNÉRALES */}
{sectionTitre('📋Vue générale')}
<div
style={{
display: 'grid',
gridTemplateColumns: 'repeat(3, 1fr)',
gap: '1rem',
marginBottom: '1rem',
}}
>
{card('Total dossiers', total, '#4F46E5')}
{card(
'Inhumations',
inhumations,
'#0F6E56',
`${total ? Math.round((inhumations / total) * 100) : 0}%`
)}
{card(
'Rapatriements',
rapatriements,
'#993C1D',
`${total ? Math.round((rapatriements / total) * 100) : 0}%`
)}
{card(
'Devis libres',
devisLibres,
'#185FA5',
`${total ? Math.round((devisLibres / total) * 100) : 0}%`
)}
</div>
<div
style={{
display: 'grid',
gridTemplateColumns: 'repeat(3, 1fr)',
gap: '1rem',
}}
>
{card('En cours', enCours, '#4F46E5')}
{card('Validés', valides, '#0F6E56')}
{card('Terminés', termines, '#666')}
{card('Refusés', refuses, '#993C1D')}
{card('Annulés', annules, '#888')}
</div>
{/* FINANCIER */}
{sectionTitre('💰Suivi financier')}
<div
style={{
display: 'grid',
gridTemplateColumns: 'repeat(3, 1fr)',
gap: '1rem',
}}
>
{card('Total facturé', `${totalFacture.toFixed(0)} €`, '#4F46E5')}
{card('Acomptes versés', `${totalAcompte.toFixed(0)} €`, '#0F6E56')}
{card(
'Reste à percevoir',
`${resteAPayer.toFixed(0)} €`,
resteAPayer > 0 ? '#993C1D' : '#0F6E56'
)}
</div>
{/* ÉVOLUTION MENSUELLE */}
{sectionTitre('📈Évolution mensuelle (12 mois)')}
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1.5rem',
border: '1px solid #eee',
}}
>
<div
style={{
display: 'flex',
alignItems: 'flex-end',
gap: '0.5rem',
height: '120px',
}}
>
{moisData.map((count, i) => (
<div
key={i}
style={{
flex: 1,
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
gap: '0.25rem',
}}
>
<div style={{ fontSize: '10px', color: '#888' }}>
{count > 0 ? count : ''}
</div>
<div
style={{
width: '100%',
background: count > 0 ? '#4F46E5' : '#f0f0f0',
height: `${(count / maxMois) * 80}px`,
minHeight: count > 0 ? '4px' : '2px',
borderRadius: '3px 3px 0 0',
}}
/>
<div
style={{
fontSize: '9px',
color: '#888',
transform: 'rotate(-45deg)',
transformOrigin: 'center',
whiteSpace: 'nowrap',
}}
>
{moisLabels[i]}
</div>
</div>
))}
</div>
</div>
{/* TOP VILLES */}
{sectionTitre('📍Top 5 villes (inhumations locales)')}
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1.5rem',
border: '1px solid #eee',
}}
>
{top5Villes.length > 0 ? (
barChart(top5Villes, '#0F6E56')
) : (
<p style={{ color: '#888', fontSize: '13px' }}>Aucune donnée</p>
)}
</div>
{/* RAPATRIEMENT */}
{sectionTitre('✈️Rapatriements')}
<div
style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
>
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1.5rem',
border: '1px solid #eee',
}}
>
<div
style={{
fontWeight: 'bold',
fontSize: '13px',
marginBottom: '1rem',
color: '#993C1D',
}}
>
🌍Top destinations
</div>
{topDest.length > 0 ? (
barChart(topDest, '#993C1D')
) : (
<p style={{ color: '#888', fontSize: '13px' }}>Aucune donnée</p>
)}
</div>
<div
style={{
background: 'white',
borderRadius: '12px',
padding: '1.5rem',
border: '1px solid #eee',
}}
>
<div
style={{
fontWeight: 'bold',
fontSize: '13px',
marginBottom: '1rem',
color: '#185FA5',
}}
>
✈️Top compagnies
</div>
{topComp.length > 0 ? (
barChart(topComp, '#185FA5')
) : (
<p style={{ color: '#888', fontSize: '13px' }}>Aucune donnée</p>
)}
</div>
</div>
</div>
);
}
