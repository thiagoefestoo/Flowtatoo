import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenCandidateNameField } from './hrCandidateFields';
import { contractOptions, priorityOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField(),
  hiddenCandidateNameField,
  { name: 'jobTitle', label: 'Vaga', required: true },
  { name: 'interviewerName', label: 'Entrevistador', required: true },
  { name: 'interviewType', label: 'Tipo', type: 'select', defaultValue: 'online', options: [
    { value: 'presencial', label: 'Presencial' }, { value: 'online', label: 'Online' }, { value: 'telefone', label: 'Telefone' }, { value: 'rh', label: 'RH' }, { value: 'tecnica', label: 'Técnica' }, { value: 'gestor', label: 'Gestor' }, { value: 'dinamica', label: 'Dinâmica' }
  ] },
  { name: 'scheduledAt', label: 'Data e horário', type: 'datetime', required: true },
  { name: 'locationOrLink', label: 'Local ou link' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'agendada', options: [
    { value: 'agendada', label: 'Agendada' }, { value: 'confirmada', label: 'Confirmada' }, { value: 'realizada', label: 'Realizada' }, { value: 'remarcada', label: 'Remarcada' }, { value: 'cancelada', label: 'Cancelada' }, { value: 'nao_compareceu', label: 'Não compareceu' }
  ] },
  { name: 'communicationScore', label: 'Comunicação', type: 'number', min: 0, max: 10 },
  { name: 'technicalScore', label: 'Técnica', type: 'number', min: 0, max: 10 },
  { name: 'cultureScore', label: 'Aderência cultural', type: 'number', min: 0, max: 10 },
  { name: 'result', label: 'Resultado', type: 'select', defaultValue: 'aguardando', options: [
    { value: 'aguardando', label: 'Aguardando' }, { value: 'proxima_fase', label: 'Próxima fase' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'banco_talentos', label: 'Banco de talentos' }
  ] },
  { name: 'feedback', label: 'Feedback', type: 'textarea', full: true },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'candidateName', label: 'Candidato' },
  { key: 'jobTitle', label: 'Vaga' },
  { key: 'interviewerName', label: 'Entrevistador' },
  { key: 'scheduledAt', label: 'Data', type: 'datetime' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'result', label: 'Resultado', badge: statusBadge },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'agendada', label: 'Agendada' }, { value: 'confirmada', label: 'Confirmada' }, { value: 'realizada', label: 'Realizada' }, { value: 'cancelada', label: 'Cancelada' }, { value: 'nao_compareceu', label: 'Não compareceu' } ] },
];

const stats = [
  { label: 'Agendadas', description: 'entrevistas futuras', getValue: (items) => items.filter((item) => ['agendada','confirmada','remarcada'].includes(item.status)).length },
  { label: 'Realizadas', description: 'com feedback', getValue: (items) => items.filter((item) => item.status === 'realizada').length },
  { label: 'Aprovados', description: 'resultado positivo', getValue: (items) => items.filter((item) => item.result === 'aprovado').length },
];

function Entrevistas() {
  return (
    <CrmCrudPage
      title="Entrevistas"
      eyebrow="FLOWTATOO CORE"
      description="Agende entrevistas, controle presença, feedback, notas e resultado do processo."
      endpoint="/interviews"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Agendar entrevista"
      detailTitle="Detalhes - Entrevistas"
    />
  );
}

export default Entrevistas;
