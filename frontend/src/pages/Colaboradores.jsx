import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'name', label: 'Nome completo', required: true },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'phone', label: 'Telefone' },
  { name: 'document', label: 'CPF/documento' },
  { name: 'jobTitle', label: 'Cargo', required: true },
  { name: 'department', label: 'Setor' },
  { name: 'managerName', label: 'Gestor' },
  { name: 'admissionDate', label: 'Data de admissão', type: 'date' },
  { name: 'contractType', label: 'Contrato', type: 'select', options: contractOptions, defaultValue: 'clt' },
  { name: 'salary', label: 'Salário', type: 'currency' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
    { value: 'ativo', label: 'Ativo' }, { value: 'experiencia', label: 'Experiência' }, { value: 'afastado', label: 'Afastado' }, { value: 'ferias', label: 'Férias' }, { value: 'desligado', label: 'Desligado' }, { value: 'inativo', label: 'Inativo' }
  ] },
  { name: 'experienceReview30', label: 'Avaliação 30 dias', type: 'date' },
  { name: 'experienceReview60', label: 'Avaliação 60 dias', type: 'date' },
  { name: 'experienceReview90', label: 'Avaliação 90 dias', type: 'date' },
  { name: 'benefits', label: 'Benefícios', type: 'textarea', full: true },
  { name: 'notes', label: 'Histórico / observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'name', label: 'Colaborador' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'department', label: 'Setor' },
  { key: 'managerName', label: 'Gestor' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'admissionDate', label: 'Admissão', type: 'date' },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'ativo', label: 'Ativo' }, { value: 'experiencia', label: 'Experiência' }, { value: 'afastado', label: 'Afastado' }, { value: 'ferias', label: 'Férias' }, { value: 'desligado', label: 'Desligado' } ] },
];

const stats = [
  { label: 'Ativos', description: 'colaboradores em atividade', getValue: (items) => items.filter((item) => ['ativo','experiencia','ferias','afastado'].includes(item.status)).length },
  { label: 'Experiência', description: 'em avaliação inicial', getValue: (items) => items.filter((item) => item.status === 'experiencia').length },
  { label: 'Desligados', description: 'histórico encerrado', getValue: (items) => items.filter((item) => item.status === 'desligado').length },
];

function Colaboradores() {
  return (
    <CrmCrudPage
      title="Colaboradores"
      eyebrow="FLOWTATOO CORE"
      description="Cadastro central de colaboradores ativos, contrato, cargo, gestor, salário, benefícios e status."
      endpoint="/employees"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar colaborador"
      detailTitle="Detalhes - Colaboradores"
    />
  );
}

export default Colaboradores;
