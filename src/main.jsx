import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

import { PatientProvider } from './context/PatientContext.jsx'
import { LicenseProvider } from './context/LicenseContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'

import { AppointmentProvider } from './context/AppointmentContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <LicenseProvider>
          <PatientProvider>
            <AppointmentProvider>
              <App />
            </AppointmentProvider>
          </PatientProvider>
        </LicenseProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
