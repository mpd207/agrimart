import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useCartStore } from '../context/cartStore'
import { useOrdersStore } from '../context/ordersStore'

export default function OrdersPage() {
  const navigate = useNavigate()
  const { orders, loading, fetchOrders, cancelOrder, reorderOrder } = useOrdersStore()
  const fetchCart = useCartStore((s) => s.fetchCart)
  const [busyOrderId, setBusyOrderId] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handleCancel(orderId) {
    try {
      setBusyOrderId(orderId)
      await cancelOrder(orderId)
      toast.success(`Order #${orderId} cancelled`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order')
    } finally {
      setBusyOrderId(null)
    }
  }

  async function handleReorder(orderId) {
    try {
      setBusyOrderId(orderId)
      await reorderOrder(orderId)
      await fetchCart()
      toast.success('Items added back to cart')
      navigate('/cart')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reorder')
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>←</button>
        <h2>My Orders</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="page-scroll" style={{ flex: 1, paddingTop: 10 }}>
        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📦</div>
            <h3 style={s.emptyTitle}>No orders yet</h3>
            <p style={s.emptySub}>Place your first order from the cart to see it here.</p>
            <button className="btn-primary" style={{ maxWidth: 220 }} onClick={() => navigate('/seeds')}>Browse Products</button>
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <div key={order.id} style={s.card}>
                <div style={s.topRow}>
                  <div>
                    <div style={s.orderId}>Order #{order.id}</div>
                    <div style={s.orderMeta}>
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span style={s.status}>{order.status}</span>
                </div>

                <div style={s.summaryGrid}>
                  <Summary label="Items" value={String(order.item_count)} />
                  <Summary label="Subtotal" value={`₹${order.subtotal.toLocaleString('en-IN')}`} />
                  <Summary label="Discount" value={`₹${order.discount.toLocaleString('en-IN')}`} />
                  <Summary label="Total" value={`₹${order.total.toLocaleString('en-IN')}`} strong />
                </div>

                <div style={s.itemList}>
                  {order.items.map((item) => (
                    <div key={item.id} style={s.itemRow}>
                      <div style={s.itemEmoji}>{item.item_emoji || '🌱'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={s.itemName}>{item.item_name}</div>
                        <div style={s.itemSub}>Qty {item.quantity} • {item.item_type}</div>
                      </div>
                      <div style={s.itemTotal}>₹{item.subtotal.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>

                <div style={s.actionRow}>
                  {['Placed', 'Processing'].includes(order.status) && (
                    <button className="btn-outline" style={s.actionBtn} disabled={busyOrderId === order.id} onClick={() => handleCancel(order.id)}>
                      {busyOrderId === order.id ? 'Working...' : 'Cancel'}
                    </button>
                  )}
                  <button className="btn-primary" style={s.actionBtn} disabled={busyOrderId === order.id} onClick={() => handleReorder(order.id)}>
                    {busyOrderId === order.id ? 'Working...' : 'Reorder'}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}
      </div>
    </>
  )
}

function Summary({ label, value, strong }) {
  return (
    <div style={s.summaryCard}>
      <div style={s.summaryLabel}>{label}</div>
      <div style={{ ...s.summaryValue, ...(strong ? s.summaryStrong : {}) }}>{value}</div>
    </div>
  )
}

const s = {
  card: { background: '#fff', margin: '0 16px 12px', borderRadius: 12, padding: 16, border: '1px solid #DDE8DD', boxShadow: '0 2px 12px rgba(27,94,32,0.08)' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: 800, color: '#1B2B1C' },
  orderMeta: { fontSize: 11, color: '#6B836D', marginTop: 4 },
  status: { background: '#E8F5E9', color: '#2E7D32', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  summaryCard: { background: '#F8FBF8', borderRadius: 10, padding: 10, border: '1px solid #E3EEE3' },
  summaryLabel: { fontSize: 11, color: '#6B836D' },
  summaryValue: { fontSize: 14, fontWeight: 700, color: '#1B2B1C', marginTop: 4 },
  summaryStrong: { color: '#2E7D32' },
  itemList: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #EEF4EE' },
  itemEmoji: { width: 36, height: 36, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  itemName: { fontSize: 13, fontWeight: 700, color: '#1B2B1C' },
  itemSub: { fontSize: 11, color: '#6B836D', marginTop: 3, textTransform: 'capitalize' },
  itemTotal: { fontSize: 13, fontWeight: 800, color: '#2E7D32' },
  actionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 },
  actionBtn: { minHeight: 44 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 8 },
  emptyIcon: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 17, color: '#1B2B1C', fontWeight: 700 },
  emptySub: { fontSize: 13, color: '#6B836D', marginBottom: 14, textAlign: 'center', maxWidth: 280 },
}
