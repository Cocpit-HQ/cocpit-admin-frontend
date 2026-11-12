import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { EnvironmentProvider } from './EnvironmentContext'

// In production, route relative /api calls to VITE_API_URL and include cross-site credentials
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
if (API_URL) {
  const originalFetch = window.fetch
  window.fetch = function (url, options = {}) {
    let targetUrl = url
    if (typeof url === 'string' && url.startsWith('/api')) {
      targetUrl = `${API_URL}${url}`
    }
    const finalOptions = { ...options }
    if (typeof targetUrl === 'string' && targetUrl.startsWith(API_URL) && !finalOptions.credentials) {
      finalOptions.credentials = 'include'
    }
    return originalFetch.call(this, targetUrl, finalOptions)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <EnvironmentProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </EnvironmentProvider>
    </ErrorBoundary>
  </StrictMode>,
)

