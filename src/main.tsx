import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { OrgAuthProvider } from './contexts/OrgAuthContext'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <OrgAuthProvider>
        <App />
      </OrgAuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
