import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../services/api';

function AlertSummaryPanel() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadSummary() {
    try {
      setLoading(true);
      const result = await apiRequest('/alerts/summary');
      setSummary(result.data || null);
    } catch (error) {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const criticalCount = summary?.criticalCount || 0;

  return (
    <section className={criticalCount > 0 ? 'dashboard-alert-panel has-alerts' : 'dashboard-alert-panel'}>
      <div className="dashboard-alert-header">
        <div>
          <span>Monitoramento comercial</span>
          <h2>Alertas do CRM</h2>
          <p>
            Visão rápida de leads quentes, follow-ups vencidos, oportunidades em fechamento
            e propostas em negociação.
          </p>
        </div>

        <button type="button" className="ghost-button" onClick={() => navigate('/alertas')}>
          Ver central
        </button>
      </div>

      <div className="dashboard-alert-grid">
        <button type="button" onClick={() => navigate('/alertas')}>
          <span>Críticos</span>
          <strong>{loading ? '...' : criticalCount}</strong>
          <small>Total de pontos de atenção</small>
        </button>

        <button type="button" onClick={() => navigate('/leads')}>
          <span>Leads quentes</span>
          <strong>{loading ? '...' : summary?.hotLeads || 0}</strong>
          <small>Prioridade comercial alta</small>
        </button>

        <button type="button" onClick={() => navigate('/atividades')}>
          <span>Atividades vencidas</span>
          <strong>{loading ? '...' : summary?.overdueActivities || 0}</strong>
          <small>Follow-ups que precisam de ação</small>
        </button>

        <button type="button" onClick={() => navigate('/propostas')}>
          <span>Propostas</span>
          <strong>{loading ? '...' : summary?.proposalsInNegotiation || 0}</strong>
          <small>Em negociação ou aguardando retorno</small>
        </button>
      </div>
    </section>
  );
}

export default AlertSummaryPanel;
