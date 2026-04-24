import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface Props {
  agenceId: string
  onRetour: () => void
}

export default function GestionStocks({ agenceId, onRetour }: Props) {
  const [stocks, setStocks] = useState<any[]>([])
  const [mouvements, setMouvements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'stocks' | 'mouvements'>('stocks')
  const [showAjout, setShowAjout] = useState(false)
  const [cercueils, setCercueils] = useState<any[]>([])
  const [form, setForm] = useState({ cercueil_id: '', quantite: 1, type_mouvement: 'entree', notes: '' })

  useEffect(() => { charger() }, [agenceId])

  async function charger() {
    setLoading(true)

    // Charger catalogue cercueils
    const { data: cats } = await supabase.from('catalogue_cercueils').select('*').eq('actif', true).order('nom')
    setCercueils(cats || [])

    // Charger stocks
    const { data: s } = await supabase.from('stocks_cercueils')
      .select('*, catalogue_cercueils(nom, type)')
      .eq('agence_id', agenceId)
    
    // Si pas de stock initialisé, créer les entrées
    if (s && s.length === 0 && cats && cats.length > 0) {
      await supabase.from('stocks_cercueils').insert(
        cats.map(c => ({ cercueil_id: c.id, agence_id: agenceId, quantite: 0, seuil_alerte: 2 }))
      )
      const { data: s2 } = await supabase.from('stocks_cercueils')
        .select('*, catalogue_cercueils(nom, type)')
        .eq('agence_id', agenceId)
      setStocks(s2 || [])
    } else {
      setStocks(s || [])
    }

    // Charger mouvements
    const { data: m } = await supabase.from('mouvements_stock')
      .select('*, catalogue_cercueils(nom), dossiers(compte_client)')
      .eq('agence_id', agenceId)
      .order('created_at', { ascending: false })
      .limit(50)
    setMouvements(m || [])

    setLoading(false)
  }

  async function ajouterMouvement() {
    if (!form.cercueil_id || !form.quantite) return
    
    await supabase.from('mouvements_stock').insert({
      cercueil_id: form.cercueil_id,
      agence_id: agenceId,
      type_mouvement: form.type_mouvement,
      quantite: form.quantite,
      notes: form.notes || null,
    })

    // Mettre à jour le stock
    const stock = stocks.find(s => s.cercueil_id === form.cercueil_id)
    if (stock) {
      const newQty = form.type_mouvement === 'entree'
        ? stock.quantite + form.quantite
        : stock.quantite - form.quantite
      await supabase.from('stocks_cercueils')
        .update({ quantite: Math.max(0, newQty) })
        .eq('id', stock.id)
    }

    setForm({ cercueil_id: '', quantite: 1, type_mouvement: 'entree', notes: '' })
    setShowAjout(false)
    charger()
  }

  async function modifierSeuil(stockId: string, seuil: number) {
    await supabase.from('stocks_cercueils').update({ seuil_alerte: seuil }).eq('id', stockId)
    charger()
  }

  const alertes = stocks.filter(s => s.quantite <= s.seuil_alerte)

  if (loading) return <p style={{ padding: '2rem' }}>Chargement...</p>

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onRetour}>← Retour</button>
        <h2 style={{ margin: 0 }}>📦 Gestion des stocks cercueils</h2>
        <button onClick={() => setShowAjout(true)} style={{ marginLeft: 'auto', padding: '0.5rem 1rem', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Mouvement
        </button>
      </div>

      {/* ALERTES */}
      {alertes.length > 0 && (
        <div style={{ background: '#FAECE7', border: '1px solid #993C1D', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 'bold', color: '#993C1D', marginBottom: '0.5rem' }}>⚠️ Stock bas — {alertes.length} article(s)</div>
          {alertes.map(s => (
            <div key={s.id} style={{ fontSize: '13px', color: '#993C1D' }}>
              • {s.catalogue_cercueils?.nom} : {s.quantite} en stock (seuil : {s.seuil_alerte})
            </div>
          ))}
        </div>
      )}

      {/* FORMULAIRE MOUVEMENT */}
      {showAjout && (
        <div style={{ background: '#EEF2FF', border: '1px solid #4F46E5', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#4F46E5' }}>📥 Nouveau mouvement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px' }}>Cercueil</label>
              <select value={form.cercueil_id} onChange={e => setForm(p => ({ ...p, cercueil_id: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', marginTop: '0.25rem' }}>
                <option value="">-- Sélectionner --</option>
                {cercueils.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px' }}>Type</label>
              <select value={form.type_mouvement} onChange={e => setForm(p => ({ ...p, type_mouvement: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', marginTop: '0.25rem' }}>
                <option value="entree">📥 Entrée stock</option>
                <option value="sortie">📤 Sortie stock</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px' }}>Quantité</label>
              <input type="number" min="1" value={form.quantite}
                onChange={e => setForm(p => ({ ...p, quantite: parseInt(e.target.value) || 1 }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', marginTop: '0.25rem' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px' }}>Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="ex: Livraison fournisseur, commande dossier..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', marginTop: '0.25rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={ajouterMouvement} style={{ padding: '0.5rem 1rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>💾 Enregistrer</button>
            <button onClick={() => setShowAjout(false)} style={{ padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* ONGLETS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
        {[{ key: 'stocks', label: '📦 Stock actuel' }, { key: 'mouvements', label: '📋 Historique' }].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key as any)}
            style={{ padding: '0.6rem 1.2rem', border: 'none', borderBottom: onglet === o.key ? '3px solid #4F46E5' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: onglet === o.key ? 'bold' : 'normal', color: onglet === o.key ? '#4F46E5' : '#666' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* STOCK ACTUEL */}
      {onglet === 'stocks' && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Cercueil</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Seuil alerte</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{s.catalogue_cercueils?.nom}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{s.catalogue_cercueils?.type}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: s.quantite <= s.seuil_alerte ? '#993C1D' : '#0F6E56' }}>
                    {s.quantite}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <input type="number" min="0" defaultValue={s.seuil_alerte}
                      onBlur={e => modifierSeuil(s.id, parseInt(e.target.value) || 0)}
                      style={{ width: '60px', padding: '0.25rem', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {s.quantite === 0
                      ? <span style={{ background: '#FAECE7', color: '#993C1D', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>🔴 Rupture</span>
                      : s.quantite <= s.seuil_alerte
                      ? <span style={{ background: '#FAEEDA', color: '#854F0B', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>🟡 Stock bas</span>
                      : <span style={{ background: '#E1F5EE', color: '#0F6E56', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>🟢 OK</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HISTORIQUE MOUVEMENTS */}
      {onglet === 'mouvements' && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Cercueil</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Qté</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Aucun mouvement</td></tr>
              )}
              {mouvements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#666' }}>
                    {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{m.catalogue_cercueils?.nom}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {m.type_mouvement === 'entree'
                      ? <span style={{ background: '#E1F5EE', color: '#0F6E56', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>📥 Entrée</span>
                      : <span style={{ background: '#FAECE7', color: '#993C1D', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>📤 Sortie</span>
                    }
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold' }}>{m.quantite}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}