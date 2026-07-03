import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import PermissionRoute from './components/PermissionRoute';
import Login from './pages/Login';
import TattooDashboard from './pages/TattooDashboard';
import TattooAgenda from './pages/TattooAgenda';
import TattooClientes from './pages/TattooClientes';
import TattooArtistas from './pages/TattooArtistas';
import TattooBI from './pages/TattooBI';
import Configuracoes from './pages/Configuracoes';
import Alertas from './pages/Alertas';
import AcessoNegado from './pages/AcessoNegado';

function protectedPage(element) {
  return <PrivateRoute>{element}</PrivateRoute>;
}

function permittedPage(path, element) {
  return <PermissionRoute path={path}>{element}</PermissionRoute>;
}

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
