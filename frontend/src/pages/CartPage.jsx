import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCartStore } from '../context/cartStore'
import { useAuthStore } from '../context/authStore'

export default function CartPage() {
  const navigate    = useNavigate()
  const token       = useAuthStore((s) => s.token)
  const { cart, loading, fetchCart, updateItem, clearCart } = useCartStore()

  useEffect(() => {
    if (token) fetchCart()
  }, [token, fetchCart])

  async function handleUpdate(cartItemId, qty) {
    try { await updateItem(cartItemId, qty) }
    catch (e) { toast.error('Update failed') }
  }

  async function handleCheckout() {
    try {
      await clearCart()
      toast.success('Order placed successfully! ✅')
    } catch (e) { toast.error('Checkout failed') }
  }

  if (!token) return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>My Cart</h2>
        <div style={{width:34}}/>
      </div>
      <div style={s.empty}>
        <div style={s.emptyIcon}>🛒</div>
        <h3 style={s.emptyTitle}>Please log in</h3>
        <p style={s.emptySub}>Login to view your cart</p>
        <button className="btn-primary" style={{maxWidth:200}} onClick={() => navigate('/login')}>Login</button>
      </div>
    </>
  )

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h2>My Cart</h2>
        <div style={{width:34}}/>
      </div>

      <div className="page-scroll" style={{flex:1, paddingTop:10}}>
        {loading
          ? <div className="spinner" />
          : cart.items.length === 0
            ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🛒</div>
                <h3 style={s.emptyTitle}>Your cart is empty</h3>
                <p style={s.emptySub}>Add seeds or fertilizers to get started</p>
                <button className="btn-primary" style={{maxWidth:200}} onClick={() => navigate('/seeds')}>Shop Now</button>
              </div>
            )
            : <>
              {cart.items.map(item => (
                <div key={item.id} style={s.row}>
                  <div style={s.emoji}>{item.item_emoji}</div>
                  <div style={s.info}>
                    <div style={s.itemName}>{item.item_name}</div>
                    <div style={s.itemSub}>{item.item_type === 'seed' ? 'Premium Seed' : 'Fertilizer'}</div>
                    <div style={s.itemRow}>
                      <div style={s.qtyRow}>
                        <button style={s.qBtn} onClick={() => handleUpdate(item.id, item.quantity - 1)}>−</button>
                        <span style={s.qVal}>{item.quantity}</span>
                        <button style={s.qBtn} onClick={() => handleUpdate(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <div style={s.itemPrice}>₹{item.subtotal.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <button style={s.delBtn} onClick={() => handleUpdate(item.id, 0)}>🗑</button>
                </div>
              ))}

              {/* Summary */}
              <div style={s.summary}>
                <SummaryRow label="Subtotal" value={`₹${cart.subtotal.toLocaleString('en-IN')}`} />
                <SummaryRow label="Delivery" value={`₹${cart.delivery}`} />
                <SummaryRow label="5% Discount" value={`−₹${cart.discount}`} valueStyle={{color:'#66BB6A'}} />
                <div style={s.totalRow}>
                  <span style={s.totalLabel}>Total</span>
                  <span style={s.totalVal}>₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{padding:'0 16px 20px'}}>
                <button className="btn-primary" onClick={handleCheckout}>PROCEED TO CHECKOUT →</button>
              </div>
            </>
        }
      </div>
    </>
  )
}

function SummaryRow({ label, value, valueStyle }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:9,fontSize:14}}>
      <span style={{color:'#3D5140'}}>{label}</span>
      <span style={{fontWeight:700,color:'#1B2B1C',...valueStyle}}>{value}</span>
    </div>
  )
}

const s = {
  row:       { background:'#fff', margin:'0 16px 10px', borderRadius:12, padding:'13px 15px', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', display:'flex', gap:12, alignItems:'flex-start' },
  emoji:     { width:50, height:50, background:'#E8F5E9', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 },
  info:      { flex:1 },
  itemName:  { fontSize:14, fontWeight:700, color:'#1B2B1C' },
  itemSub:   { fontSize:11, color:'#6B836D', marginTop:2 },
  itemRow:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 },
  qtyRow:    { display:'flex', alignItems:'center', gap:8 },
  qBtn:      { background:'#F2F7F2', border:'1.5px solid #DDE8DD', borderRadius:8, width:28, height:28, fontSize:16, fontWeight:800, color:'#2E7D32', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  qVal:      { fontSize:14, fontWeight:800, color:'#1B2B1C' },
  itemPrice: { fontSize:15, fontWeight:800, color:'#2E7D32' },
  delBtn:    { background:'none', border:'none', fontSize:16, color:'#9EB0A0', cursor:'pointer', marginTop:2 },
  summary:   { margin:'6px 16px 16px', background:'#fff', borderRadius:12, padding:16, border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)' },
  totalRow:  { borderTop:'1.5px solid #DDE8DD', paddingTop:11, marginTop:4, display:'flex', justifyContent:'space-between', alignItems:'center' },
  totalLabel:{ fontSize:15, fontWeight:800, color:'#1B2B1C' },
  totalVal:  { fontFamily:'Poppins,sans-serif', fontSize:20, color:'#2E7D32', fontWeight:700 },
  empty:     { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 20px', gap:8 },
  emptyIcon: { fontSize:64, marginBottom:8 },
  emptyTitle:{ fontSize:17, color:'#1B2B1C', fontWeight:700 },
  emptySub:  { fontSize:13, color:'#6B836D', marginBottom:14 },
}
