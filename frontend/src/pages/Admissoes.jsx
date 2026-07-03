import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenEmployeeNameField } from './hrCandidateFields';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField(),
  hiddenEmployeeNameField,
  { name: 'jobTitle', label: 'Cargo', required: true },
  { name: 'department', label: 'Setor' },
  { name: 'managerName', label: 'Gestor' },
  { name: 'startDate', label: 'Data de início', type: 'date' },
  { name: 'status', label: 'Status geral', type: 'select', defaultValue: 'documentos_pendentes', options: [
    { value: 'documentos_pendentes', label: 'Documentos pendentes' }, { value: 'exame_pendente', label: 'Exame pendente' }, { value: 'contrato_pendente', label: 'Contrato pendente' }, { value: 'acessos_pendentes', label: 'Acessos pendentes' }, { value: 'integracao_agendada', label: 'Integração agendada' }, { value: 'concluida', label: 'Concluída' }, { value: 'cancelada', label: 'Cancelada' }
  ] },
  { name: 'documentsStatus', label: 'Documentos', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'enviado', label: 'Enviado' }, { value: 'validado', label: 'Validado' }, { value: 'recusado', label: 'Recusado' } ] },
  { name: 'medicalExamStatus', label: 'Exame admissional', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'agendado', label: 'Agendado' }, { value: 'realizado', label: 'Realizado' }, { value: 'apto', label: 'Apto' }, { value: 'inapto', label: 'Inapto' } ] },
  { name: 'contractStatus', label: 'Contrato', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'enviado', label: 'Enviado' }, { value: 'assinado', label: 'Assinado' } ] },
  { name: 'accessStatus', label: 'Acessos', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'solicitado', label: 'Solicitado' }, { value: 'liberado', label: 'Liberado' } ] },
  { name: 'equipmentStatus', label: 'Equipamentos', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'separado', label: 'Separado' }, { value: 'entregue', label: 'Entregue' }, { value: 'nao_aplica', label: 'Não aplica' } ] },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'employeeName', label: 'Admitido' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'department', label: 'Setor' },
  { key: 'startDate', label: 'Início', type: 'date' },
  { key: 'status', label: 'Status', badge: statusBadge },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'documentos_pendentes', label: 'Documentos pendentes' }, { value: 'exame_pendente', label: 'Exame pendente' }, { value: 'contrato_pendente', label: 'Contrato pendente' }, { value: 'concluida', label: 'Concluída' } ] },
];

const stats = [
  { label: 'Admissões', description: 'total cadastrado', getValue: (items) => items.length },
  { label: 'Pendentes', description: 'ainda em checklist', getValue: (items) => items.filter((item) => !['concluida','cancelada'].includes(item.status)).length },
  { label: 'Concluídas', description: 'prontas para ativar', getValue: (items) => items.filter((item) => item.status === 'concluida').length },
];

function Admissoes() {
  return (
    <CrmCrudPage
      title="Admissões"
      eyebrow="FLOWTATOO CORE"
      description="Controle checklist admissional: documentos, exame, contrato, acessos, equipamentos e integração."
      endpoint="/admissions"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Criar admissão"
      detailTitle="Detalhes - Admissões"
    />
  );
}

export default Admissoes;
