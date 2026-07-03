import { Navigate, useLocation } from 'react-router-dom';

import { getLoggedUser } from '../services/auth';
import { hasRoutePermission } from '../constants/permissions';

function PermissionRoute({ path, children }) {
  const location = useLocation();
  const user = getLoggedUser();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRoutePermission(user.role, path)) {
    return <Navigate to="/acesso-negado" replace state={{ from: location }} />;
  }

  return children;
}

export default PermissionRoute;