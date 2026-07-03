import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../services/api';
import {
  getReadAlertIds,
  markAlertRead,
  markAlertsRead,
  subscribeToAlertChanges,
} from '../services/alertStorage';

const ALERT_REFRESH_MS = 120000;

function formatDueAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AlertBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => getReadAlertIds());

  async function loadAlerts() {
    if (requestInFlightRef.current || document.hidden) return;

    try {
      requestInFlightRef.current = true;
      setLoading(true);
      const result = await apiRequest('/alerts/details');
      setAlerts(result.data?.alerts || []);
    } catch (error) {
      setAlerts([]);
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    const interval = window.setInterval(loadAlerts, ALERT_REFRESH_MS);
    const handleVisibilityChange = () => {
      if (!document.hidden) loadAlerts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (open && alerts.length === 0) loadAlerts();
  }, [open]);

  useEffect(() => subscribeToAlertChanges(() => setReadIds(getReadAlertIds())), []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadAlerts = useMemo(() => alerts.filter((alert) => !readIds.has(alert.id)), [alerts, readIds]);
  const previewAlerts = unreadAlerts.length > 0 ? unreadAlerts.slice(0, 5) : alerts.slice(0, 5);
  const unreadCount = unreadAlerts.length;

  function openAlert(alert) {
    markAlertRead(alert.id);
    setReadIds(getReadAlertIds());
    setOpen(false);
    navigate(alert.actionPath || '/alertas');
  }

  function markAll() {
    markAlertsRead(alerts.map((alert) => alert.id));
    setReadIds(getReadAlertIds());
  }

  return (
    <div className="tattoo-notification" ref={wrapperRef}>
      <button
        type="button"
        className={unreadCount > 0 ? 'tattoo-bell-button has-unread' : 'tattoo-bell-button'}
        onClick={() => setOpen((current) => !current)}
        aria-label={`Alertas${unreadCount ? `, ${unreadCount} não lidos` : ''}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="tattoo-notification-popover">
          <div className="tattoo-notification-head">
            <div>
              <span>Central do estúdio</span>
              <strong>Alertas</strong>
            </div>
            {unreadCount > 0 && <button type="button" onClick={markAll}>Ler todos</button>}
          </div>

          <div className="tattoo-notification-list">
            {loading && alerts.length === 0 && <p className="tattoo-notification-empty">Carregando alertas...</p>}
            {!loading && previewAlerts.length === 0 && (
              <div className="tattoo-notification-empty is-success">
                <strong>Tudo em dia</strong>
                <span>Não há alertas pendentes no momento.</span>
              </div>
            )}
            {previewAlerts.map((alert) => (
              <button
                type="button"
                className={`tattoo-notification-item severity-${alert.severity} ${readIds.has(alert.id) ? 'is-read' : ''}`}
                key={alert.id}
                onClick={() => openAlert(alert)}
              >
                <i />
                <span>
                  <strong>{alert.title}</strong>
                  <small>{alert.message}</small>
                  <em>{formatDueAt(alert.dueAt)}</em>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="tattoo-notification-footer"
            onClick={() => {
              setOpen(false);
              navigate('/alertas');
            }}
          >
            Ver todos os alertas
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AlertBell;
