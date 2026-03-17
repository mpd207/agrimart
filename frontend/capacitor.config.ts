import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agrimart.app',
  appName: 'AgriMart',
  webDir: 'dist',
  server: {
    // During development on a real device connected to same WiFi,
    // replace with your PC's local IP: e.g. http://192.168.1.10:5173
    // For production, this is removed and the built files are bundled.
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1B5E20',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1B5E20',
    },
  },
};

export default config;
