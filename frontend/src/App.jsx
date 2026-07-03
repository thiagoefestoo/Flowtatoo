import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import PermissionRoute from './components/PermissionRoute';

const Login = lazy(() => import('./pages/Login'));
const TattooDashboard = lazy(() => import('./pages/TattooDashboard'));
const TattooAgenda = lazy(() => import('./pages/TattooAgenda'));
const TattooClientes = lazy(() => import('./pages/TattooClientes'));
const TattooArtistas = lazy(() => import('./pages/TattooArtistas'));
const TattooBI = lazy(() => import('./pages/TattooBI'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Alertas = lazy(() => import('./pages/Alertas'));
const AcessoNegado = lazy(() => import('./pages/AcessoNegado'));

function PageLoader() {
  return (
    <div className="tattoo-route-loader" role="status" aria-live="polite">
      <span />
      <strong>Carregando...</strong>
    </div>
  );
}

function protectedPage(element) {
  return <PrivateRoute>{element}</PrivateRoute>;
}

function permittedPage(path, element) {
  return <PermissionRoute path={path}>{element}</PermissionRoute>;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={protectedPage(<AppLayout />)}>
            <Route index element={<Navigate to="/agenda" replace />} />
            <Route path="dashboard" element={permittedPage('/dashboard', <TattooDashboard />)} />
            <Route path="agenda" element={permittedPage('/agenda', <TattooAgenda />)} />
            <Route path="clientes" element={permittedPage('/clientes', <TattooClientes />)} />
            <Route path="meu-perfil" element={permittedPage('/meu-perfil', <TattooArtistas />)} />
            <Route path="tatuadores" element={<Navigate to="/meu-perfil" replace />} />
            <Route path="bi-gerencial" element={permittedPage('/bi-gerencial', <TattooBI />)} />
            <Route path="configuracoes" element={permittedPage('/configuracoes', <Configuracoes />)} />
            <Route path="alertas" element={permittedPage('/alertas', <Alertas />)} />
            <Route path="acesso-negado" element={<AcessoNegado />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
