import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fertilizersApi } from '../api'

const TYPES = ['All', 'Nitrogenous', 'Phosphatic', 'Potassic', 'Complex']
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
  if (stock > 300) return `In Stock (${stock} bags)`
  if (stock >= 100) return `Limited (${stock} bags)`
  return `Low Stock (${stock} bags)`
}

export default function FertilizersPage() {
  const navigate = useNavigate()
  const [allFerts, setAllFerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [priceRange, setPriceRange] = useState([250, 1500])
  const [bounds, setBounds] = useState({ min: 250, max: 1500 })
  const [sortBy, setSortBy] = useState('')

  useEffect(() => {
    async function loadFerts() {
      try {
        setLoading(true)
        const { data } = await fertilizersApi.getAll()
        setAllFerts(data)
        if (data.length > 0) {
          const prices = data.map((item) => item.price_per_bag)
          const min = Math.floor(Math.min(...prices))
          const max = Math.ceil(Math.max(...prices))
          setBounds({ min, max })
          setPriceRange([min, max])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadFerts()
  }, [])

  const ferts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const [minPrice, maxPrice] = priceRange

    const filtered = allFerts.filter((fert) => {
      const matchesSearch = !keyword || [
        fert.name,
        fert.type,
        fert.npk_ratio,
      ].some((value) => value?.toLowerCase().includes(keyword))

      const matchesType = type === 'All' || fert.type === type
      const matchesPrice = fert.price_per_bag >= minPrice && fert.price_per_bag <= maxPrice

      return matchesSearch && matchesType && matchesPrice
    })

    filtered.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_per_bag - b.price_per_bag
      if (sortBy === 'price_desc') return b.price_per_bag - a.price_per_bag
      if (sortBy === 'stock_desc') return b.stock - a.stock
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [allFerts, priceRange, search, sortBy, type])

  function clearFilters() {
    setSearch('')
    setType('All')
    setPriceRange([bounds.min, bounds.max])
    setSortBy('')
  }

  function updateMinPrice(value) {
    const nextMin = Number(value)
    setPriceRange(([_, currentMax]) => [Math.min(nextMin, currentMax), currentMax])
  }

  function updateMaxPrice(value) {
    const nextMax = Number(value)
    setPriceRange(([currentMin]) => [currentMin, Math.max(nextMax, currentMin)])
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Fertilizers</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="search-wrap">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search by name, type, or NPK..." value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      <div className="filter-row">
        {TYPES.map((value) => (
          <button key={value} className={`fp ${type === value ? 'active' : ''}`} onClick={() => setType(value)}>{value}</button>
        ))}
      </div>

      <div style={s.toolsWrap}>
        <div style={s.sliderCard}>
          <div style={s.sliderTop}>
            <span style={s.sliderLabel}>Price Range</span>
            <span style={s.sliderValue}>₹{priceRange[0]} - ₹{priceRange[1]}</span>
          </div>
          <div style={s.rangeBlock}>
            <label style={s.rangeLabel}>Min Price</label>
            <input type="range" min={bounds.min} max={bounds.max} step="10" value={priceRange[0]} onChange={(e) => updateMinPrice(e.target.value)} style={s.range} />
          </div>
          <div style={s.rangeBlock}>
            <label style={s.rangeLabel}>Max Price</label>
            <input type="range" min={bounds.min} max={bounds.max} step="10" value={priceRange[1]} onChange={(e) => updateMaxPrice(e.target.value)} style={s.range} />
          </div>
        </div>

        <div style={s.sortRow}>
          <select className="inp" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="btn-outline" style={s.resetBtn} onClick={clearFilters}>Reset</button>
        </div>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        {!loading && <div style={s.resultCount}>Showing {ferts.length} product{ferts.length !== 1 ? 's' : ''}</div>}

        {loading ? (
          <div className="spinner" />
        ) : ferts.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🧪</div>
            <div style={s.emptyTitle}>No fertilizers found</div>
            <div style={s.emptySub}>Try a different keyword, price range, or category filter.</div>
            <button className="btn-outline" style={{ marginTop: 16, width: 'auto', padding: '8px 20px' }} onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          ferts.map((f) => (
            <div key={f.id} style={s.card} onClick={() => navigate(`/fertilizers/${f.id}`)}>
              <div style={s.info}>
                <div style={s.name}>{f.name}</div>
                <div style={s.type}>{f.type} Fertilizer</div>
                <span style={s.npkBadge}>NPK: {f.npk_ratio}</span>
                <br />
                <span className={`stock-badge ${stockClass(f.stock)}`}>{stockLabel(f.stock)}</span>
              </div>
              <div style={s.right}>
                <div style={s.price}>₹{f.price_per_bag.toLocaleString('en-IN')}</div>
                <div style={s.unit}>{f.unit}</div>
              </div>
            </div>
          ))
        )}
        <div style={{ height: 16 }} />
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
  rangeBlock: { marginTop: 8 },
  rangeLabel: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B836D', marginBottom: 4 },
  range: { width: '100%' },
  sortRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 10 },
  resetBtn: { width: 'auto', padding: '0 16px', minHeight: 48 },
  resultCount: { padding: '4px 16px 6px', fontSize: 12, color: '#9EB0A0', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#6B836D' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontWeight: 700 },
  emptySub: { fontSize: 13, marginTop: 6 },
  card: { background: '#fff', margin: '0 16px 10px', borderRadius: 12, padding: '14px 16px', border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' },
  info: {},
  name: { fontSize: 14, fontWeight: 800, color: '#1B2B1C' },
  type: { fontSize: 11, color: '#6B836D', marginTop: 2 },
  npkBadge: { display: 'inline-block', background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 800, marginTop: 7, letterSpacing: 0.5 },
  right: { textAlign: 'right', flexShrink: 0, marginLeft: 12 },
  price: { fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 700, color: '#2E7D32' },
  unit: { fontSize: 11, color: '#9EB0A0', marginTop: 2 },
}
