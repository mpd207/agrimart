import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import { useAuthStore } from '../context/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [tab, setTab]         = useState('password') // 'password' | 'otp'
  const [mobile, setMobile]   = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp]         = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!mobile || !password) return toast.error('Enter mobile and password')
    setLoading(true)
    try {
      const { data } = await authApi.login(mobile, password)
      setAuth(data.access_token, { id: data.user_id, full_name: data.full_name, mobile: data.mobile })
      toast.success('Welcome back!')
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  async function handleRequestOtp(e) {
    e.preventDefault()
    if (!mobile) return toast.error('Enter your mobile number')
    setLoading(true)
    try {
      const { data } = await authApi.requestOtp(mobile)
      setOtpSent(true)
      // In dev the OTP is returned in response
      toast.success(`OTP sent! (dev: ${data.dev_otp})`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otp) return toast.error('Enter the OTP')
    setLoading(true)
    try {
      const { data } = await authApi.verifyOtp(mobile, otp)
      setAuth(data.access_token, { id: data.user_id, full_name: data.full_name, mobile: data.mobile })
      toast.success('Logged in!')
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'OTP verification failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.logoRing}>
        <div style={styles.logoCore}>🌾</div>
      </div>
      <h1 style={styles.title}>AgriMart</h1>
      <p style={styles.sub}>India's Farmer Marketplace</p>

      <div style={styles.card}>
        {/* Tabs */}
        <div style={styles.tabRow}>
          <button style={{...styles.tabBtn, ...(tab==='password' ? styles.tabActive : {})}} onClick={()=>setTab('password')}>Password</button>
          <button style={{...styles.tabBtn, ...(tab==='otp'      ? styles.tabActive : {})}} onClick={()=>setTab('otp')}>OTP Login</button>
        </div>

        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <input className="inp" style={{marginBottom:10}} type="tel"      placeholder="Mobile number"  value={mobile}   onChange={e=>setMobile(e.target.value)} />
            <input className="inp" style={{marginBottom:16}} type="password" placeholder="Password"       value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'LOGIN'}</button>
          </form>
        )}

        {tab === 'otp' && !otpSent && (
          <form onSubmit={handleRequestOtp}>
            <input className="inp" style={{marginBottom:16}} type="tel" placeholder="Mobile number" value={mobile} onChange={e=>setMobile(e.target.value)} />
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Sending…' : 'SEND OTP'}</button>
          </form>
        )}

        {tab === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <p style={styles.otpHint}>OTP sent to {mobile}</p>
            <input className="inp" style={{marginBottom:16, letterSpacing:6, fontSize:20, textAlign:'center'}} type="text" placeholder="— — — — — —" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} />
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Verifying…' : 'VERIFY & LOGIN'}</button>
            <button type="button" className="btn-outline" style={{marginTop:8}} onClick={()=>setOtpSent(false)}>← Change number</button>
          </form>
        )}

        <p style={styles.signupPrompt}>
          No account?{' '}
          <span style={styles.link} onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrap:      { display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 20px 30px', background:'linear-gradient(160deg,#1B5E20 0%,#2E7D32 55%,#388E3C 100%)', minHeight:'100%' },
  logoRing:  { width:96, height:96, background:'rgba(255,255,255,0.12)', borderRadius:'50%', border:'3px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 },
  logoCore:  { width:74, height:74, background:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 },
  title:     { color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:28, fontWeight:700, letterSpacing:.5, marginBottom:4 },
  sub:       { color:'rgba(255,255,255,.65)', fontSize:13, marginBottom:28 },
  card:      { background:'rgba(255,255,255,.97)', borderRadius:24, padding:26, width:'100%' },
  tabRow:    { display:'flex', gap:8, marginBottom:20 },
  tabBtn:    { flex:1, background:'transparent', border:'1.5px solid #DDE8DD', borderRadius:10, padding:'9px 0', fontSize:13, fontWeight:700, color:'#6B836D', cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  tabActive: { background:'#2E7D32', borderColor:'#2E7D32', color:'#fff' },
  otpHint:   { fontSize:13, color:'#6B836D', marginBottom:14, textAlign:'center' },
  signupPrompt: { textAlign:'center', fontSize:12, color:'#9EB0A0', marginTop:14 },
  link:      { color:'#2E7D32', fontWeight:700, cursor:'pointer' },
}
