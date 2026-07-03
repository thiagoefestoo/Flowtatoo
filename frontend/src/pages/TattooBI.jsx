import { useEffect, useMemo, useState } from 'react';

import { apiRequest } from '../services/api';

function pad(value) {
  return String(value).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function readable(value) {
  return String(value || '').replaceAll('_', ' ');
}

function TattooBI() {
  const [startDate, setStartDate] = useState(toISODate(addDays(-30)));
  const [endDate, setEndDate] = useState(toISODate(addDays(45)));
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  async function loadBI() {
    try {
      const result = await apiRequest(`/tattoo-dashboard/bi?startDate=${startDate}&endDate=${endDate}`);
      setData(result.data);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar BI.');
    }
  }

  useEffect(() => {
    loadBI();
  }, []);

  const maxDay = useMemo(() => Math.max(1, ...(data?.byDay || []).map((item) => Number(item.total || 0))), [data]);
  const maxRevenue = useMemo(() => Math.max(1, ...(data?.byDay || []).map((item) => Number(item.revenue || 0))), [data]);
  const maxPaid = useMemo(() => Math.max(1, ...(data?.byDay || []).map((item) => Number(item.paid || 0))), [data]);
  const maxStatus = useMemo(() => Math.max(1, ...(data?.byStatus || []).map((item) => Number(item.total || 0))), [data]);
  const maxService = useMemo(() => Math.max(1, ...(data?.byService || []).map((item) => Number(item.total || 0))), [data]);

  const counters = data?.counters || {};

  return (
    <div className="tattoo-page">
      <section className="tattoo-hero">
        <div>
          <span>BI GERENCIAL</span>
          <h1>Curvas e gráficos por data</h1>
          <p>Visão estilo Power BI para acompanhar volume de agenda, faturamento, conversão, cancelamentos, serviços e produtividade por tatuador.</p>
        </div>
        <div className="tattoo-date-filter">
          <label>Início<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>Fim<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <button type="button" className="tattoo-btn primary" onClick={loadBI}>Aplicar</button>
        </div>
      </section>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-kpi-row dashboard tattoo-dashboard-compact">
        <article><span>Agendamentos</span><strong>{Number(counters.totalAppointments || 0).toLocaleString('pt-BR')}</strong><p>no período</p></article>
        <article><span>Finalizados</span><strong>{Number(counters.finalized || 0).toLocaleString('pt-BR')}</strong><p>{counters.conversionRate || 0}% conversão</p></article>
        <article><span>Cancelamentos</span><strong>{Number(counters.cancelled || 0).toLocaleString('pt-BR')}</strong><p>{counters.cancellationRate || 0}% taxa</p></article>
        <article><span>Faturamento</span><strong>{formatMoney(counters.revenue)}</strong><p>serviços finalizados</p></article>
        <article><span>Recebido</span><strong>{formatMoney(counters.paid)}</strong><p>pagamentos registrados</p></article>
        <article><span>A receber</span><strong>{formatMoney(counters.openBalance)}</strong><p>saldo em aberto</p></article>
        <article><span>Pagou parte</span><strong>{Number(counters.partialPayments || 0).toLocaleString('pt-BR')}</strong><p>sinal/parcial</p></article>
        <article><span>Pago total</span><strong>{Number(counters.fullyPaid || 0).toLocaleString('pt-BR')}</strong><p>quitados</p></article>
        <article><span>Ticket médio</span><strong>{formatMoney(counters.averageTicket)}</strong><p>por sessão finalizada</p></article>
      </section>

      <section className="tattoo-bi-grid">
        <article className="tattoo-panel tattoo-chart-card wide">
          <div className="tattoo-panel-title"><span>Curva por data</span><strong>Volume diário de horários</strong></div>
          <div className="tattoo-curve-chart">
            {(data?.byDay || []).map((item) => (
              <div key={item.date} className="tattoo-curve-point">
                <i style={{ height: `${Math.max(8, (Number(item.total || 0) / maxDay) * 100)}%` }} />
                <span>{formatDate(item.date)}</span>
                <b>{item.total}</b>
              </div>
            ))}
            {(!data?.byDay || data.byDay.length === 0) && <p className="tattoo-chart-empty">Sem dados no período.</p>}
          </div>
        </article>

        <article className="tattoo-panel tattoo-chart-card wide">
          <div className="tattoo-panel-title"><span>Curva financeira</span><strong>Receita finalizada por data</strong></div>
          <div className="tattoo-curve-chart revenue">
            {(data?.byDay || []).map((item) => (
              <div key={`revenue-${item.date}`} className="tattoo-curve-point">
                <i style={{ height: `${Math.max(8, (Number(item.revenue || 0) / maxRevenue) * 100)}%` }} />
                <span>{formatDate(item.date)}</span>
                <b>{formatMoney(item.revenue)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="tattoo-panel tattoo-chart-card wide">
          <div className="tattoo-panel-title"><span>Curva de recebimento</span><strong>Valores pagos por data</strong></div>
          <div className="tattoo-curve-chart paid">
            {(data?.byDay || []).map((item) => (
              <div key={`paid-${item.date}`} className="tattoo-curve-point">
                <i style={{ height: `${Math.max(8, (Number(item.paid || 0) / maxPaid) * 100)}%` }} />
                <span>{formatDate(item.date)}</span>
                <b>{formatMoney(item.paid)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="tattoo-panel tattoo-chart-card">
          <div className="tattoo-panel-title"><span>Status</span><strong>Distribuição da agenda</strong></div>
          <div className="tattoo-horizontal-chart">
            {(data?.byStatus || []).map((item) => (
              <div key={item.status}>
                <span>{readable(item.status)}</span>
                <strong>{item.total}</strong>
                <i><b style={{ width: `${(Number(item.total || 0) / maxStatus) * 100}%` }} /></i>
              </div>
            ))}
          </div>
        </article>

        <article className="tattoo-panel tattoo-chart-card">
          <div className="tattoo-panel-title"><span>Serviços</span><strong>Mais procurados</strong></div>
          <div className="tattoo-horizontal-chart">
            {(data?.byService || []).map((item) => (
              <div key={item.serviceType}>
                <span>{readable(item.serviceType)}</span>
                <strong>{item.total}</strong>
                <i><b style={{ width: `${(Number(item.total || 0) / maxService) * 100}%` }} /></i>
              </div>
            ))}
          </div>
        </article>

        <article className="tattoo-panel tattoo-chart-card wide">
          <div className="tattoo-panel-title"><span>Tatuadores</span><strong>Produtividade e faturamento</strong></div>
          <div className="tattoo-card-list">
            {(data?.byArtist || []).map((item) => (
              <article className="tattoo-list-card" key={item.artistId}>
                <div>
                  <strong>{item.artist?.name || 'Tatuador'}</strong>
                  <span>{Number(item.total || 0).toLocaleString('pt-BR')} atendimentos</span>
                  <p>{formatMoney(item.revenue)}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default TattooBI;
