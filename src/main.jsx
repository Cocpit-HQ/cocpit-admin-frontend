import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { EnvironmentProvider } from './EnvironmentContext'

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

