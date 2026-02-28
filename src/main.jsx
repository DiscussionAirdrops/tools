import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWrapper from './AppWrapper.jsx'
import './index.css'

// ✅ Ambil Telegram WebApp
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.expand();              // full screen
  tg.enableClosingConfirmation(); // optional: konfirmasi kalau mau close
  console.log("User:", tg.initDataUnsafe?.user);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper telegram={tg} />
  </React.StrictMode>,
)
