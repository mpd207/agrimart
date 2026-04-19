import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketApi } from '../api'

const PERIODS = [7, 30, 90]

export default function MarketPage() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastTs, setLastTs] = useState(null)
  const [period, setPeriod] = useState(7)
  const [trends, setTrends] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  async function fetchPrices() {
    try {
      const { data } = await marketApi.getPrices()
      setPrices(data)
      setError('')
      if (data[0]?.timestamp) setLastTs(new Date(data[0].timestamp))
    } catch (e) {
      console.error('Market prices fetch failed', e)
      setError('Unable to fetch latest prices. Retrying...')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTrends(nextPeriod) {
    try {
      setTrendLoading(true)
      const { data } = await marketApi.getTrends(nextPeriod)
      setTrends(data)
    } catch (e) {
      console.error('Market trends fetch failed', e)
    } finally {
      setTrendLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    fetchTrends(period)
    intervalRef.current = setInterval(fetchPrices, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    fetchTrends(period)
  }, [period])

  const fmtTs = (ts) => ts
    ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '–'

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Live Market Prices</h2>
        <div style={{width:34}} />
      </div>

      <div className="page-scroll">
        <div style={s.liveBar}>
          <span style={s.liveDot} />
          <span style={{fontSize:12,color:'#3D5140',fontWeight:600}}>Auto-refreshing every 30s</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'#9EB0A0'}}>{fmtTs(lastTs)}</span>
        </div>

        {error && (
          <div style={s.errorBanner}>{error}</div>
        )}

        {loading
          ? <div className="spinner" />
          : prices.map((p) => (
            <div key={p.id} style={s.row}>
              <div>
                <div style={s.rowName}>{p.emoji} {p.name}</div>
                <div style={s.rowMeta}>{p.market} · {p.unit}</div>
                <div style={s.rowTs}>{new Date(p.timestamp).toISOString()}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={s.rowPrice}>₹{Math.round(p.price).toLocaleString('en-IN')}</div>
                <div style={{fontSize:12,fontWeight:800, color: p.change_percent >= 0 ? '#66BB6A' : '#C62828'}}>
                  {p.change_percent >= 0 ? '▲ +' : '▼ '}{p.change_percent}%
                </div>
              </div>
            </div>
          ))
        }

        <div style={s.analyticsWrap}>
          <div style={s.analyticsHead}>
            <div>
              <div style={s.analyticsTitle}>Price Trend Analytics</div>
              <div style={s.analyticsSub}>Track historical movement across {period} days</div>
            </div>
            <div style={s.periodTabs}>
              {PERIODS.map((option) => (
                <button
                  key={option}
                  className={`fp ${period === option ? 'active' : ''}`}
                  onClick={() => setPeriod(option)}
                >
                  {option}D
                </button>
              ))}
            </div>
          </div>

          {trendLoading ? (
            <div className="spinner" />
          ) : (
            <div style={s.trendList}>
              {trends.map((trend) => (
                <div key={trend.commodity} style={s.trendCard}>
                  <div style={s.trendTop}>
                    <div>
                      <div style={s.trendName}>{trend.emoji} {trend.name}</div>
                      <div style={s.trendRange}>Low ₹{Math.round(trend.low_price)} · High ₹{Math.round(trend.high_price)}</div>
                    </div>
                    <div style={s.trendNow}>₹{Math.round(trend.current_price)}</div>
                  </div>
                  <Sparkline points={trend.points} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{padding:'12px 16px 20px'}}>
          <button className="btn-primary" onClick={fetchPrices}>↻ Refresh Now</button>
        </div>
      </div>
    </>
  )
}

function Sparkline({ points }) {
  if (!points?.length) return null

  const width = 300
  const height = 72
  const padding = 8
  const prices = points.map((point) => point.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const spread = Math.max(max - min, 1)

  const path = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((point.price - min) / spread) * (height - padding * 2)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={s.sparkline}>
      <defs>
        <linearGradient id="trendStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#43A047" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#trendStroke)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const s = {
  liveBar: { background:'rgba(46,125,50,.08)', margin:'12px 16px 6px', borderRadius:10, padding:'8px 14px', display:'flex', alignItems:'center', gap:10 },
  liveDot: { width:8, height:8, background:'#66BB6A', borderRadius:'50%', display:'inline-block', animation:'blink 1.6s infinite' },
  errorBanner: { background:'#FFF3E0', color:'#A65B00', margin:'8px 16px 12px', border:'1px solid #FFD7A8', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:700 },
  row: { background:'#fff', margin:'0 16px 10px', borderRadius:12, padding:'14px 16px', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  rowName: { fontFamily:'Poppins,sans-serif', fontSize:15, color:'#1B2B1C', fontWeight:600 },
  rowMeta: { fontSize:11, color:'#9EB0A0', marginTop:2 },
  rowTs: { fontSize:10, color:'#b0c4b1', marginTop:3, fontFamily:'monospace' },
  rowPrice: { fontFamily:'Poppins,sans-serif', fontSize:17, fontWeight:700, color:'#1B2B1C' },
  analyticsWrap: { margin:'10px 16px 8px', background:'#fff', border:'1px solid #DDE8DD', borderRadius:16, padding:14, boxShadow:'0 2px 12px rgba(27,94,32,0.08)' },
  analyticsHead: { display:'flex', flexDirection:'column', gap:12, marginBottom:12 },
  analyticsTitle: { fontFamily:'Poppins,sans-serif', fontSize:15, fontWeight:700, color:'#1B2B1C' },
  analyticsSub: { fontSize:12, color:'#6B836D', marginTop:3 },
  periodTabs: { display:'flex', gap:8, overflowX:'auto' },
  trendList: { display:'flex', flexDirection:'column', gap:12 },
  trendCard: { background:'#F8FBF8', borderRadius:14, padding:12, border:'1px solid #E3EEE3' },
  trendTop: { display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start', marginBottom:8 },
  trendName: { fontSize:14, fontWeight:800, color:'#1B2B1C' },
  trendRange: { fontSize:11, color:'#6B836D', marginTop:4 },
  trendNow: { fontSize:14, fontWeight:800, color:'#2E7D32' },
  sparkline: { width:'100%', height:72, display:'block' },
}
