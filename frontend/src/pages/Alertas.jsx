import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../services/api';
import {
  getReadAlertIds,
  markAlertRead,
  markAlertUnread,
  markAlertsRead,
  subscribeToAlertChanges,
} from '../services/alertStorage';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'Não lidos' },
  { value: 'urgent', label: 'Urgentes' },
  { value: 'appointment', label: 'Agenda' },
  { value: 'confirmation', label: 'Confirmações' },
  { value: 'payment', label: 'Pagamentos' },
  { value: 'birthday', label: 'Aniversários' },
];

const TYPE_LABELS = {
  appointment: 'Agenda',
  confirmation: 'Confirmação',
  payment: 'Pagamento',
  schedule: 'Conflito de agenda',
  birthday: 'Aniversário',
  aftercare: 'Pós-atendimento',
  priority: 'Prioridade',
};

const SEVERITY_LABELS = {
  urgent: 'Urgente',
  warning: 'Atenção',
  info: 'Informativo',
  success: 'Tudo certo',
};

function formatDateTime(value) {
  if (!value) return 'Sem data definida';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Alertas() {
  const navigate = useNavigate();
  const [data, setData] = useState({ summary: {}, alerts: [] });
  const [readIds, setReadIds] = useState(() => getReadAlertIds());
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setMessage('');
      const result = await apiRequest('/alerts/details');
      setData(result.data || { summary: {}, alerts: [] });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar alertas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => subscribeToAlertChanges(() => setReadIds(getReadAlertIds())), []);

  const alerts = data.alerts || [];
  const unreadCount = alerts.filter((alert) => !readIds.has(alert.id)).length;

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'unread') return alerts.filter((alert) => !readIds.has(alert.id));
    if (filter === 'urgent') return alerts.filter((alert) => alert.severity === 'urgent');
    return alerts.filter((alert) => alert.type === filter);
  }, [alerts, filter, readIds]);

  function handleOpen(alert) {
    markAlertRead(alert.id);
    setReadIds(getReadAlertIds());
    navigate(alert.actionPath || '/agenda');
  }

  function toggleRead(alert) {
    if (readIds.has(alert.id)) markAlertUnread(alert.id);
    else markAlertRead(alert.id);
    setReadIds(getReadAlertIds());
  }

  function handleMarkAll() {
    markAlertsRead(alerts.map((alert) => alert.id));
    setReadIds(getReadAlertIds());
  }

  const summary = data.summary || {};

  return (
    <section className="module-page tattoo-alert-center">
      <div className="page-header tattoo-alert-page-header">
        <div>
          <span>MEU ESTÚDIO</span>
          <h1>Central de alertas</h1>
          <p>Horários, confirmações, pagamentos, conflitos de agenda e lembretes importantes reunidos em uma única tela.</p>
        </div>

        <div className="tattoo-alert-page-actions">
          {unreadCount > 0 && (
            <button type="button" className="tattoo-btn ghost" onClick={handleMarkAll}>
              Marcar tudo como lido
            </button>
          )}
          <button type="button" className="tattoo-btn primary" onClick={loadData} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-alert-summary-grid">
        <article className="urgent">
          <span>Urgentes</span>
          <strong>{summary.urgentCount || 0}</strong>
          <p>Precisam de ação agora</p>
        </article>
        <article className="unread">
          <span>Não lidos</span>
          <strong>{unreadCount}</strong>
          <p>Novidades desde sua última leitura</p>
        </article>
        <article className="today">
          <span>Agenda de hoje</span>
          <strong>{summary.todayCount || 0}</strong>
          <p>Atendimentos no dia</p>
        </article>
        <article className="payment">
          <span>Pagamentos</span>
          <strong>{summary.paymentCount || 0}</strong>
          <p>Saldos e sinais em aberto</p>
        </article>
      </section>

      <div className="tattoo-alert-filter-strip" role="tablist" aria-label="Filtros de alertas">
        {FILTERS.map((item) => (
          <button
            type="button"
            key={item.value}
            className={filter === item.value ? 'active' : ''}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            {item.value === 'unread' && unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        ))}
      </div>

      <section className="tattoo-alert-feed">
        {filteredAlerts.map((alert) => {
          const isRead = readIds.has(alert.id);
          return (
            <article
              className={`tattoo-alert-feed-card severity-${alert.severity} ${isRead ? 'is-read' : 'is-unread'}`}
              key={alert.id}
            >
              <div className="tattoo-alert-feed-icon" aria-hidden="true">
                {alert.type === 'payment' && 'R$'}
                {alert.type === 'confirmation' && '✓'}
                {alert.type === 'birthday' && '🎂'}
                {alert.type === 'aftercare' && '♡'}
                {alert.type === 'schedule' && '!'}
                {alert.type === 'priority' && '★'}
                {alert.type === 'appointment' && '◷'}
              </div>

              <div className="tattoo-alert-feed-content">
                <div className="tattoo-alert-feed-labels">
                  <span>{TYPE_LABELS[alert.type] || 'Alerta'}</span>
                  <em>{SEVERITY_LABELS[alert.severity] || alert.severity}</em>
                  {!isRead && <b>Novo</b>}
                </div>
                <h2>{alert.title}</h2>
                <p>{alert.message}</p>
                <small>{formatDateTime(alert.dueAt)}</small>
              </div>

              <div className="tattoo-alert-feed-actions">
                <button type="button" className="tattoo-btn primary" onClick={() => handleOpen(alert)}>
                  {alert.actionLabel || 'Abrir'}
                </button>
                <button type="button" className="tattoo-alert-read-toggle" onClick={() => toggleRead(alert)}>
                  {isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                </button>
              </div>
            </article>
          );
        })}

        {!loading && filteredAlerts.length === 0 && (
          <div className="tattoo-alert-empty-state">
            <div>✓</div>
            <strong>Nenhum alerta neste filtro</strong>
            <p>Sua agenda está organizada por aqui.</p>
          </div>
        )}
      </section>
    </section>
  );
}

export default Alertas;
