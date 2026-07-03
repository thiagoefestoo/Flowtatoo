import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { getRoleLabel, hasRoutePermission } from '../constants/permissions';
import { clearSession, getLoggedUser } from '../services/auth';
import AlertBell from './AlertBell';

const adminMenuGroups = [
  {
    title: 'Meu estúdio',
    links: [
      { label: 'Agenda', path: '/agenda', icon: '🗓' },
      { label: 'Hoje', path: '/dashboard', icon: '☀' },
      { label: 'Clientes', path: '/clientes', icon: '♡' },
      { label: 'Meu Perfil', path: '/meu-perfil', icon: '✍' },
      { label: 'BI', path: '/bi-gerencial', icon: '◈' },
      { label: 'Ajustes', path: '/configuracoes', icon: '⚙' },
    ],
  },
];

const employeeMenuGroups = adminMenuGroups;

function getPageTitle(pathname) {
  const groups = [...adminMenuGroups, ...employeeMenuGroups];
  const allLinks = groups.flatMap((group) => group.links);
  if (pathname.startsWith('/alertas')) return 'Alertas';
  const current = allLinks.find((link) => pathname.startsWith(link.path));
  return current?.label || 'Flowtatoo';
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getLoggedUser();
  const userRole = user?.role;
  const menuGroups = userRole === 'colaborador' ? employeeMenuGroups : adminMenuGroups;

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="app-layout fp-shell tattoo-shell">
      <aside className="sidebar fp-sidebar tattoo-sidebar">
        <div className="sidebar-brand fp-brand-block tattoo-brand-block">
          <div className="brand-mark fp-brand-mark tattoo-brand-mark"><span>FT</span></div>
          <div>
            <strong>Flowtatoo</strong>
            <small>Agenda pessoal do estúdio</small>
          </div>
        </div>

        <div className="fp-sidebar-pulse tattoo-sidebar-pulse">
          <span>Modo dono do estúdio</span>
          <strong>Agenda, clientes, sinais, alertas e confirmações em uma experiência feita para o seu celular.</strong>
        </div>

        <nav className="sidebar-nav">
          {menuGroups.map((group) => (
            <div className="menu-group" key={group.title}>
              <p>{group.title}</p>
              {group.links
                .filter((link) => hasRoutePermission(userRole, link.path))
                .map((link) => (
                  <NavLink key={link.path} to={link.path} className={({ isActive }) => (isActive ? 'menu-link active' : 'menu-link')}>
                    <i>{link.icon}</i>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user fp-user-card tattoo-user-card">
          <div className="sidebar-user-avatar">{String(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <span>Dono do estúdio</span>
            <strong>{user?.name || 'Usuário'}</strong>
            <small>{getRoleLabel(user?.role)}</small>
          </div>
          <button type="button" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="main-area fp-main-area tattoo-main-area">
        <header className="topbar fp-topbar tattoo-topbar">
          <div>
            <span>Meu Flowtatoo</span>
            <strong>{getPageTitle(location.pathname)}</strong>
          </div>
          <div className="topbar-actions">
            <AlertBell />
            <div className="fp-topbar-chip tattoo-topbar-chip">
              <small>App pessoal</small>
              <strong>agenda ativa</strong>
            </div>
            <div className="topbar-status fp-topbar-status"><span className="status-dot" />Estúdio online</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
