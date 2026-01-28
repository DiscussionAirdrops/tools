import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWrapper from './AppWrapper.jsx'
import './index.css' // Penting: Ini memuat Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
