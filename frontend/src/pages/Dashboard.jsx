import { useEffect, useState } from 'react';

import { apiRequest } from '../services/api';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');

  async function loadSummary() {
    try {
      const result = await apiRequest('/hr-dashboard/summary');
      setSummary(result.data);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar dashboard.');
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const counters = summary?.counters || {};

  const cards = [
    { label: 'Vagas abertas', value: counters.openJobs || 0, description: 'posições ativas no pipeline' },
    { label: 'Candidatos em processo', value: counters.candidatesInProcess || 0, description: 'pessoas em triagem/seleção' },
    { label: 'Entrevistas agendadas', value: counters.scheduledInterviews || 0, description: 'agenda futura do RH' },
    { label: 'Entrevistas hoje', value: counters.interviewsToday || 0, description: 'compromissos do dia' },
    { label: 'Admissões pendentes', value: counters.pendingAdmissions || 0, description: 'checklists em andamento' },
    { label: 'Colaboradores ativos', value: counters.activeEmployees || 0, description: 'base atual de pessoas' },
    { label: 'Documentos pendentes', value: counters.pendingDocuments || 0, description: 'documentos aguardando validação' },
    { label: 'Onboarding ativo', value: counters.activeOnboarding || 0, description: 'tarefas abertas de integração' },
  ];

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>FLOWTATOO CORE</span>
          <h1>Dashboard RH</h1>
          <p>Visão centralizada de vagas, candidatos, entrevistas, admissões, documentos e colaboradores.</p>
        </div>
        <button type="button" className="ghost-button" onClick={loadSummary}>Atualizar</button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        {cards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{Number(card.value || 0).toLocaleString('pt-BR')}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card wide-card">
          <div className="panel-title">
            <div>
              <h2>Próximas entrevistas</h2>
              <p>Agenda dos processos seletivos mais próximos.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Candidato</th><th>Vaga</th><th>Entrevistador</th><th>Data</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(summary?.nextInterviews || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.candidateName}</td>
                    <td>{item.jobTitle}</td>
                    <td>{item.interviewerName}</td>
                    <td>{formatDateTime(item.scheduledAt)}</td>
                    <td><span className="status-badge info">{String(item.status || '').replaceAll('_', ' ')}</span></td>
                  </tr>
                ))}
                {(!summary?.nextInterviews || summary.nextInterviews.length === 0) && (
                  <tr><td className="empty-table" colSpan="5">Nenhuma entrevista agendada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-card wide-card">
          <div className="panel-title">
            <div>
              <h2>Vagas prioritárias</h2>
              <p>Vagas de alta urgência que merecem acompanhamento da gestão.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Vaga</th><th>Setor</th><th>Responsável</th><th>Status</th><th>Prazo</th></tr>
              </thead>
              <tbody>
                {(summary?.priorityJobs || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.department}</td>
                    <td>{item.recruiterName || '-'}</td>
                    <td><span className="status-badge warning">{String(item.status || '').replaceAll('_', ' ')}</span></td>
                    <td>{item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : '-'}</td>
                  </tr>
                ))}
                {(!summary?.priorityJobs || summary.priorityJobs.length === 0) && (
                  <tr><td className="empty-table" colSpan="5">Nenhuma vaga prioritária ativa.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
