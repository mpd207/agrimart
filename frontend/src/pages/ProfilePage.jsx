import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import { useAuthStore } from '../context/authStore'
import { useOrdersStore } from '../context/ordersStore'

const EMPTY_FORM = {
  full_name: '',
  pincode: '',
  farming_type: '',
  landsize_acres: '',
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuthStore()
  const { orders, fetchOrders } = useOrdersStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const [{ data }] = await Promise.all([
          authApi.getProfile(),
          fetchOrders(),
        ])
        if (!mounted) return
        setUser(data)
        setForm({
          full_name: data.full_name || '',
          pincode: data.pincode || '',
          farming_type: data.farming_type || '',
          landsize_acres: data.landsize_acres || '',
        })
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [fetchOrders, setUser])

  const initials = useMemo(() => {
    if (!user?.full_name) return 'FM'
    return user.full_name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [user])

  function setField(field) {
    return (e) => setForm((current) => ({ ...current, [field]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        full_name: form.full_name.trim() || null,
        pincode: form.pincode.trim() || null,
        farming_type: form.farming_type || null,
        landsize_acres: form.landsize_acres.trim() || null,
      }
      const { data } = await authApi.updateProfile(payload)
      setUser(data)
      setForm({
        full_name: data.full_name || '',
        pincode: data.pincode || '',
        farming_type: data.farming_type || '',
        landsize_acres: data.landsize_acres || '',
      })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div style={s.hero}>
        <div style={s.avatar}>{initials}</div>
        <div style={s.name}>{user?.full_name || 'Farmer Profile'}</div>
        <div style={s.phone}>{user?.mobile || 'No mobile number found'}</div>
        <div style={s.roleBadge}>{user?.role === 'admin' ? 'Admin' : 'Farmer'}</div>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Farmer Details</div>

          {loading ? (
            <div className="spinner" />
          ) : (
            <form onSubmit={handleSave} style={s.form}>
              <label style={s.label}>
                Full Name
                <input className="inp" type="text" placeholder="Your full name" value={form.full_name} onChange={setField('full_name')} />
              </label>

              <label style={s.label}>
                Mobile Number
                <input className="inp" type="text" value={user?.mobile || ''} disabled style={s.disabledInput} />
              </label>

              <label style={s.label}>
                Pincode
                <input className="inp" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit pincode" value={form.pincode} onChange={setField('pincode')} />
              </label>

              <label style={s.label}>
                Farming Type
                <select className="inp" value={form.farming_type} onChange={setField('farming_type')}>
                  <option value="">Select farming type</option>
                  <option value="Cereal">Cereal</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Organic">Organic</option>
                </select>
              </label>

              <label style={s.label}>
                Land Size (Acres)
                <input className="inp" type="text" inputMode="decimal" placeholder="e.g. 4.5" value={form.landsize_acres} onChange={setField('landsize_acres')} />
              </label>

              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>

        <div style={s.card}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Profile Completion</span>
            <span style={s.summaryValue}>{profileCompletion(form)}%</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${profileCompletion(form)}%` }} />
          </div>
          <p style={s.summaryHint}>
            Add your profile details so future location-based and seasonal recommendations can be more useful.
          </p>
        </div>

        <div style={s.card}>
          <div style={s.quickLink} onClick={() => navigate('/notifications')}>
            <div>
              <div style={s.orderId}>Notifications & Alerts</div>
              <div style={s.orderMeta}>Manage OTP, price alerts, and notification inbox</div>
            </div>
            <button style={s.linkBtn}>Open</button>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div style={s.card}>
            <div style={s.quickLink} onClick={() => navigate('/admin/orders')}>
              <div>
                <div style={s.orderId}>Admin Order Console</div>
                <div style={s.orderMeta}>Update customer order statuses and monitor fulfillment</div>
              </div>
              <button style={s.linkBtn}>Open</button>
            </div>
          </div>
        )}

        <div style={s.card}>
          <div style={s.orderHead}>
            <div>
              <div style={s.cardTitle}>Order History</div>
              <div style={s.orderHint}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</div>
            </div>
            <button style={s.linkBtn} onClick={() => navigate('/orders')}>View All</button>
          </div>
          {orders.length === 0 ? (
            <div style={s.orderEmpty}>No orders yet. Your placed orders will appear here.</div>
          ) : (
            orders.slice(0, 2).map((order) => (
              <div key={order.id} style={s.orderCard} onClick={() => navigate('/orders')}>
                <div>
                  <div style={s.orderId}>Order #{order.id}</div>
                  <div style={s.orderMeta}>{order.item_count} item{order.item_count !== 1 ? 's' : ''} • {order.status}</div>
                </div>
                <div style={s.orderTotal}>₹{order.total.toLocaleString('en-IN')}</div>
              </div>
            ))
          )}
        </div>

        <div style={s.card}>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </>
  )
}

function profileCompletion(form) {
  const values = [form.full_name, form.pincode, form.farming_type, form.landsize_acres]
  const filled = values.filter((value) => String(value || '').trim() !== '').length
  return Math.round((filled / values.length) * 100)
}

const s = {
  hero: { background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', padding: '32px 20px 24px', textAlign: 'center' },
  avatar: { width: 76, height: 76, background: 'rgba(255,255,255,.18)', borderRadius: '50%', border: '3px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', fontFamily: 'Poppins,sans-serif', fontWeight: 700, color: '#fff', letterSpacing: 1 },
  name: { color: '#fff', fontFamily: 'Poppins,sans-serif', fontSize: 19, fontWeight: 700 },
  phone: { color: 'rgba(255,255,255,.75)', fontSize: 13, marginTop: 4 },
  roleBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 10, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' },
  card: { background: '#fff', margin: '14px 16px 0', borderRadius: 12, overflow: 'hidden', border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)', padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: 800, color: '#1B2B1C', marginBottom: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: '#3D5140' },
  disabledInput: { background: '#F2F7F2', color: '#6B836D' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, fontWeight: 700, color: '#1B2B1C' },
  summaryValue: { fontSize: 14, fontWeight: 800, color: '#2E7D32' },
  progressTrack: { height: 10, background: '#E8F5E9', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#43A047,#66BB6A)' },
  summaryHint: { fontSize: 12, color: '#6B836D', lineHeight: 1.5, marginTop: 10 },
  orderHead: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  quickLink: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' },
  orderHint: { fontSize: 12, color: '#6B836D' },
  linkBtn: { background: 'transparent', border: 'none', color: '#2E7D32', fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  orderEmpty: { fontSize: 12, color: '#6B836D' },
  orderCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #EEF4EE', cursor: 'pointer' },
  orderId: { fontSize: 13, fontWeight: 700, color: '#1B2B1C' },
  orderMeta: { fontSize: 11, color: '#6B836D', marginTop: 4 },
  orderTotal: { fontSize: 13, fontWeight: 800, color: '#2E7D32' },
  logoutBtn: { width: '100%', background: 'transparent', border: 'none', color: '#C62828', fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '6px 0' },
}
