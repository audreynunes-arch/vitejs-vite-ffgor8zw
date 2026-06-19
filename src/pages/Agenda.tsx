import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Props {
  agenceId: string;
  onRetour: () => void;
  onOuvrir: (id: string) => void;
}

const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_H = 52; // hauteur d'une heure en pixels

function lundiDeLaSemaine(d: Date) {
  const date = new Date(d);
  const jour = (date.getDay() + 6) % 7; // 0 = lundi
  date.setDate(date.getDate() - jour);
  date.setHours(0, 0, 0, 0);
  return date;
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${j}`;
}

function jjmm(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
}

export default function Agenda({ agenceId, onRetour, onOuvrir }: Props) {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lundi, setLundi] = useState<Date>(lundiDeLaSemaine(new Date()));

  useEffect(() => {
    charger();
  }, [agenceId]);

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from('dossiers')
      .select(
        'id, numero_dossier, type_dossier, statut, date_toilette, heure_toilette, date_meb, heure_meb, date_fermeture_depart, heure_fermeture_depart, date_inhumation, heure_inhumation, date_vol, heure_depart_vol, convoi_effectue_par, defunts(nom, prenom, civilite)'
      )
      .eq('agence_id', agenceId)
      .limit(2000);
    setDossiers(data || []);
    setLoading(false);
  }

  // Détermine le jour final + plage horaire d'un dossier
  function infosDossier(d: any) {
    const isRapat = d.type_dossier === 'rapatriement';
    const jourBrut =
      d.date_inhumation ||
      d.date_vol ||
      d.date_fermeture_depart ||
      d.date_meb ||
      d.date_toilette ||
      null;
    if (!jourBrut) return null;
    const jour = String(jourBrut).slice(0, 10);
    const debut =
      d.heure_toilette ||
      d.heure_meb ||
      d.heure_fermeture_depart ||
      d.heure_inhumation ||
      d.heure_depart_vol ||
      null;
    const fin =
      (isRapat ? d.heure_depart_vol : d.heure_inhumation) ||
      d.heure_fermeture_depart ||
      d.heure_meb ||
      d.heure_toilette ||
      null;
    return { jour, debut, fin, isRapat };
  }

  function toMin(h: string | null) {
    if (!h) return null;
    const parts = String(h).split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1] || '0', 10);
    if (isNaN(hh)) return null;
    return hh * 60 + (isNaN(mm) ? 0 : mm);
  }

  const jours = Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(lundi);
    dd.setDate(lundi.getDate() + i);
    return dd;
  });
  const nomsJours = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];
  const heures: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) heures.push(h);

  // Regrouper les dossiers par jour (clé = YYYY-MM-DD)
  const parJour: { [k: string]: any[] } = {};
  dossiers.forEach((d) => {
    const info = infosDossier(d);
    if (!info) return;
    if (!parJour[info.jour]) parJour[info.jour] = [];
    parJour[info.jour].push({ ...d, _info: info });
  });

  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  const ajd = ymd(new Date());

  function semainePrec() {
    const n = new Date(lundi);
    n.setDate(lundi.getDate() - 7);
    setLundi(n);
  }
  function semaineSuiv() {
    const n = new Date(lundi);
    n.setDate(lundi.getDate() + 7);
    setLundi(n);
  }
  function aujourdhui() {
    setLundi(lundiDeLaSemaine(new Date()));
  }

  const btnNav = {
    padding: '0.5rem 0.9rem',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  function blocDossier(d: any, index: number, total: number) {
    const info = d._info;
    const debutMin = toMin(info.debut) ?? START_HOUR * 60;
    let finMin = toMin(info.fin) ?? debutMin + 60;
    if (finMin <= debutMin) finMin = debutMin + 60;
    const clampDebut = Math.max(debutMin, START_HOUR * 60);
    const clampFin = Math.min(finMin, END_HOUR * 60);
    const top = ((clampDebut - START_HOUR * 60) / 60) * HOUR_H;
    const height = Math.max(((clampFin - clampDebut) / 60) * HOUR_H, 30);
    const largeur = 100 / total;
    const couleur = info.isRapat
      ? { bg: '#FAECE7', bord: '#993C1D', txt: '#993C1D' }
      : { bg: '#E1F5EE', bord: '#0F6E56', txt: '#0F6E56' };
    const def = d.defunts;
    const heureLabel =
      (info.debut ? info.debut.slice(0, 5) : '') +
      (info.fin ? ' → ' + info.fin.slice(0, 5) : '');
    return (
      <div
        key={d.id}
        onClick={() => onOuvrir(d.id)}
        title="Ouvrir le dossier"
        style={{
          position: 'absolute',
          top: top + 'px',
          height: height + 'px',
          left: `calc(${index * largeur}% + 2px)`,
          width: `calc(${largeur}% - 4px)`,
          background: couleur.bg,
          border: `1px solid ${couleur.bord}`,
          borderLeft: `4px solid ${couleur.bord}`,
          borderRadius: '6px',
          padding: '3px 5px',
          fontSize: '11px',
          color: couleur.txt,
          overflow: 'hidden',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.isRapat ? '✈️' : '⚰️'} {def?.prenom || ''} {def?.nom || ''}
        </div>
        {heureLabel && <div style={{ fontSize: '10px' }}>{heureLabel}</div>}
        {d.convoi_effectue_par && (
          <div
            style={{
              fontSize: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            🚐 {d.convoi_effectue_par}
          </div>
        )}
      </div>
    );
  }

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
        <h2 style={{ margin: 0 }}>📅 Agenda</h2>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <button onClick={semainePrec} style={btnNav}>
            ◀
          </button>
          <button onClick={aujourdhui} style={btnNav}>
            Aujourd'hui
          </button>
          <button onClick={semaineSuiv} style={btnNav}>
            ▶
          </button>
        </div>
      </div>

      <div
        style={{
          fontWeight: 'bold',
          color: '#4F46E5',
          marginBottom: '1rem',
          fontSize: '15px',
        }}
      >
        Semaine du {jjmm(lundi)} au {jjmm(dimanche)}{' '}
        {dimanche.getFullYear()}
      </div>

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
          {/* En-tête des jours */}
          <div style={{ display: 'flex', borderBottom: '2px solid #eee' }}>
            <div style={{ width: '50px', flexShrink: 0 }} />
            {jours.map((jour, i) => {
              const estAjd = ymd(jour) === ajd;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.5rem',
                    background: estAjd ? '#EEF2FF' : 'white',
                    borderLeft: '1px solid #f0f0f0',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: estAjd ? '#4F46E5' : '#333',
                    }}
                  >
                    {nomsJours[i]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {jjmm(jour)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corps : heures + colonnes jours */}
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Colonne des heures */}
            <div style={{ width: '50px', flexShrink: 0 }}>
              {heures.map((h) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_H + 'px',
                    fontSize: '11px',
                    color: '#999',
                    textAlign: 'right',
                    paddingRight: '4px',
                    boxSizing: 'border-box',
                    borderTop: '1px solid #f5f5f5',
                  }}
                >
                  {h}h
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {jours.map((jour, i) => {
              const key = ymd(jour);
              const liste = parJour[key] || [];
              const estAjd = key === ajd;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    position: 'relative',
                    borderLeft: '1px solid #f0f0f0',
                    background: estAjd ? '#FAFBFF' : 'white',
                    height: heures.length * HOUR_H + 'px',
                  }}
                >
                  {/* Lignes horaires */}
                  {heures.map((h) => (
                    <div
                      key={h}
                      style={{
                        height: HOUR_H + 'px',
                        borderTop: '1px solid #f5f5f5',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                  {/* Blocs dossiers */}
                  {liste.map((d, idx) => blocDossier(d, idx, liste.length))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '1.5rem',
          fontSize: '13px',
          color: '#666',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: '#E1F5EE',
              border: '1px solid #0F6E56',
              borderRadius: '3px',
              verticalAlign: 'middle',
              marginRight: '4px',
            }}
          />
          ⚰️ Inhumation locale
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: '#FAECE7',
              border: '1px solid #993C1D',
              borderRadius: '3px',
              verticalAlign: 'middle',
              marginRight: '4px',
            }}
          />
          ✈️ Rapatriement
        </span>
        <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
          Cliquez sur un dossier pour l'ouvrir
        </span>
      </div>
    </div>
  );
}
