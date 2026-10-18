import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo-narrow/600.css';
import '@fontsource/archivo-narrow/700.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/500-italic.css';
import { App } from './App.tsx';
import { Login } from './Login.tsx';
import { Cargar } from './Cargar.tsx';
import { Inventario } from './Inventario.tsx';
import { Cajas } from './Cajas.tsx';
import { Reemplazar } from './Reemplazar.tsx';
import { Ilustradores } from './Ilustradores.tsx';
import { Pokedex } from './Pokedex.tsx';
import { usePath } from './router.ts';
import './styles.css';

// the way in has its own address (login-en-arma); Cargar and Mi inventario theirs (cargar-e-inventario-en-arma)
function Root() {
  const path = usePath();
  if (path.startsWith('/entrar')) return <Login />;
  if (path === '/cargar') return <Cargar />;
  if (path === '/inventario') return <Inventario />;
  if (path === '/cajas') return <Cajas />;
  if (path === '/reemplazar') return <Reemplazar />;
  // ilustradores-y-pokedex-en-arma: their lists and, below them, one illustrator, one region or one Pokémon
  if (path === '/ilustradores' || path.startsWith('/ilustradores/')) return <Ilustradores />;
  if (path === '/pokedex' || path.startsWith('/pokedex/')) return <Pokedex />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
