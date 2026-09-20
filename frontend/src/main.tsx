import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
// The bundler handles this CSS side-effect import; TypeScript has no module declaration for it.
// @ts-expect-error CSS is loaded by the bundler.
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
