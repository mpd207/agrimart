import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { notificationsApi } from '../api'

const COMMODITIES = ['wheat', 'rice', 'cotton', 'maize', 'soy', 'onion']

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ commodity: 'wheat', target_price: '', direction: 'above' })

  async function loadAll() {
    try {
      setLoading(true)
      const [notificationRes, alertRes] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getAlerts(),
      ])
      setNotifications(notificationRes.data)
      setAlerts(alertRes.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleMarkRead(id) {
    try {
      const { data } = await notificationsApi.markRead(id)
      setNotifications((current) => current.map((item) => item.id === id ? data : item))
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  async function handleCreateAlert(e) {
    e.preventDefault()
    try {
      const payload = {
        commodity: form.commodity,
        target_price: Number(form.target_price),
        direction: form.direction,
      }
      const { data } = await notificationsApi.createAlert(payload)
      setAlerts((current) => [data, ...current])
      setForm({ commodity: form.commodity, target_price: '', direction: form.direction })
      toast.success('Price alert created')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create alert')
    }
  }

  async function handleDeleteAlert(id) {
    try {
      await notificationsApi.deleteAlert(id)
      setAlerts((current) => current.filter((alert) => alert.id !== id))
    } catch {
      toast.error('Failed to delete alert')
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>Notifications</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="page-scroll" style={{ flex: 1, paddingTop: 10 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Price Alerts</div>
          <form onSubmit={handleCreateAlert} style={s.form}>
            <select className="inp" value={form.commodity} onChange={(e) => setForm((current) => ({ ...current, commodity: e.target.value }))}>
              {COMMODITIES.map((commodity) => (
                <option key={commodity} value={commodity}>{commodity}</option>
              ))}
            </select>
            <input className="inp" type="number" min="1" placeholder="Target price" value={form.target_price} onChange={(e) => setForm((current) => ({ ...current, target_price: e.target.value }))} />
            <select className="inp" value={form.direction} onChange={(e) => setForm((current) => ({ ...current, direction: e.target.value }))}>
              <option value="above">Notify when above</option>
              <option value="below">Notify when below</option>
            </select>
            <button className="btn-primary" type="submit">Create Alert</button>
          </form>

          <div style={s.alertList}>
            {alerts.map((alert) => (
              <div key={alert.id} style={s.alertRow}>
                <div>
                  <div style={s.alertTitle}>{alert.commodity.toUpperCase()} {alert.direction === 'above' ? 'above' : 'below'} ₹{alert.target_price}</div>
                  <div style={s.alertMeta}>{alert.is_enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                <button style={s.deleteBtn} onClick={() => handleDeleteAlert(alert.id)}>Delete</button>
              </div>
            ))}
            {!alerts.length && <div style={s.emptyLine}>No active alerts yet.</div>}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Inbox</div>
          {loading ? (
            <div className="spinner" />
          ) : notifications.length === 0 ? (
            <div style={s.emptyLine}>No notifications yet.</div>
          ) : (
            notifications.map((item) => (
              <div key={item.id} style={{ ...s.notificationRow, ...(item.is_read ? s.readRow : {}) }}>
                <div style={{ flex: 1 }}>
                  <div style={s.notificationTitle}>{item.title}</div>
                  <div style={s.notificationMessage}>{item.message}</div>
                  <div style={s.notificationMeta}>{new Date(item.created_at).toLocaleString('en-IN')}</div>
                </div>
                {!item.is_read && <button style={s.readBtn} onClick={() => handleMarkRead(item.id)}>Mark Read</button>}
              </div>
            ))
          )}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </>
  )
}

const s = {
  card: { background: '#fff', margin: '0 16px 12px', borderRadius: 12, padding: 16, border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)' },
  cardTitle: { fontSize: 15, fontWeight: 800, color: '#1B2B1C', marginBottom: 14 },
  form: { display: 'grid', gap: 10 },
  alertList: { marginTop: 14, display: 'grid', gap: 10 },
  alertRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 10, borderTop: '1px solid #EEF4EE' },
  alertTitle: { fontSize: 13, fontWeight: 700, color: '#1B2B1C' },
  alertMeta: { fontSize: 11, color: '#6B836D', marginTop: 4 },
  deleteBtn: { background: 'transparent', border: 'none', color: '#C62828', fontWeight: 700, cursor: 'pointer' },
  emptyLine: { fontSize: 12, color: '#6B836D' },
  notificationRow: { display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #EEF4EE' },
  readRow: { opacity: 0.72 },
  notificationTitle: { fontSize: 13, fontWeight: 700, color: '#1B2B1C' },
  notificationMessage: { fontSize: 12, color: '#3D5140', marginTop: 4, lineHeight: 1.5 },
  notificationMeta: { fontSize: 11, color: '#6B836D', marginTop: 6 },
  readBtn: { background: '#E8F5E9', border: 'none', color: '#2E7D32', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer', height: 'fit-content' },
}
