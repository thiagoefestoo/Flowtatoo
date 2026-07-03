import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';
import { opportunityStageOptions } from '../config/crmOptions';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function Pipeline() {
  const [opportunities, setOpportunities] = useState([]);
  const [message, setMessage] = useState('');

  async function loadOpportunities() {
    try {
      const result = await apiRequest('/opportunities?status=aberta');
      setOpportunities(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  const grouped = useMemo(() => {
    return opportunityStageOptions.reduce((acc, stage) => {
      acc[stage.value] = opportunities.filter((item) => item.stage === stage.value);
      return acc;
    }, {});
  }, [opportunities]);

  const total = opportunities.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo</span>
          <h1>Pipeline</h1>
          <p>
            Visualize as oportunidades abertas por etapa do funil, valor previsto,
            probabilidade e previsão de fechamento.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Oportunidades abertas</span>
          <strong>{opportunities.length}</strong>
          <p>Negociações em andamento</p>
        </article>
        <article>
          <span>Valor em pipeline</span>
          <strong>{formatCurrency(total)}</strong>
          <p>Potencial comercial aberto</p>
        </article>
        <article>
          <span>Ticket médio</span>
          <strong>{formatCurrency(opportunities.length ? total / opportunities.length : 0)}</strong>
          <p>Média por oportunidade</p>
        </article>
        <article>
          <span>Etapas ativas</span>
          <strong>{Object.values(grouped).filter((items) => items.length > 0).length}</strong>
          <p>Funil com movimentação</p>
        </article>
      </section>

      <section className="crm-kanban">
        {opportunityStageOptions
          .filter((stage) => !['ganha', 'perdida'].includes(stage.value))
          .map((stage) => {
            const items = grouped[stage.value] || [];
            const stageValue = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

            return (
              <article className="crm-kanban-column" key={stage.value}>
                <header>
                  <div>
                    <strong>{stage.label}</strong>
                    <span>{items.length} oportunidade(s)</span>
                  </div>
                  <small>{formatCurrency(stageValue)}</small>
                </header>

                <div className="crm-kanban-list">
                  {items.map((item) => (
                    <div className="crm-kanban-card" key={item.id}>
                      <strong>{item.title}</strong>
                      <span>{formatCurrency(item.value)}</span>
                      <p>{item.probability || 0}% de probabilidade</p>
                      <small>{item.expectedCloseDate ? new Date(item.expectedCloseDate).toLocaleDateString('pt-BR') : 'Sem previsão'}</small>
                    </div>
                  ))}

                  {items.length === 0 && <p className="empty-items">Sem oportunidades nesta etapa.</p>}
                </div>
              </article>
            );
          })}
      </section>
    </div>
  );
}

export default Pipeline;
