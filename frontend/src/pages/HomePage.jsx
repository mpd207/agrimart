import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marketApi, seedsApi } from '../api'
import { useAuthStore } from '../context/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const [prices, setPrices] = useState([])
  const [seeds,  setSeeds]  = useState([])

  useEffect(() => {
    marketApi.getPrices().then(r => setPrices(r.data.slice(0, 4))).catch(() => {})
    seedsApi.getAll().then(r => setSeeds(r.data.slice(0, 5))).catch(() => {})
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning 🌾'
    if (h < 17) return 'Good Afternoon ☀️'
    return 'Good Evening 🌙'
  }

  return (
    <div style={{flex:1, overflowY:'auto', overflowX:'hidden'}} className="page-scroll">
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroTop}>
          <div>
            <div style={s.greeting}>{greeting()}</div>
            <div style={s.heroName}>Welcome, {user?.full_name?.split(' ')[0] || 'Farmer'}</div>
            <div style={s.heroSub}>{user?.mobile}</div>
          </div>
          <button style={s.notifBtn}>🔔</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Quick menu */}
        <div style={s.quickGrid}>
          {[
            { icon:'📈', label:'Market Prices', path:'/market',  bg:'#E8F5E9' },
            { icon:'🌱', label:'Seeds',          path:'/seeds',   bg:'#F1F8E9' },
            { icon:'🧪', label:'Fertilizers',   path:'/fertilizers', bg:'#FFF8E1' },
            { icon:'👤', label:'My Profile',    path:'/profile', bg:'#E3F2FD' },
          ].map(item => (
            <div key={item.path} style={s.qmItem} onClick={() => navigate(item.path)}>
              <div style={{...s.qmIcon, background: item.bg}}>{item.icon}</div>
              <span style={s.qmLabel}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Live prices */}
        <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontFamily:'Poppins,sans-serif',fontSize:15,color:'#1B2B1C',fontWeight:600}}>Live Prices</h3>
          <span style={{color:'#2E7D32',fontSize:12,fontWeight:700,cursor:'pointer'}} onClick={() => navigate('/market')}>See all →</span>
        </div>
        <div style={s.priceGrid}>
          {prices.length === 0
            ? [1,2,3,4].map(i => <div key={i} style={s.priceCardSkel}/>)
            : prices.map(p => (
              <div key={p.id} style={s.priceCard}>
                <div style={s.cropName}>{p.emoji} {p.commodity.toUpperCase()}</div>
                <div style={s.priceVal}>₹{p.price.toLocaleString('en-IN')}</div>
                <div style={s.priceUnit}>{p.unit}</div>
                <div style={{...s.priceChg, color: p.change_percent >= 0 ? '#66BB6A' : '#C62828'}}>
                  {p.change_percent >= 0 ? '▲' : '▼'} {p.change_percent >= 0 ? '+' : ''}{p.change_percent}%
                </div>
              </div>
            ))
          }
        </div>

        {/* Featured seeds */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontFamily:'Poppins,sans-serif',fontSize:15,color:'#1B2B1C',fontWeight:600}}>Featured Seeds</h3>
          <span style={{color:'#2E7D32',fontSize:12,fontWeight:700,cursor:'pointer'}} onClick={() => navigate('/seeds')}>See all →</span>
        </div>
        <div style={s.featScroll}>
          {seeds.map(seed => (
            <div key={seed.id} style={s.featCard} onClick={() => navigate(`/seeds/${seed.id}`)}>
              <div style={s.featImg}>{seed.emoji}</div>
              <div style={s.featBody}>
                <div style={s.featName}>{seed.name}</div>
                <div style={s.featPrice}>₹{seed.price_per_kg}/{seed.unit}</div>
                <div style={s.featVar}>{seed.variety}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo banner */}
        <div style={s.promoBanner} onClick={() => navigate('/seeds')}>
          <div>
            <div style={s.promoTitle}>🌿 Boost Marketplace</div>
            <div style={s.promoSub}>Buy premium quality seeds directly from nurseries</div>
          </div>
          <div style={{color:'#fff',fontSize:24}}>›</div>
        </div>
      </div>
    </div>
  )
}

const s = {
  hero:       { background:'linear-gradient(135deg,#1B5E20 0%,#2E7D32 100%)', padding:'22px 20px 36px', flexShrink:0 },
  heroTop:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  greeting:   { color:'rgba(255,255,255,.7)', fontSize:13, marginBottom:2 },
  heroName:   { color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:22, fontWeight:700 },
  heroSub:    { color:'rgba(255,255,255,.6)', fontSize:12, marginTop:2 },
  notifBtn:   { background:'rgba(255,255,255,.15)', border:'none', borderRadius:10, width:36, height:36, color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  body:       { marginTop:-20, borderRadius:'22px 22px 0 0', background:'#F2F7F2', padding:'20px 16px 16px' },
  quickGrid:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 },
  qmItem:     { display:'flex', flexDirection:'column', alignItems:'center', gap:7, cursor:'pointer' },
  qmIcon:     { width:54, height:54, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 2px 12px rgba(27,94,32,0.08)' },
  qmLabel:    { fontSize:11, fontWeight:700, color:'#3D5140', textAlign:'center', lineHeight:1.2 },
  priceGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 },
  priceCard:  { background:'#fff', borderRadius:12, padding:'13px 14px', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)' },
  priceCardSkel: { background:'#e8f5e9', borderRadius:12, height:88, animation:'pulse 1.4s ease-in-out infinite' },
  cropName:   { fontSize:12, color:'#6B836D', fontWeight:700, marginBottom:5 },
  priceVal:   { fontFamily:'Poppins,sans-serif', fontSize:19, color:'#1B2B1C', fontWeight:700 },
  priceUnit:  { fontSize:10, color:'#9EB0A0', fontWeight:600 },
  priceChg:   { fontSize:11, fontWeight:800, marginTop:5 },
  featScroll: { display:'flex', gap:12, overflowX:'auto', paddingBottom:8, marginBottom:20, scrollbarWidth:'none' },
  featCard:   { background:'#fff', borderRadius:12, minWidth:138, overflow:'hidden', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)', cursor:'pointer', flexShrink:0 },
  featImg:    { height:88, background:'#E8F5E9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38 },
  featBody:   { padding:10 },
  featName:   { fontSize:13, fontWeight:700, color:'#1B2B1C' },
  featPrice:  { fontSize:13, color:'#2E7D32', fontWeight:800, marginTop:3 },
  featVar:    { fontSize:10, color:'#9EB0A0' },
  promoBanner:{ background:'linear-gradient(135deg,#2E7D32,#1B5E20)', borderRadius:18, padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' },
  promoTitle: { color:'#fff', fontWeight:700, fontSize:14, marginBottom:4 },
  promoSub:   { color:'rgba(255,255,255,.75)', fontSize:12 },
}
