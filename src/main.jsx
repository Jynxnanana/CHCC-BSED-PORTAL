import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './login.css'
import './admin.css'
import './features.css'
import './services.css'
import './readability.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
