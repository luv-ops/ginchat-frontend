
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

//不引入strict mode模式，因为会触发两次useEffect
createRoot(document.getElementById('root')!).render(
  
  <App />
  
)
