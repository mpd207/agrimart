import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedsApi } from '../api'

const SEASONS = ['All', 'Rabi', 'Kharif', 'Both']
const CATEGORIES = ['All', 'Vegetable', 'Cereal', 'Oilseed']
const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'price_desc', label: 'Price High-Low' },
  { value: 'stock_desc', label: 'Most Stock' },
]

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
  const navigate = useNavigate()
  const [seeds, setSeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [season, setSeason] = useState('All')
  const [category, setCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState(350)
  const [sortBy, setSortBy] = useState('')
  const debounceRef = useRef(null)

  const loadSeeds = useCallback(async (nextState) => {
    try {
      setLoading(true)
      const params = {}
      if (nextState.search) params.search = nextState.search
      if (nextState.season !== 'All') params.season = nextState.season
      if (nextState.category !== 'All') params.category = nextState.category
      params.max_price = nextState.maxPrice
      if (nextState.sortBy) params.sort_by = nextState.sortBy
      const { data } = await seedsApi.getAll(params)
      setSeeds(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSeeds({ search: '', season: 'All', category: 'All', maxPrice: 350, sortBy: '' })
  }, [loadSeeds])

  function triggerSearch(next) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadSeeds(next), 300)
  }

  function handleSearch(value) {
    setSearch(value)
    triggerSearch({ search: value, season, category, maxPrice, sortBy })
  }

  function handleSeason(value) {
    setSeason(value)
    loadSeeds({ search, season: value, category, maxPrice, sortBy })
  }

  function handleCategory(value) {
    setCategory(value)
    loadSeeds({ search, season, category: value, maxPrice, sortBy })
  }

  function handleMaxPrice(value) {
    const numericValue = Number(value)
    setMaxPrice(numericValue)
    loadSeeds({ search, season, category, maxPrice: numericValue, sortBy })
  }

  function handleSort(value) {
    setSortBy(value)
    loadSeeds({ search, season, category, maxPrice, sortBy: value })
  }

  function clearFilters() {
    setSearch('')
    setSeason('All')
    setCategory('All')
    setMaxPrice(350)
    setSortBy('')
    loadSeeds({ search: '', season: 'All', category: 'All', maxPrice: 350, sortBy: '' })
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Premium Seeds</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="search-wrap">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search seeds by name, variety..." value={search} onChange={(e) => handleSearch(e.target.value)} autoComplete="off" />
          {search && <button className="search-clear" onClick={clearFilters}>×</button>}
        </div>
      </div>

      <div className="filter-row">
        {SEASONS.map((value) => (
          <button key={value} className={`fp ${season === value ? 'active' : ''}`} onClick={() => handleSeason(value)}>{value}</button>
        ))}
      </div>

      <div className="filter-row" style={{ paddingTop: 0 }}>
        {CATEGORIES.map((value) => (
          <button key={value} className={`fp ${category === value ? 'active' : ''}`} onClick={() => handleCategory(value)}>{value}</button>
        ))}
      </div>

      <div style={s.toolsWrap}>
        <div style={s.sliderCard}>
          <div style={s.sliderTop}>
            <span style={s.sliderLabel}>Max Price</span>
            <span style={s.sliderValue}>₹{maxPrice}</span>
          </div>
          <input type="range" min="50" max="350" step="10" value={maxPrice} onChange={(e) => handleMaxPrice(e.target.value)} style={s.range} />
        </div>

        <div style={s.sortRow}>
          <select className="inp" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="btn-outline" style={s.resetBtn} onClick={clearFilters}>Reset</button>
        </div>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        {!loading && <div style={s.resultCount}>Showing {seeds.length} seed product{seeds.length !== 1 ? 's' : ''}</div>}

        {loading ? (
          <div className="spinner" />
        ) : seeds.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🌱</div>
            <div style={s.emptyTitle}>No seeds found</div>
            <div style={s.emptySub}>Try a different search, price range, or season filter.</div>
            <button className="btn-outline" style={{ marginTop: 16, width: 'auto', padding: '8px 20px' }} onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div style={s.grid}>
            {seeds.map((seed) => (
              <div key={seed.id} style={s.card} onClick={() => navigate(`/seeds/${seed.id}`)}>
                <div style={s.cardImg}>{seed.emoji}</div>
                <div style={s.cardBody}>
                  <div style={s.cardName}>{seed.name}</div>
                  <div style={s.cardVar}>{seed.variety}</div>
                  <div style={s.tagRow}>
                    <span style={s.seasonTag}>{seed.season}</span>
                    <span style={s.categoryTag}>{seed.category}</span>
                  </div>
                  <div style={s.cardPrice}>₹{seed.price_per_kg}/{seed.unit}</div>
                  <span className={`stock-badge ${stockClass(seed.stock)}`}>{stockLabel(seed.stock)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const s = {
  toolsWrap: { padding: '0 16px 10px' },
  sliderCard: { background: '#fff', border: '1px solid #DDE8DD', borderRadius: 12, padding: 12, boxShadow: '0 2px 12px rgba(27,94,32,0.08)' },
  sliderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderLabel: { fontSize: 12, color: '#6B836D', fontWeight: 700 },
  sliderValue: { fontSize: 13, color: '#2E7D32', fontWeight: 800 },
  range: { width: '100%' },
  sortRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 10 },
  resetBtn: { width: 'auto', padding: '0 16px', minHeight: 48 },
  resultCount: { padding: '4px 16px 8px', fontSize: 12, color: '#9EB0A0', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#6B836D' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontWeight: 700, marginBottom: 6 },
  emptySub: { fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px 20px' },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)', cursor: 'pointer' },
  cardImg: { height: 98, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, background: '#E8F5E9' },
  cardBody: { padding: '10px 11px 12px' },
  cardName: { fontSize: 13, fontWeight: 800, color: '#1B2B1C' },
  cardVar: { fontSize: 11, color: '#6B836D', marginTop: 2 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  seasonTag: { display: 'inline-block', background: '#E3F2FD', color: '#1565C0', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 },
  categoryTag: { display: 'inline-block', background: '#FFF8E1', color: '#A56A00', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 },
  cardPrice: { fontSize: 14, fontWeight: 800, color: '#2E7D32', marginTop: 8 },
}
