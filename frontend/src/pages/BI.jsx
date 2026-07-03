import { useEffect, useMemo, useState } from 'react';

import { apiRequest } from '../services/api';

function toInputDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() + amount);
  return parsed;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function compactLabel(value) {
  if (!value) return '-';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.start) params.set('start', filters.start);
  if (filters.end) params.set('end', filters.end);
  if (filters.period) params.set('period', filters.period);
  return params.toString();
}

function maxFromSeries(series, keys) {
  return Math.max(
    1,
    ...series.flatMap((item) => keys.map((key) => Number(item[key] || 0)))
  );
}

function makePath(series, key, width, height, padding) {
  if (!series.length) return '';
  const max = maxFromSeries(series, [key]);
  const step = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;

  return series
    .map((item, index) => {
      const x = padding + index * step;
      const y = height - padding - (Number(item[key] || 0) / max) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function makeAreaPath(series, key, width, height, padding) {
  const line = makePath(series, key, width, height, padding);
  if (!line || !series.length) return '';
  const step = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
  const firstX = padding;
  const lastX = padding + (series.length - 1) * step;
  const baseY = height - padding;
  return `${line} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

function KpiCard({ label, value, description, tone = 'violet', suffix }) {
  return (
    <article className={`bi-kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}{suffix || ''}</strong>
      <p>{description}</p>
    </article>
  );
}

function ExecutiveLineChart({ series }) {
  const width = 980;
  const height = 320;
  const padding = 34;
  const keys = ['candidates', 'interviews', 'admissions'];
  const max = maxFromSeries(series, keys);
  const yGuides = [0, 0.25, 0.5, 0.75, 1];
  const labels = series.filter((_, index) => {
    if (series.length <= 8) return true;
    return index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 6) === 0;
  });

  return (
    <div className="bi-chart-shell power-card">
      <div className="bi-chart-title">
        <div>
          <span>Curvas por data</span>
          <h2>Entrada de candidatos x entrevistas x admissões</h2>
        </div>
        <div className="bi-legend">
          <small className="violet">Candidatos</small>
          <small className="coral">Entrevistas</small>
          <small className="mint">Admissões</small>
        </div>
      </div>

      <div className="bi-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Curva gerencial por data">
          <defs>
            <linearGradient id="candidateArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.30)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.01)" />
            </linearGradient>
            <linearGradient id="interviewArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 111, 145, 0.24)" />
              <stop offset="100%" stopColor="rgba(255, 111, 145, 0.01)" />
            </linearGradient>
            <linearGradient id="admissionArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(45, 212, 191, 0.24)" />
              <stop offset="100%" stopColor="rgba(45, 212, 191, 0.01)" />
            </linearGradient>
          </defs>

          {yGuides.map((guide) => {
            const y = height - padding - guide * (height - padding * 2);
            return (
              <g key={guide}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} className="bi-grid-line" />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="bi-axis-label">
                  {Math.round(max * guide)}
                </text>
              </g>
            );
          })}

          <path d={makeAreaPath(series, 'candidates', width, height, padding)} fill="url(#candidateArea)" />
          <path d={makeAreaPath(series, 'interviews', width, height, padding)} fill="url(#interviewArea)" />
          <path d={makeAreaPath(series, 'admissions', width, height, padding)} fill="url(#admissionArea)" />

          <path d={makePath(series, 'candidates', width, height, padding)} className="bi-line violet" />
          <path d={makePath(series, 'interviews', width, height, padding)} className="bi-line coral" />
          <path d={makePath(series, 'admissions', width, height, padding)} className="bi-line mint" />

          {labels.map((item) => {
            const index = series.findIndex((entry) => entry.date === item.date);
            const step = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
            const x = padding + index * step;
            return (
              <text key={item.date} x={x} y={height - 9} textAnchor="middle" className="bi-axis-label">
                {formatDate(item.date).slice(0, 5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function StackedVolumeChart({ series }) {
  const max = maxFromSeries(series, ['candidates', 'processes', 'interviews', 'proposals', 'admissions', 'documents']);
  const visibleSeries = series.length > 35
    ? series.filter((_, index) => index % Math.ceil(series.length / 35) === 0 || index === series.length - 1)
    : series;

  return (
    <article className="power-card bi-volume-card">
      <div className="bi-chart-title compact">
        <div>
          <span>Movimentação diária</span>
          <h2>Volume operacional</h2>
        </div>
      </div>
      <div className="bi-column-chart">
        {visibleSeries.map((item) => {
          const total = ['candidates', 'processes', 'interviews', 'proposals', 'admissions', 'documents']
            .reduce((sum, key) => sum + Number(item[key] || 0), 0);
          return (
            <div key={item.date} className="bi-column-item" title={`${formatDate(item.date)} • ${total} registro(s)`}>
              <div className="bi-column-stack" style={{ height: `${Math.max(8, (total / max) * 100)}%` }}>
                <i style={{ '--h': `${Number(item.candidates || 0) / Math.max(total, 1) * 100}%` }} />
                <b style={{ '--h': `${Number(item.interviews || 0) / Math.max(total, 1) * 100}%` }} />
                <em style={{ '--h': `${Number(item.admissions || 0) / Math.max(total, 1) * 100}%` }} />
              </div>
              <small>{formatDate(item.date).slice(0, 5)}</small>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HorizontalBars({ title, subtitle, items, variant = 'default' }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));

  return (
    <article className={`power-card bi-bars-card ${variant}`}>
      <div className="bi-chart-title compact">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="bi-horizontal-bars">
        {(items || []).map((item) => (
          <div key={item.label}>
            <header>
              <span>{item.label}</span>
              <strong>{formatNumber(item.value)}</strong>
            </header>
            <div>
              <i style={{ width: `${(Number(item.value || 0) / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="bi-empty">Sem dados no período selecionado.</p>}
      </div>
    </article>
  );
}

function DonutDistribution({ title, subtitle, items }) {
  const total = (items || []).reduce((sum, item) => sum + Number(item.value || 0), 0);
  let acc = 0;
  const palette = ['#8b5cf6', '#ff6f91', '#2dd4bf', '#ffb86b', '#5b21b6', '#0f9f6e', '#e11d48'];
  const gradient = total
    ? items.map((item, index) => {
        const start = acc;
        acc += (Number(item.value || 0) / total) * 100;
        return `${palette[index % palette.length]} ${start}% ${acc}%`;
      }).join(', ')
    : '#ede9fe 0% 100%';

  return (
    <article className="power-card bi-donut-card">
      <div className="bi-chart-title compact">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="bi-donut-layout">
        <div className="bi-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <strong>{formatNumber(total)}</strong>
          <small>total</small>
        </div>
        <div className="bi-donut-list">
          {(items || []).slice(0, 7).map((item, index) => (
            <div key={item.label}>
              <i style={{ background: palette[index % palette.length] }} />
              <span>{item.label}</span>
              <strong>{formatPercent((Number(item.value || 0) / Math.max(total, 1)) * 100)}</strong>
            </div>
          ))}
          {(!items || items.length === 0) && <p className="bi-empty">Sem dados no período.</p>}
        </div>
      </div>
    </article>
  );
}

function FunnelChart({ funnel }) {
  const max = Math.max(1, ...(funnel || []).map((item) => Number(item.value || 0)));

  return (
    <article className="power-card bi-funnel-card">
      <div className="bi-chart-title compact">
        <div>
          <span>Funil gerencial</span>
          <h2>Da candidatura à contratação</h2>
        </div>
      </div>
      <div className="bi-funnel">
        {(funnel || []).map((item, index) => (
          <div key={item.label} className="bi-funnel-row">
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${Math.max(8, (Number(item.value || 0) / max) * 100)}%`, '--delay': `${index * 50}ms` }} />
            </div>
            <strong>{formatNumber(item.value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function AlertBoard({ alerts }) {
  const items = [
    { label: 'Processos atrasados', value: alerts?.delayedProcesses || 0, tone: 'danger' },
    { label: 'Documentos vencidos', value: alerts?.overdueDocuments || 0, tone: 'danger' },
    { label: 'Documentos pendentes', value: alerts?.pendingDocuments || 0, tone: 'warning' },
    { label: 'Admissões pendentes', value: alerts?.pendingAdmissions || 0, tone: 'warning' },
    { label: 'Onboarding aberto', value: alerts?.pendingOnboarding || 0, tone: 'info' },
    { label: 'Férias/afastamentos', value: alerts?.upcomingTimeOff || 0, tone: 'info' },
  ];

  return (
    <article className="power-card bi-alert-board">
      <div className="bi-chart-title compact">
        <div>
          <span>Gestão por exceção</span>
          <h2>Alertas executivos</h2>
        </div>
      </div>
      <div className="bi-alert-grid">
        {items.map((item) => (
          <div key={item.label} className={item.tone}>
            <strong>{formatNumber(item.value)}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function NextInterviews({ interviews }) {
  return (
    <article className="power-card bi-table-card">
      <div className="bi-chart-title compact">
        <div>
          <span>Próximos 7 dias</span>
          <h2>Agenda crítica</h2>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Candidato</th><th>Vaga</th><th>Entrevistador</th><th>Data</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(interviews || []).map((item) => (
              <tr key={item.id}>
                <td>{item.candidateName}</td>
                <td>{item.jobTitle}</td>
                <td>{item.interviewerName}</td>
                <td>{formatDateTime(item.scheduledAt)}</td>
                <td><span className="status-badge info">{compactLabel(item.status)}</span></td>
              </tr>
            ))}
            {(!interviews || interviews.length === 0) && (
              <tr><td className="empty-table" colSpan="5">Nenhuma entrevista crítica para os próximos dias.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function BI() {
  const [filters, setFilters] = useState(() => {
    const end = new Date();
    const start = addDays(end, -89);
    return {
      period: '90',
      start: toInputDate(start),
      end: toInputDate(end),
    };
  });
  const [bi, setBi] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadBI(nextFilters = filters) {
    setLoading(true);
    setMessage('');
    try {
      const query = buildQuery(nextFilters);
      const result = await apiRequest(`/hr-bi/gerencial?${query}`);
      setBi(result.data);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar BI gerencial.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPeriod(period) {
    const end = new Date();
    const start = addDays(end, (Number(period) - 1) * -1);
    const nextFilters = {
      period: String(period),
      start: toInputDate(start),
      end: toInputDate(end),
    };
    setFilters(nextFilters);
    loadBI(nextFilters);
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadBI(filters);
  }

  const indicators = bi?.indicators || {};
  const distributions = bi?.distributions || {};
  const series = useMemo(() => bi?.series || [], [bi]);

  return (
    <div className="module-page bi-page">
      <div className="page-header bi-power-header">
        <div>
          <span>FLOWTATOO ANALYTICS</span>
          <h1>BI Gerencial</h1>
          <p>
            Painel executivo com curvas por data, funil de contratação, gargalos de RH,
            status documental e indicadores para tomada de decisão.
          </p>
        </div>
        <form className="bi-filter-panel" onSubmit={handleSubmit}>
          <div className="bi-period-buttons">
            {[30, 60, 90, 180, 365].map((period) => (
              <button
                key={period}
                type="button"
                className={filters.period === String(period) ? 'active' : ''}
                onClick={() => applyPeriod(period)}
              >
                {period}D
              </button>
            ))}
          </div>
          <label>
            Início
            <input
              type="date"
              value={filters.start}
              onChange={(event) => setFilters((current) => ({ ...current, period: 'custom', start: event.target.value }))}
            />
          </label>
          <label>
            Fim
            <input
              type="date"
              value={filters.end}
              onChange={(event) => setFilters((current) => ({ ...current, period: 'custom', end: event.target.value }))}
            />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Carregando...' : 'Aplicar'}</button>
        </form>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="bi-executive-strip">
        <div>
          <span>Período analisado</span>
          <strong>{formatDate(bi?.range?.startDate)} → {formatDate(bi?.range?.endDate)}</strong>
          <p>Atualizado em {formatDateTime(bi?.updatedAt)}</p>
        </div>
        <div>
          <span>Conversão candidatura → admissão</span>
          <strong>{formatPercent(indicators.conversionToAdmission)}</strong>
          <p>Base: candidatos do período e admissões registradas.</p>
        </div>
        <div>
          <span>Aceitação de proposta</span>
          <strong>{formatPercent(indicators.offerAcceptanceRate)}</strong>
          <p>Propostas aceitas sobre propostas criadas.</p>
        </div>
      </section>

      <section className="bi-kpi-grid">
        <KpiCard label="Candidatos" value={formatNumber(indicators.candidates)} description="novos registros no período" tone="violet" />
        <KpiCard label="Vagas abertas" value={formatNumber(indicators.openJobs)} description="posições ativas em andamento" tone="coral" />
        <KpiCard label="Processos ativos" value={formatNumber(indicators.activeProcesses)} description="pipeline seletivo em movimento" tone="amber" />
        <KpiCard label="Entrevistas" value={formatNumber(indicators.scheduledInterviews)} description="agenda dentro do período" tone="mint" />
        <KpiCard label="Propostas aceitas" value={formatNumber(indicators.acceptedProposals)} description="ofertas convertidas" tone="violet" />
        <KpiCard label="Admissões" value={formatNumber(indicators.admissions)} description="entradas em admissão" tone="mint" />
        <KpiCard label="Documentos pendentes" value={formatNumber(indicators.pendingDocuments)} description="exigem ação do RH" tone="danger" />
        <KpiCard label="Score médio" value={formatNumber(indicators.avgProcessScore)} description="pontuação média de processos" tone="dark" />
      </section>

      <ExecutiveLineChart series={series} />

      <section className="bi-power-grid two-one">
        <StackedVolumeChart series={series} />
        <FunnelChart funnel={bi?.funnel || []} />
      </section>

      <section className="bi-power-grid three">
        <DonutDistribution title="Origem dos candidatos" subtitle="Aquisição de talentos" items={distributions.candidateSource || []} />
        <HorizontalBars title="Status dos candidatos" subtitle="Pipeline atual" items={distributions.candidateStatus || []} />
        <HorizontalBars title="Etapas dos processos" subtitle="Gargalos de seleção" items={distributions.processStage || []} variant="alt" />
      </section>

      <section className="bi-power-grid two">
        <HorizontalBars title="Vagas por departamento" subtitle="Demanda por área" items={distributions.jobDepartment || []} />
        <HorizontalBars title="Cargos mais desejados" subtitle="Mapa de interesse" items={distributions.desiredPositions || []} variant="alt" />
      </section>

      <section className="bi-power-grid two">
        <AlertBoard alerts={bi?.alerts || {}} />
        <NextInterviews interviews={bi?.nextInterviews || []} />
      </section>
    </div>
  );
}

export default BI;
