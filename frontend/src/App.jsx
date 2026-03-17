import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './context/authStore'
import { StatusBar, TabBar } from './components/layout/Shell'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import HomePage        from './pages/HomePage'
import MarketPage      from './pages/MarketPage'
import SeedsPage       from './pages/SeedsPage'
import FertilizersPage from './pages/FertilizersPage'
import DetailPage      from './pages/DetailPage'
import CartPage        from './pages/CartPage'
import ProfilePage     from './pages/ProfilePage'

const NO_TAB_ROUTES = ['/login', '/register']
const NO_STATUS_ROUTES = ['/login', '/register']

function AppShell() {
  const { pathname } = useLocation()
  const showTab    = !NO_TAB_ROUTES.some(r => pathname.startsWith(r))
  const showStatus = !NO_STATUS_ROUTES.some(r => pathname.startsWith(r))

  return (
    <div className="phone-shell">
      {showStatus && <StatusBar />}
      <div style={{display:'flex', flexDirection:'column', flex:1, overflow:'hidden'}}>
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/home"            element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/market"          element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
          <Route path="/seeds"           element={<ProtectedRoute><SeedsPage /></ProtectedRoute>} />
          <Route path="/seeds/:id"       element={<ProtectedRoute><DetailPage itemType="seed" /></ProtectedRoute>} />
          <Route path="/fertilizers"     element={<ProtectedRoute><FertilizersPage /></ProtectedRoute>} />
          <Route path="/fertilizers/:id" element={<ProtectedRoute><DetailPage itemType="fertilizer" /></ProtectedRoute>} />
          <Route path="/cart"            element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*"                element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      {showTab && <TabBar />}
    </div>
  )
}

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13 },
          success: { iconTheme: { primary: '#2E7D32', secondary: '#fff' } },
        }}
      />
      <AppShell />
    </BrowserRouter>
  )
}
