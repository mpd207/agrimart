import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketApi } from '../api'

export default function MarketPage() {
  const navigate = useNavigate()
  const [prices, setPrices]   = useState([])
  const [loading, setLoading] = useState(true)
  const [lastTs, setLastTs]   = useState(null)
  const intervalRef = useRef(null)

  async function fetchPrices() {
    try {
      const { data } = await marketApi.getPrices()
      setPrices(data)
      if (data[0]?.timestamp) setLastTs(new Date(data[0].timestamp))
    } catch (e) {
      console.error('Market prices fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    // Auto-refresh every 30 seconds (User Story 1 - NFR: price updates visible within 2s)
    intervalRef.current = setInterval(fetchPrices, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

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
        {/* Live bar */}
        <div style={s.liveBar}>
          <span style={s.liveDot} />
          <span style={{fontSize:12,color:'#3D5140',fontWeight:600}}>Auto-refreshing every 30s</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'#9EB0A0'}}>{fmtTs(lastTs)}</span>
        </div>

        {loading
          ? <div className="spinner" />
          : prices.map(p => (
            <div key={p.id} style={s.row}>
              <div>
                <div style={s.rowName}>{p.emoji} {p.name}</div>
                <div style={s.rowMeta}>{p.market} · {p.unit}</div>
                {/* ISO timestamp (US1 checklist) */}
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

        <div style={{padding:'12px 16px 20px'}}>
          <button className="btn-primary" onClick={fetchPrices}>↻ Refresh Now</button>
        </div>
      </div>
    </>
  )
}

const s = {
  liveBar:  { background:'rgba(46,125,50,.08)', margin:'12px 16px 6px', borderRadius:10, padding:'8px 14px', display:'flex', alignItems:'center', gap:10 },
  liveDot:  { width:8, height:8, background:'#66BB6A', borderRadius:'50%', display:'inline-block', animation:'blink 1.6s infinite' },
  row:      { background:'#fff', margin:'0 16px 10px', borderRadius:12, padding:'14px 16px', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  rowName:  { fontFamily:'Poppins,sans-serif', fontSize:15, color:'#1B2B1C', fontWeight:600 },
  rowMeta:  { fontSize:11, color:'#9EB0A0', marginTop:2 },
  rowTs:    { fontSize:10, color:'#b0c4b1', marginTop:3, fontFamily:'monospace' },
  rowPrice: { fontFamily:'Poppins,sans-serif', fontSize:17, fontWeight:700, color:'#1B2B1C' },
}
