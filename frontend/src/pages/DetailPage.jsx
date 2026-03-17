import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { seedsApi, fertilizersApi } from '../api'
import { useCartStore } from '../context/cartStore'
import { useAuthStore } from '../context/authStore'

export default function DetailPage({ itemType }) {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const token      = useAuthStore((s) => s.token)
  const addItem    = useCartStore((s) => s.addItem)
  const [item, setItem]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty]       = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const fetcher = itemType === 'seed' ? seedsApi.getById : fertilizersApi.getById
    fetcher(id)
      .then(r => setItem(r.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id, itemType, navigate])

  async function handleAddToCart() {
    if (!token) { toast.error('Please login to add items to cart'); navigate('/login'); return }
    setAdding(true)
    try {
      await addItem(itemType === 'seed' ? 'seed' : 'fertilizer', item.id, qty)
      toast.success(`${item.name} added to cart 🛒`)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add to cart')
    } finally { setAdding(false) }
  }

  const backPath = itemType === 'seed' ? '/seeds' : '/fertilizers'

  if (loading) return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(backPath)}>←</button>
        <h2>Loading…</h2>
        <div style={{width:34}}/>
      </div>
      <div className="spinner" />
    </>
  )

  if (!item) return null

  const price = itemType === 'seed' ? item.price_per_kg : item.price_per_bag
  const stockNum = item.stock
  const stockCls = stockNum > 300 ? 'stock-hi' : stockNum >= 100 ? 'stock-mid' : 'stock-lo'
  const stockLbl = stockNum > 300 ? `In Stock (${stockNum} ${itemType === 'seed' ? 'kg' : 'bags'})` : stockNum >= 100 ? `Limited (${stockNum})` : `Low Stock (${stockNum})`

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#fff'}}>
      {/* Sticky top bar */}
      <div style={s.topBar}>
        <button style={s.topBtn} onClick={() => navigate(backPath)}>←</button>
        <button style={s.topBtn} onClick={() => navigate('/cart')}>🛒</button>
      </div>

      <div style={{flex:1, overflowY:'auto'}}>
        <div style={s.hero}>{item.emoji}</div>
        <div style={s.body}>
          <div style={s.name}>{itemType === 'seed' ? `${item.name} – ${item.variety}` : item.name}</div>
          <div style={s.subname}>{itemType === 'seed' ? `${item.season} Season · ${item.category}` : `${item.type} Fertilizer`}</div>

          <div style={s.priceRow}>
            <span style={s.price}>₹{price.toLocaleString('en-IN')}</span>
            <span style={s.punit}>/{item.unit}</span>
          </div>

          <div style={s.metaGrid}>
            {itemType === 'seed' ? <>
              <MetaItem label="Season"      value={item.season} />
              <MetaItem label="Stock"       value={`${item.stock} kg`} />
              <MetaItem label="Germination" value={item.germination} />
              <MetaItem label="Harvest"     value={item.harvest_days} />
            </> : <>
              <MetaItem label="NPK Ratio" value={item.npk_ratio} />
              <MetaItem label="Stock"     value={`${item.stock} bags`} />
              <MetaItem label="Type"      value={item.type} />
              <MetaItem label="Pack Size" value={item.unit} />
            </>}
          </div>

          <span className={`stock-badge ${stockCls}`} style={{marginTop:4}}>{stockLbl}</span>

          <p style={s.desc}>{item.description}</p>

          {/* Qty + Add to cart */}
          <div style={s.qtyRow}>
            <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span style={s.qtyVal}>{qty}</span>
            <button style={s.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
            <button
              className="btn-primary"
              style={{flex:1, borderRadius:12}}
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div style={{background:'#F2F7F2',borderRadius:8,padding:'11px 13px'}}>
      <div style={{fontSize:11,color:'#6B836D',marginBottom:4}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,color:'#1B2B1C'}}>{value}</div>
    </div>
  )
}

const s = {
  topBar:  { display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', position:'sticky', top:0, zIndex:50 },
  topBtn:  { background:'#F2F7F2', border:'none', borderRadius:9, width:34, height:34, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  hero:    { height:228, background:'linear-gradient(135deg,#E8F5E9,#C8E6C9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:88 },
  body:    { padding:'20px 18px 24px' },
  name:    { fontFamily:'Poppins,sans-serif', fontSize:20, fontWeight:700, color:'#1B2B1C' },
  subname: { fontSize:13, color:'#6B836D', marginTop:4 },
  priceRow:{ display:'flex', alignItems:'baseline', gap:8, marginTop:14 },
  price:   { fontFamily:'Poppins,sans-serif', fontSize:26, fontWeight:700, color:'#2E7D32' },
  punit:   { fontSize:14, color:'#6B836D' },
  metaGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:18 },
  desc:    { fontSize:13, color:'#3D5140', lineHeight:1.65, marginTop:16 },
  qtyRow:  { display:'flex', alignItems:'center', gap:14, marginTop:22 },
  qtyBtn:  { background:'#F2F7F2', border:'2px solid #DDE8DD', borderRadius:10, width:38, height:38, fontSize:20, fontWeight:800, color:'#2E7D32', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  qtyVal:  { fontSize:18, fontWeight:800, color:'#1B2B1C', minWidth:30, textAlign:'center' },
}
