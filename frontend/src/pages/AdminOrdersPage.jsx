import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { ordersApi } from '../api'

const STATUS_OPTIONS = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      const { data } = await ordersApi.getAdminAll()
      setOrders(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load admin orders')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId, status) {
    try {
      setBusyOrderId(orderId)
      const { data } = await ordersApi.updateStatus(orderId, status)
      setOrders((current) => current.map((order) => (
        order.id === orderId ? { ...order, ...data } : order
      )))
      toast.success(`Order #${orderId} moved to ${status}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update order')
    } finally {
      setBusyOrderId(null)
    }
  }

  const totals = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length,
    shipped: orders.filter((order) => order.status === 'Shipped').length,
  }), [orders])

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>←</button>
        <h2>Admin Orders</h2>
        <button style={s.refreshBtn} onClick={loadOrders}>Refresh</button>
      </div>

      <div className="page-scroll" style={{ flex: 1, paddingTop: 10 }}>
        <div style={s.summaryGrid}>
          <SummaryCard label="Total Orders" value={totals.total} />
          <SummaryCard label="Active" value={totals.active} />
          <SummaryCard label="Shipped" value={totals.shipped} />
        </div>

        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div style={s.empty}>No customer orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={s.card}>
              <div style={s.topRow}>
                <div>
                  <div style={s.orderTitle}>Order #{order.id}</div>
                  <div style={s.meta}>Farmer ID {order.user_id} • {order.item_count} items</div>
                </div>
                <div style={s.statusChip}>{order.status}</div>
              </div>

              <div style={s.metaRow}>
                <span>{new Date(order.created_at).toLocaleString('en-IN')}</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>

              <div style={s.items}>
                {order.items.map((item) => (
                  <div key={item.id} style={s.itemRow}>
                    <span>{item.item_emoji || '🌾'} {item.item_name}</span>
                    <span>{item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div style={s.actionRow}>
                <select
                  className="inp"
                  value={order.status}
                  disabled={busyOrderId === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}

        <div style={{ height: 20 }} />
      </div>
    </>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={s.summaryCard}>
      <div style={s.summaryLabel}>{label}</div>
      <div style={s.summaryValue}>{value}</div>
    </div>
  )
}

const s = {
  refreshBtn: { background: 'transparent', border: 'none', color: '#2E7D32', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '0 16px 12px' },
  summaryCard: { background: '#F8FBF8', borderRadius: 12, padding: 12, border: '1px solid #E1ECE2' },
  summaryLabel: { fontSize: 11, color: '#6B836D' },
  summaryValue: { fontSize: 18, color: '#1B2B1C', fontWeight: 800, marginTop: 6 },
  card: { background: '#fff', margin: '0 16px 12px', borderRadius: 14, padding: 16, border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  orderTitle: { fontSize: 15, fontWeight: 800, color: '#1B2B1C' },
  meta: { fontSize: 11, color: '#6B836D', marginTop: 4 },
  statusChip: { background: '#E8F5E9', color: '#2E7D32', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 },
  metaRow: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#49614B', marginTop: 12 },
  items: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  itemRow: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#1B2B1C', paddingTop: 8, borderTop: '1px solid #EEF4EE' },
  actionRow: { marginTop: 14 },
  empty: { margin: '0 16px', padding: 20, textAlign: 'center', background: '#fff', borderRadius: 12, color: '#6B836D', border: '1px solid #DDE8DD' },
}
