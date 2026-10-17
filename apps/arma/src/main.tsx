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
import { Cargar } from './Cargar.tsx';
import { Inventario } from './Inventario.tsx';
import { usePath } from './router.ts';
import './styles.css';

// the way in has its own address (login-en-arma); Cargar and Mi inventario theirs (cargar-e-inventario-en-arma)
function Root() {
  const path = usePath();
  if (path.startsWith('/entrar')) return <Login />;
  if (path === '/cargar') return <Cargar />;
  if (path === '/inventario') return <Inventario />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
