import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
    : '👨‍🌾'

  return (
    <>
      <div style={s.hero}>
        <div style={s.avatar}>{initials}</div>
        <div style={s.name}>{user?.full_name || 'Farmer'}</div>
        <div style={s.phone}>{user?.mobile}</div>
      </div>

      <div className="page-scroll" style={{flex:1}}>
        <ProfileCard rows={[
          { icon:'📦', label:'My Orders',    value:'3 orders →',  onClick: () => {} },
          { icon:'📍', label:'Addresses',    value:'2 saved →',   onClick: () => {} },
          { icon:'🌾', label:'Farming Type', value:'Mixed →',     onClick: () => {} },
          { icon:'📐', label:'Land Size',    value:'4.5 acres →', onClick: () => {} },
        ]}/>

        <ProfileCard rows={[
          { icon:'🔔', label:'Notifications', value:'On →',      onClick: () => {} },
          { icon:'🌐', label:'Language',      value:'English →', onClick: () => {} },
          { icon:'❓', label:'Help & Support',value:'→',         onClick: () => {} },
        ]}/>

        <ProfileCard rows={[
          { icon:'🚪', label:'Logout', labelStyle:{color:'#C62828'}, onClick: handleLogout },
        ]}/>

        <div style={{height:20}}/>
      </div>
    </>
  )
}

function ProfileCard({ rows }) {
  return (
    <div style={s.card}>
      {rows.map((r, i) => (
        <div key={r.label} style={{...s.row, ...(i === rows.length - 1 ? {borderBottom:'none'} : {})}} onClick={r.onClick}>
          <span style={{...s.rowL, ...r.labelStyle}}>{r.icon}  {r.label}</span>
          {r.value && <span style={s.rowR}>{r.value}</span>}
        </div>
      ))}
    </div>
  )
}

const s = {
  hero:   { background:'linear-gradient(135deg,#2E7D32,#1B5E20)', padding:'32px 20px 24px', textAlign:'center' },
  avatar: { width:76, height:76, background:'rgba(255,255,255,.18)', borderRadius:'50%', border:'3px solid rgba(255,255,255,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px', fontFamily:'Poppins,sans-serif', fontWeight:700, color:'#fff', letterSpacing:1 },
  name:   { color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:19, fontWeight:700 },
  phone:  { color:'rgba(255,255,255,.7)', fontSize:13, marginTop:4 },
  card:   { background:'#fff', margin:'14px 16px 0', borderRadius:12, overflow:'hidden', border:'1px solid #DDE8DD', boxShadow:'0 2px 12px rgba(27,94,32,0.08)' },
  row:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #DDE8DD', cursor:'pointer', minHeight:44 },
  rowL:   { display:'flex', alignItems:'center', gap:12, fontSize:14, color:'#1B2B1C', fontWeight:600 },
  rowR:   { fontSize:12, color:'#9EB0A0' },
}
