import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'employeeName', label: 'Colaborador', required: true },
  { name: 'title', label: 'Tarefa', required: true },
  { name: 'responsibleName', label: 'Responsável' },
  { name: 'dueDate', label: 'Prazo', type: 'date' },
  { name: 'category', label: 'Categoria', type: 'select', defaultValue: 'integracao', options: [
    { value: 'documentos', label: 'Documentos' }, { value: 'acessos', label: 'Acessos' }, { value: 'equipamentos', label: 'Equipamentos' }, { value: 'integracao', label: 'Integração' }, { value: 'treinamento', label: 'Treinamento' }, { value: 'outro', label: 'Outro' }
  ] },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'pendente', options: [
    { value: 'pendente', label: 'Pendente' }, { value: 'em_andamento', label: 'Em andamento' }, { value: 'concluida', label: 'Concluída' }, { value: 'atrasada', label: 'Atrasada' }, { value: 'cancelada', label: 'Cancelada' }
  ] },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'employeeName', label: 'Colaborador' },
  { key: 'title', label: 'Tarefa' },
  { key: 'responsibleName', label: 'Responsável' },
  { key: 'dueDate', label: 'Prazo', type: 'date' },
  { key: 'category', label: 'Categoria' },
  { key: 'status', label: 'Status', badge: statusBadge },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'em_andamento', label: 'Em andamento' }, { value: 'concluida', label: 'Concluída' }, { value: 'atrasada', label: 'Atrasada' } ] },
];

const stats = [
  { label: 'Pendentes', description: 'tarefas abertas', getValue: (items) => items.filter((item) => ['pendente','em_andamento','atrasada'].includes(item.status)).length },
  { label: 'Concluídas', description: 'onboarding concluído', getValue: (items) => items.filter((item) => item.status === 'concluida').length },
  { label: 'Atrasadas', description: 'fora do prazo', getValue: (items) => items.filter((item) => item.status === 'atrasada').length },
];

function Onboarding() {
  return (
    <CrmCrudPage
      title="Onboarding"
      eyebrow="FLOWTATOO CORE"
      description="Gerencie tarefas de integração, responsáveis, prazos, equipamentos, acessos e treinamentos."
      endpoint="/onboarding-tasks"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Criar tarefa"
      detailTitle="Detalhes - Onboarding"
    />
  );
}

export default Onboarding;
