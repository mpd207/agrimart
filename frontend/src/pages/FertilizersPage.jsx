import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fertilizersApi } from '../api'

const TYPES = ['All', 'Nitrogenous', 'Phosphatic', 'Potassic', 'Complex']

function stockClass(stock) {
  if (stock > 300) return 'stock-hi'
  if (stock >= 100) return 'stock-mid'
  return 'stock-lo'
}
function stockLabel(stock) {
  if (stock > 300) return `In Stock (${stock} bags)`
  if (stock >= 100) return `Limited (${stock} bags)`
  return `Low Stock (${stock} bags)`
}

export default function FertilizersPage() {
  const navigate = useNavigate()
  const [ferts,   setFerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('All')
  const debounceRef = useRef(null)

  const loadFerts = useCallback(async (q, t) => {
    try {
      const params = {}
      if (q) params.search = q
      if (t && t !== 'All') params.type = t
      const { data } = await fertilizersApi.getAll(params)
      setFerts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFerts('', 'All') }, [loadFerts])

  function handleSearch(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadFerts(val, type), 300)
  }

  function handleType(val) {
    setType(val)
    loadFerts(search, val)
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Fertilizers</h2>
        <div style={{width:34}} />
      </div>

      <div className="search-wrap">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search fertilizers, NPK ratio…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            autoComplete="off"
          />
          {search && <button className="search-clear" onClick={() => { setSearch(''); loadFerts('', type) }}>✕</button>}
        </div>
      </div>

      <div className="filter-row">
        {TYPES.map(t => (
          <button key={t} className={`fp ${type === t ? 'active' : ''}`} onClick={() => handleType(t)}>{t}</button>
        ))}
      </div>

      <div className="page-scroll" style={{flex:1}}>
        {!loading && <div style={{padding:'4px 16px 6px',fontSize:12,color:'#9EB0A0',fontWeight:600}}>Showing {ferts.length} product{ferts.length !== 1 ? 's' : ''}</div>}

        {loading
          ? <div className="spinner" />
          : ferts.length === 0
            ? <div style={{textAlign:'center',padding:'40px 20px',color:'#6B836D'}}>
                <div style={{fontSize:48,marginBottom:12}}>🧪</div>
                <div style={{fontWeight:700}}>No fertilizers found</div>
              </div>
            : ferts.map(f => (
                <div key={f.id} style={s.card} onClick={() => navigate(`/fertilizers/${f.id}`)}>
                  <div style={s.info}>
                    <div style={s.name}>{f.name}</div>
                    <div style={s.type}>{f.type} Fertilizer</div>
                    {/* US3 - NPK badge */}
                    <span style={s.npkBadge}>NPK: {f.npk_ratio}</span>
                    <br/>
                    <span className={`stock-badge ${stockClass(f.stock)}`}>{stockLabel(f.stock)}</span>
                  </div>
                  <div style={s.right}>
                    <div style={s.price}>₹{f.price_per_bag.toLocaleString('en-IN')}</div>
                    <div style={s.unit}>{f.unit}</div>
                  </div>
                </div>
              ))
        }
        <div style={{height:16}}/>
      </div>
    </>
  )
}

const s = {
  card:     { background:'#fff', margin:'0 16px 10px', borderRadius:12, padding:'14px 16px', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer' },
  info:     {},
  name:     { fontSize:14, fontWeight:800, color:'#1B2B1C' },
  type:     { fontSize:11, color:'#6B836D', marginTop:2 },
  npkBadge: { display:'inline-block', background:'#E8F5E9', color:'#2E7D32', border:'1px solid #C8E6C9', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, marginTop:7, letterSpacing:.5 },
  right:    { textAlign:'right', flexShrink:0, marginLeft:12 },
  price:    { fontFamily:'Poppins,sans-serif', fontSize:16, fontWeight:700, color:'#2E7D32' },
  unit:     { fontSize:11, color:'#9EB0A0', marginTop:2 },
}
