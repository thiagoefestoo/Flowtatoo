import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenCandidateNameField } from './hrCandidateFields';
import { contractOptions, priorityOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField(),
  hiddenCandidateNameField,
  { name: 'jobTitle', label: 'Vaga', required: true },
  { name: 'recruiterName', label: 'Responsável RH' },
  { name: 'stage', label: 'Etapa', type: 'select', defaultValue: 'triagem_curricular', options: [
    { value: 'triagem_curricular', label: 'Triagem curricular' }, { value: 'contato_inicial', label: 'Contato inicial' }, { value: 'entrevista_rh', label: 'Entrevista RH' }, { value: 'entrevista_tecnica', label: 'Entrevista técnica' }, { value: 'teste_pratico', label: 'Teste prático' }, { value: 'entrevista_gestor', label: 'Entrevista gestor' }, { value: 'proposta', label: 'Proposta' }, { value: 'admissao', label: 'Admissão' }, { value: 'finalizado', label: 'Finalizado' }
  ] },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'em_andamento', options: [
    { value: 'em_andamento', label: 'Em andamento' }, { value: 'pausado', label: 'Pausado' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'desistente', label: 'Desistente' }, { value: 'contratado', label: 'Contratado' }
  ] },
  { name: 'score', label: 'Pontuação', type: 'number', min: 0, max: 100 },
  { name: 'startedAt', label: 'Início', type: 'date' },
  { name: 'nextActionAt', label: 'Próxima ação', type: 'datetime' },
  { name: 'lastContactAt', label: 'Último contato', type: 'datetime' },
  { name: 'strengths', label: 'Pontos fortes', type: 'textarea', full: true },
  { name: 'risks', label: 'Pontos de atenção', type: 'textarea', full: true },
  { name: 'notes', label: 'Parecer / histórico', type: 'textarea', full: true },
];

const columns = [
  { key: 'candidateName', label: 'Candidato' },
  { key: 'jobTitle', label: 'Vaga' },
  { key: 'stage', label: 'Etapa', badge: statusBadge },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'score', label: 'Score' },
  { key: 'nextActionAt', label: 'Próxima ação', type: 'datetime' },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'em_andamento', label: 'Em andamento' }, { value: 'pausado', label: 'Pausado' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'contratado', label: 'Contratado' } ] },
];

const stats = [
  { label: 'Ativos', description: 'em andamento', getValue: (items) => items.filter((item) => item.status === 'em_andamento').length },
  { label: 'Aprovados', description: 'processos aprovados', getValue: (items) => items.filter((item) => item.status === 'aprovado').length },
  { label: 'Contratados', description: 'viraram admissão', getValue: (items) => items.filter((item) => item.status === 'contratado').length },
];

function ProcessosSeletivos() {
  return (
    <CrmCrudPage
      title="Processos seletivos"
      eyebrow="FLOWTATOO CORE"
      description="Acompanhe a etapa atual, responsável, próximas ações, pontuação e pareceres de cada candidato."
      endpoint="/recruitment-processes"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Criar processo"
      detailTitle="Detalhes - Processos seletivos"
    />
  );
}

export default ProcessosSeletivos;
