import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

function Relatorios() {
  const [data, setData] = useState({ jobs: [], candidates: [], interviews: [], employees: [], documents: [], admissions: [] });
  const [message, setMessage] = useState('');

  async function loadReports() {
    try {
      const [jobs, candidates, interviews, employees, documents, admissions] = await Promise.all([
        apiRequest('/job-openings'),
        apiRequest('/candidates'),
        apiRequest('/interviews'),
        apiRequest('/employees'),
        apiRequest('/hr-documents'),
        apiRequest('/admissions'),
      ]);

      setData({
        jobs: extractData(jobs),
        candidates: extractData(candidates),
        interviews: extractData(interviews),
        employees: extractData(employees),
        documents: extractData(documents),
        admissions: extractData(admissions),
      });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar relatórios.');
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const report = useMemo(() => {
    const openJobs = data.jobs.filter((item) => ['aberta', 'triagem', 'entrevistas', 'proposta', 'admissao'].includes(item.status)).length;
    const closedJobs = data.jobs.filter((item) => item.status === 'concluida').length;
    const activeCandidates = data.candidates.filter((item) => ['novo', 'em_triagem', 'em_processo', 'aprovado'].includes(item.status)).length;
    const hiredCandidates = data.candidates.filter((item) => item.status === 'contratado').length;
    const scheduledInterviews = data.interviews.filter((item) => ['agendada', 'confirmada', 'remarcada'].includes(item.status)).length;
    const completedInterviews = data.interviews.filter((item) => item.status === 'realizada').length;
    const pendingDocuments = data.documents.filter((item) => ['pendente', 'enviado', 'recusado', 'vencido'].includes(item.status)).length;
    const activeEmployees = data.employees.filter((item) => ['ativo', 'experiencia', 'afastado', 'ferias'].includes(item.status)).length;
    const pendingAdmissions = data.admissions.filter((item) => !['concluida', 'cancelada'].includes(item.status)).length;

    const jobsByDepartment = Object.entries(data.jobs.reduce((acc, item) => {
      const key = item.department || 'Sem setor';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([department, total]) => ({ department, total }));

    const candidatesByStage = Object.entries(data.candidates.reduce((acc, item) => {
      const key = String(item.stage || 'sem_etapa').replaceAll('_', ' ');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([stage, total]) => ({ stage, total }));

    return {
      openJobs,
      closedJobs,
      activeCandidates,
      hiredCandidates,
      scheduledInterviews,
      completedInterviews,
      pendingDocuments,
      activeEmployees,
      pendingAdmissions,
      jobsByDepartment,
      candidatesByStage,
    };
  }, [data]);

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>INTELIGÊNCIA RH</span>
          <h1>Relatórios</h1>
          <p>Analise o funil de vagas, candidatos, entrevistas, admissões, documentos e base de colaboradores.</p>
        </div>
        <button type="button" className="ghost-button" onClick={loadReports}>Atualizar</button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Vagas abertas</span><strong>{report.openJobs}</strong><p>posições em andamento</p></article>
        <article><span>Candidatos ativos</span><strong>{report.activeCandidates}</strong><p>em triagem ou processo</p></article>
        <article><span>Entrevistas agendadas</span><strong>{report.scheduledInterviews}</strong><p>agenda pendente</p></article>
        <article><span>Admissões pendentes</span><strong>{report.pendingAdmissions}</strong><p>checklists abertos</p></article>
        <article><span>Documentos pendentes</span><strong>{report.pendingDocuments}</strong><p>exigem validação</p></article>
        <article><span>Colaboradores ativos</span><strong>{report.activeEmployees}</strong><p>base atual</p></article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="panel-title"><div><h2>Vagas por setor</h2><p>Distribuição das vagas cadastradas por departamento.</p></div></div>
          <div className="compact-list">
            {report.jobsByDepartment.map((row) => (
              <div key={row.department}><strong>{row.department}</strong><span>{row.total} vaga(s)</span></div>
            ))}
            {report.jobsByDepartment.length === 0 && <div className="empty-documents">Nenhuma vaga cadastrada.</div>}
          </div>
        </article>

        <article className="dashboard-card">
          <div className="panel-title"><div><h2>Candidatos por etapa</h2><p>Onde os candidatos estão no processo seletivo.</p></div></div>
          <div className="compact-list">
            {report.candidatesByStage.map((row) => (
              <div key={row.stage}><strong>{row.stage}</strong><span>{row.total} candidato(s)</span></div>
            ))}
            {report.candidatesByStage.length === 0 && <div className="empty-documents">Nenhum candidato cadastrado.</div>}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Relatorios;
