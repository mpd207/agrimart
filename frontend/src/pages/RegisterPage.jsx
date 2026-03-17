import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import { useAuthStore } from '../context/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ mobile:'', password:'', full_name:'', pincode:'', farming_type:'', landsize_acres:'' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.mobile) return toast.error('Mobile number is required')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setAuth(data.access_token, { id: data.user_id, full_name: data.full_name, mobile: data.mobile })
      toast.success('Account created!')
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/login')}>←</button>
        <h2 style={styles.title}>Create Account</h2>
        <div style={{width:34}}/>
      </div>
      <div style={styles.body}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={styles.section}>Required</div>
          <input className="inp" type="tel"      placeholder="Mobile number *"  value={form.mobile}   onChange={set('mobile')} />
          <input className="inp" type="password" placeholder="Password"         value={form.password} onChange={set('password')} />

          <div style={styles.section}>Profile (optional)</div>
          <input className="inp" type="text"     placeholder="Full name"        value={form.full_name}     onChange={set('full_name')} />
          <input className="inp" type="text"     placeholder="Pincode"          value={form.pincode}       onChange={set('pincode')} />
          <select className="inp" value={form.farming_type} onChange={set('farming_type')}>
            <option value="">Farming type…</option>
            <option>Cereal</option><option>Vegetable</option>
            <option>Mixed</option><option>Organic</option>
          </select>
          <input className="inp" type="text" placeholder="Land size (acres)" value={form.landsize_acres} onChange={set('landsize_acres')} />

          <button className="btn-primary" type="submit" disabled={loading} style={{marginTop:8}}>
            {loading ? 'Creating account…' : 'SIGN UP'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrap:    { display:'flex', flexDirection:'column', minHeight:'100%', background:'#F2F7F2' },
  header:  { background:'#2E7D32', padding:'15px 18px 13px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  back:    { background:'rgba(255,255,255,0.18)', border:'none', borderRadius:9, width:34, height:34, color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  title:   { color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:17, fontWeight:600 },
  body:    { padding:20, flex:1, overflowY:'auto' },
  section: { fontSize:11, fontWeight:700, color:'#9EB0A0', textTransform:'uppercase', letterSpacing:1, marginTop:4 },
}
