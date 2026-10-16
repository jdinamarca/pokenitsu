import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo-narrow/600.css';
import '@fontsource/archivo-narrow/700.css';
import { App } from './App.tsx';
import { Login } from './Login.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* the way in has its own address (login-en-arma); everything else is the app */}
    {location.pathname.startsWith('/entrar') ? <Login /> : <App />}
  </StrictMode>,
);
