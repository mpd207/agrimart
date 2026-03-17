import React from 'react'
import ReactDOM from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './assets/global.css'

async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  // Green status bar to match app theme
  try {
    await StatusBar.setBackgroundColor({ color: '#1B5E20' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch (e) {
    // StatusBar plugin not available on all platforms
  }

  // Hide splash once React has mounted
  await SplashScreen.hide()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

initCapacitor()
