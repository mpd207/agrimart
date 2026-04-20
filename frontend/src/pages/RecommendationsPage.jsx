import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { recommendationsApi } from '../api'
import { useAuthStore } from '../context/authStore'

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      setLoading(true)
      const { data } = await recommendationsApi.getAll()
      setItems(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Seasonal Picks</h2>
        <button style={s.refreshBtn} onClick={loadRecommendations}>Refresh</button>
      </div>

      <div className="page-scroll" style={{ flex: 1, paddingTop: 10 }}>
        <div style={s.hero}>
          <div style={s.heroTitle}>Recommendations for {user?.full_name?.split(' ')[0] || 'you'}</div>
          <div style={s.heroSub}>
            Based on your season, pincode, farming profile, and recent order behavior.
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : items.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🌿</div>
            <div style={s.emptyTitle}>No recommendations yet</div>
            <div style={s.emptySub}>Complete your profile or place an order to improve seasonal suggestions.</div>
          </div>
        ) : (
          items.map((item) => {
            const path = item.item_type === 'seed' ? `/seeds/${item.item_id}` : `/fertilizers/${item.item_id}`
            return (
              <div key={`${item.item_type}-${item.item_id}`} style={s.card} onClick={() => navigate(path)}>
                <div style={s.emoji}>{item.emoji || '🌱'}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.title}>{item.title}</div>
                  <div style={s.subtitle}>{item.subtitle}</div>
                  <div style={s.reason}>{item.reason}</div>
                  <div style={s.badgeRow}>
                    <span style={s.badge}>{item.season_match}</span>
                    <span style={s.price}>{item.price_label}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div style={{ height: 20 }} />
      </div>
    </>
  )
}

const s = {
  refreshBtn: { background: 'transparent', border: 'none', color: '#2E7D32', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  hero: { margin: '0 16px 12px', background: 'linear-gradient(135deg,#E8F5E9,#F4FAF4)', border: '1px solid #DCE8DC', borderRadius: 16, padding: 16 },
  heroTitle: { fontSize: 17, fontWeight: 800, color: '#1B2B1C' },
  heroSub: { fontSize: 12, lineHeight: 1.5, color: '#567058', marginTop: 8 },
  card: { background: '#fff', margin: '0 16px 12px', borderRadius: 14, padding: 16, border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)', display: 'flex', gap: 12, cursor: 'pointer' },
  emoji: { width: 46, height: 46, borderRadius: 14, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  title: { fontSize: 14, fontWeight: 800, color: '#1B2B1C' },
  subtitle: { fontSize: 12, color: '#6B836D', marginTop: 4 },
  reason: { fontSize: 12, color: '#3D5140', marginTop: 8, lineHeight: 1.45 },
  badgeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12 },
  badge: { background: '#F1F8E9', color: '#33691E', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 },
  price: { fontSize: 12, color: '#2E7D32', fontWeight: 800 },
  empty: { margin: '20px 16px', background: '#fff', border: '1px solid #DDE8DD', borderRadius: 14, padding: '36px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 800, color: '#1B2B1C' },
  emptySub: { fontSize: 12, lineHeight: 1.5, color: '#6B836D', marginTop: 8 },
}
