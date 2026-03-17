import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedsApi } from '../api'

const SEASONS    = ['All', 'Rabi', 'Kharif', 'Both']
const CATEGORIES = ['All', 'Vegetable', 'Cereal', 'Oilseed']

function stockClass(stock) {
  if (stock > 300) return 'stock-hi'
  if (stock >= 100) return 'stock-mid'
  return 'stock-lo'
}
function stockLabel(stock) {
  if (stock > 300) return `In Stock (${stock} kg)`
  if (stock >= 100) return `Limited (${stock} kg)`
  return `Low Stock (${stock} kg)`
}

export default function SeedsPage() {
  const navigate       = useNavigate()
  const [seeds, setSeeds]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [season, setSeason]     = useState('All')
  const [category, setCategory] = useState('All')
  const debounceRef = useRef(null)

  // US5 - Real-time filtering. Debounced to stay under 500ms
  const loadSeeds = useCallback(async (q, s, c) => {
    try {
      const params = {}
      if (q) params.search   = q
      if (s && s !== 'All') params.season   = s
      if (c && c !== 'All') params.category = c
      const { data } = await seedsApi.getAll(params)
      setSeeds(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSeeds('', 'All', 'All') }, [loadSeeds])

  function handleSearch(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    // 300ms debounce - well within 500ms NFR
    debounceRef.current = setTimeout(() => loadSeeds(val, season, category), 300)
  }

  function handleSeason(val) {
    setSeason(val)
    loadSeeds(search, val, category)
  }

  function handleCategory(val) {
    setCategory(val)
    loadSeeds(search, season, val)
  }

  function clearSearch() {
    setSearch('')
    loadSeeds('', season, category)
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Premium Seeds</h2>
        <div style={{width:34}} />
      </div>

      {/* US5 - Search bar */}
      <div className="search-wrap">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search seeds by name, variety…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            autoComplete="off"
          />
          {search && <button className="search-clear" onClick={clearSearch}>✕</button>}
        </div>
      </div>

      {/* Season filter */}
      <div className="filter-row">
        {SEASONS.map(s => (
          <button key={s} className={`fp ${season === s ? 'active' : ''}`} onClick={() => handleSeason(s)}>{s}</button>
        ))}
      </div>

      {/* Category filter */}
      <div className="filter-row" style={{paddingTop:0}}>
        {CATEGORIES.map(c => (
          <button key={c} className={`fp ${category === c ? 'active' : ''}`} onClick={() => handleCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="page-scroll" style={{flex:1}}>
        {loading
          ? <div className="spinner" />
          : seeds.length === 0
            ? (
              <div style={{textAlign:'center',padding:'40px 20px',color:'#6B836D'}}>
                <div style={{fontSize:48,marginBottom:12}}>🌱</div>
                <div style={{fontWeight:700,marginBottom:6}}>No seeds found</div>
                <div style={{fontSize:13}}>Try a different search or filter</div>
                <button className="btn-outline" style={{marginTop:16,width:'auto',padding:'8px 20px'}} onClick={clearSearch}>Clear filters</button>
              </div>
            )
            : (
              <div style={s.grid}>
                {seeds.map(seed => (
                  <div key={seed.id} style={s.card} onClick={() => navigate(`/seeds/${seed.id}`)}>
                    <div style={s.cardImg}>{seed.emoji}</div>
                    <div style={s.cardBody}>
                      <div style={s.cardName}>{seed.name}</div>
                      <div style={s.cardVar}>{seed.variety}</div>
                      <span style={s.seasonTag}>{seed.season}</span>
                      <div style={s.cardPrice}>₹{seed.price_per_kg}/{seed.unit}</div>
                      <span className={`stock-badge ${stockClass(seed.stock)}`}>{stockLabel(seed.stock)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </>
  )
}

const s = {
  grid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 16px 20px' },
  card:     { background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', cursor:'pointer' },
  cardImg:  { height:98, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'#E8F5E9' },
  cardBody: { padding:'10px 11px 12px' },
  cardName: { fontSize:13, fontWeight:800, color:'#1B2B1C' },
  cardVar:  { fontSize:11, color:'#6B836D', marginTop:2 },
  seasonTag:{ display:'inline-block', background:'#E3F2FD', color:'#1565C0', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, marginTop:5 },
  cardPrice:{ fontSize:14, fontWeight:800, color:'#2E7D32', marginTop:6 },
}
