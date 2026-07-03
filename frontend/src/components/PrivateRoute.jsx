import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { apiRequest } from '../services/api';
import { clearSession, getToken, saveSession } from '../services/auth';

function PrivateRoute({ children }) {
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      try {
        const token = getToken();

        if (!token) {
          clearSession();

          if (active) {
            setAllowed(false);
            setChecking(false);
          }

          return;
        }

        const result = await apiRequest('/auth/me');

        if (result?.data) {
          saveSession({
            token,
            user: result.data,
          });
        }

        if (active) {
          setAllowed(true);
          setChecking(false);
        }
      } catch (error) {
        clearSession();

        if (active) {
          setAllowed(false);
          setChecking(false);
        }
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="route-loading">
        <strong>Flowtatoo</strong>
        <span>Validando sessao...</span>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default PrivateRoute;