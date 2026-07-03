import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, priorityOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'code', label: 'Código da vaga' },
  { name: 'title', label: 'Cargo', required: true },
  { name: 'department', label: 'Setor', required: true },
  { name: 'seniority', label: 'Nível', type: 'select', options: seniorityOptions, defaultValue: 'pleno' },
  { name: 'contractType', label: 'Tipo de contrato', type: 'select', options: contractOptions, defaultValue: 'clt' },
  { name: 'workModel', label: 'Modelo de trabalho', type: 'select', options: workModelOptions, defaultValue: 'presencial' },
  { name: 'location', label: 'Localidade' },
  { name: 'openings', label: 'Quantidade de vagas', type: 'number', defaultValue: 1, min: 1 },
  { name: 'salaryMin', label: 'Salário mínimo', type: 'currency' },
  { name: 'salaryMax', label: 'Salário máximo', type: 'currency' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'aberta', options: [
    { value: 'rascunho', label: 'Rascunho' }, { value: 'aberta', label: 'Aberta' }, { value: 'triagem', label: 'Triagem' }, { value: 'entrevistas', label: 'Entrevistas' }, { value: 'proposta', label: 'Proposta' }, { value: 'admissao', label: 'Admissão' }, { value: 'concluida', label: 'Concluída' }, { value: 'cancelada', label: 'Cancelada' }
  ] },
  { name: 'priority', label: 'Prioridade', type: 'select', options: priorityOptions, defaultValue: 'media' },
  { name: 'recruiterName', label: 'Responsável RH' },
  { name: 'managerName', label: 'Gestor solicitante' },
  { name: 'deadline', label: 'Prazo desejado', type: 'date' },
  { name: 'benefits', label: 'Benefícios', type: 'textarea', full: true },
  { name: 'description', label: 'Descrição da vaga', type: 'textarea', full: true },
  { name: 'requirements', label: 'Requisitos', type: 'textarea', full: true },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'title', label: 'Cargo' },
  { key: 'department', label: 'Setor' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'priority', label: 'Prioridade', badge: statusBadge },
  { key: 'openings', label: 'Vagas' },
  { key: 'deadline', label: 'Prazo', type: 'date' },
];

const filters = [
  { name: 'status', label: 'Status', options: [
    { value: 'aberta', label: 'Aberta' }, { value: 'triagem', label: 'Triagem' }, { value: 'entrevistas', label: 'Entrevistas' }, { value: 'proposta', label: 'Proposta' }, { value: 'admissao', label: 'Admissão' }, { value: 'concluida', label: 'Concluída' }
  ] },
  { name: 'priority', label: 'Prioridade', options: priorityOptions },
];

const stats = [
  { label: 'Abertas', description: 'vagas em andamento', getValue: (items) => items.filter((item) => ['aberta','triagem','entrevistas','proposta','admissao'].includes(item.status)).length },
  { label: 'Urgentes', description: 'prioridade alta/urgente', getValue: (items) => items.filter((item) => ['alta','urgente'].includes(item.priority)).length },
  { label: 'Concluídas', description: 'processos fechados', getValue: (items) => items.filter((item) => item.status === 'concluida').length },
];

function Vagas() {
  return (
    <CrmCrudPage
      title="Vagas"
      eyebrow="FLOWTATOO CORE"
      description="Cadastre e acompanhe vagas, requisitos, responsáveis, prioridade e status do processo seletivo."
      endpoint="/job-openings"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar vaga"
      detailTitle="Detalhes - Vagas"
    />
  );
}

export default Vagas;
