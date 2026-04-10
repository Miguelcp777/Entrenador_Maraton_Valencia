import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AthleteProvider } from './context/AthleteContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AthleteProvider>
      <App />
    </AthleteProvider>
  </StrictMode>,
)
