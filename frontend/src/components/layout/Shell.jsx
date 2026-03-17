import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../../context/cartStore'

export function StatusBar() {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="status-bar">
      <span>{time}</span>
      <span>AgriMart</span>
      <span>●●● 4G</span>
    </div>
  )
}

export function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const itemCount = useCartStore((s) => s.itemCount())

  const tabs = [
    { path: '/home',        label: 'Home',    icon: HomeIcon },
    { path: '/market',      label: 'Market',  icon: MarketIcon },
    { path: '/seeds',       label: 'Products',icon: SeedsIcon },
    { path: '/cart',        label: 'Cart',    icon: CartIcon, badge: itemCount },
    { path: '/profile',     label: 'Profile', icon: ProfileIcon },
  ]

  return (
    <div className="tab-bar">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.path)
        return (
          <div key={t.path} className={`tab-item ${active ? 'active' : ''}`} onClick={() => navigate(t.path)}>
            <div className="tab-cart-wrap">
              <t.icon />
              {t.badge > 0 && <span className="cart-bubble">{t.badge}</span>}
            </div>
            <span>{t.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const MarketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const SeedsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
  </svg>
)
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
