import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { marketApi } from '../api'

const PERIODS = [7, 30, 90]
const COMPARISON_COLORS = ['#2E7D32', '#F57C00', '#1976D2', '#8E24AA', '#C62828']

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export default function MarketPage() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastTs, setLastTs] = useState(null)
  const [period, setPeriod] = useState(7)
  const [trends, setTrends] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCommodities, setSelectedCommodities] = useState([])
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
      setSelectedCommodities((current) => {
        const available = data.map((item) => item.commodity)
        const kept = current.filter((commodity) => available.includes(commodity))
        if (kept.length > 0) return kept
        return available.slice(0, Math.min(2, available.length))
      })
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

  const selectedTrendData = useMemo(() => {
    return trends.filter((trend) => selectedCommodities.includes(trend.commodity))
  }, [selectedCommodities, trends])

  function toggleCommodity(commodity) {
    setSelectedCommodities((current) => {
      if (current.includes(commodity)) {
        return current.length === 1 ? current : current.filter((item) => item !== commodity)
      }
      if (current.length >= 3) {
        return [...current.slice(1), commodity]
      }
      return [...current, commodity]
    })
  }

  const fmtTs = (ts) => ts
    ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--'

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Live Market Prices</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="page-scroll">
        <div style={s.liveBar}>
          <span style={s.liveDot} />
          <span style={{ fontSize: 12, color: '#3D5140', fontWeight: 600 }}>Auto-refreshing every 30s</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9EB0A0' }}>{fmtTs(lastTs)}</span>
        </div>

        {error && <div style={s.errorBanner}>{error}</div>}

        {loading
          ? <div className="spinner" />
          : prices.map((p) => (
            <div key={p.id} style={s.row}>
              <div>
                <div style={s.rowName}>{p.emoji} {p.name}</div>
                <div style={s.rowMeta}>{p.market} · {p.unit}</div>
                <div style={s.rowTs}>{new Date(p.timestamp).toISOString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={s.rowPrice}>₹{Math.round(p.price).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: p.change_percent >= 0 ? '#66BB6A' : '#C62828' }}>
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
              <div style={s.analyticsSub}>Compare up to three commodities on one chart</div>
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
            <>
              <div style={s.compareLabel}>Select commodities to compare</div>
              <div style={s.commodityPicker}>
                {trends.map((trend) => {
                  const active = selectedCommodities.includes(trend.commodity)
                  const color = COMPARISON_COLORS[trends.findIndex((item) => item.commodity === trend.commodity) % COMPARISON_COLORS.length]
                  return (
                    <button
                      key={trend.commodity}
                      style={{
                        ...s.commodityChip,
                        ...(active ? { background: color, color: '#fff', borderColor: color } : {}),
                      }}
                      onClick={() => toggleCommodity(trend.commodity)}
                    >
                      {trend.emoji} {trend.name}
                    </button>
                  )
                })}
              </div>

              <div style={s.compareCard}>
                <div style={s.legendRow}>
                  {selectedTrendData.map((trend, index) => (
                    <div key={trend.commodity} style={s.legendItem}>
                      <span style={{ ...s.legendDot, background: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }} />
                      <span>{trend.name}</span>
                    </div>
                  ))}
                </div>
                <ComparisonChart trends={selectedTrendData} />
              </div>

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
                    <div style={s.trendMeta}>
                      <span>{trend.points.length} points</span>
                      <span>{selectedCommodities.includes(trend.commodity) ? 'Shown in compare view' : 'Tap above to compare'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '12px 16px 20px' }}>
          <button className="btn-primary" onClick={fetchPrices}>↻ Refresh Now</button>
        </div>
      </div>
    </>
  )
}

function ComparisonChart({ trends }) {
  if (!trends?.length) {
    return <div style={s.chartEmpty}>Choose at least one commodity to display the comparison graph.</div>
  }

  const labels = trends[0]?.points?.map((point) => point.date) || []
  const datasets = trends.map((trend, index) => ({
    label: trend.name,
    data: trend.points.map((point) => point.price),
    borderColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
    backgroundColor: `${COMPARISON_COLORS[index % COMPARISON_COLORS.length]}22`,
    borderWidth: 3,
    pointRadius: 2,
    pointHoverRadius: 4,
    tension: 0.35,
    fill: false,
  }))

  const data = { labels, datasets }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ₹${Math.round(context.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B836D', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
      },
      y: {
        grid: { color: '#E3EEE3' },
        ticks: {
          color: '#6B836D',
          callback: (value) => `₹${Math.round(value).toLocaleString('en-IN')}`,
        },
      },
    },
  }

  return (
    <div style={s.chartWrap}>
      <Line data={data} options={options} />
    </div>
  )
}

const s = {
  liveBar: { background: 'rgba(46,125,50,.08)', margin: '12px 16px 6px', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  liveDot: { width: 8, height: 8, background: '#66BB6A', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.6s infinite' },
  errorBanner: { background: '#FFF3E0', color: '#A65B00', margin: '8px 16px 12px', border: '1px solid #FFD7A8', borderRadius: 12, padding: '10px 12px', fontSize: 12, fontWeight: 700 },
  row: { background: '#fff', margin: '0 16px 10px', borderRadius: 12, padding: '14px 16px', border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowName: { fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#1B2B1C', fontWeight: 600 },
  rowMeta: { fontSize: 11, color: '#9EB0A0', marginTop: 2 },
  rowTs: { fontSize: 10, color: '#B0C4B1', marginTop: 3 },
  rowPrice: { fontFamily: 'Poppins,sans-serif', fontSize: 17, fontWeight: 700, color: '#1B2B1C' },
  analyticsWrap: { margin: '10px 16px 8px', background: '#fff', border: '1px solid #DDE8DD', borderRadius: 16, padding: 14, boxShadow: '0 2px 12px rgba(27,94,32,0.08)' },
  analyticsHead: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 },
  analyticsTitle: { fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 700, color: '#1B2B1C' },
  analyticsSub: { fontSize: 12, color: '#6B836D', marginTop: 3 },
  periodTabs: { display: 'flex', gap: 8, overflowX: 'auto' },
  compareLabel: { fontSize: 12, fontWeight: 700, color: '#3D5140', marginBottom: 10 },
  commodityPicker: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 },
  commodityChip: { border: '1px solid #DDE8DD', borderRadius: 999, padding: '8px 12px', background: '#F8FBF8', color: '#3D5140', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  compareCard: { background: '#F8FBF8', borderRadius: 14, padding: 12, border: '1px solid #E3EEE3', marginBottom: 12 },
  legendRow: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#3D5140' },
  legendDot: { width: 10, height: 10, borderRadius: '50%' },
  chartWrap: { width: '100%', height: 220 },
  chartEmpty: { fontSize: 12, color: '#6B836D', textAlign: 'center', padding: '24px 12px' },
  trendList: { display: 'flex', flexDirection: 'column', gap: 12 },
  trendCard: { background: '#F8FBF8', borderRadius: 14, padding: 12, border: '1px solid #E3EEE3' },
  trendTop: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  trendName: { fontSize: 14, fontWeight: 800, color: '#1B2B1C' },
  trendRange: { fontSize: 11, color: '#6B836D', marginTop: 4 },
  trendNow: { fontSize: 14, fontWeight: 800, color: '#2E7D32' },
  trendMeta: { display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11, color: '#6B836D', marginTop: 10 },
}
