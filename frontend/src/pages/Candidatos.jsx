import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, priorityOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'name', label: 'Nome completo', required: true },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'phone', label: 'Telefone' },
  { name: 'city', label: 'Cidade' },
  { name: 'state', label: 'UF' },
  { name: 'desiredPosition', label: 'Cargo desejado' },
  { name: 'source', label: 'Origem', type: 'select', defaultValue: 'site', options: [
    { value: 'indicacao', label: 'Indicação' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'site', label: 'Site' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'banco_talentos', label: 'Banco de talentos' }, { value: 'agencia', label: 'Agência' }, { value: 'outro', label: 'Outro' }
  ] },
  { name: 'salaryExpectation', label: 'Pretensão salarial', type: 'currency' },
  { name: 'linkedinUrl', label: 'LinkedIn' },
  { name: 'resumeUrl', label: 'Link do currículo' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'novo', options: [
    { value: 'novo', label: 'Novo' }, { value: 'em_triagem', label: 'Em triagem' }, { value: 'em_processo', label: 'Em processo' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'banco_talentos', label: 'Banco de talentos' }, { value: 'contratado', label: 'Contratado' }
  ] },
  { name: 'stage', label: 'Etapa', type: 'select', defaultValue: 'inscrito', options: [
    { value: 'inscrito', label: 'Inscrito' }, { value: 'triagem_curricular', label: 'Triagem curricular' }, { value: 'contato_inicial', label: 'Contato inicial' }, { value: 'entrevista_rh', label: 'Entrevista RH' }, { value: 'entrevista_tecnica', label: 'Entrevista técnica' }, { value: 'teste_pratico', label: 'Teste prático' }, { value: 'entrevista_gestor', label: 'Entrevista gestor' }, { value: 'proposta', label: 'Proposta' }, { value: 'admissao', label: 'Admissão' }, { value: 'finalizado', label: 'Finalizado' }
  ] },
  { name: 'rating', label: 'Nota geral', type: 'number', min: 0, max: 10 },
  { name: 'tags', label: 'Tags' },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'name', label: 'Candidato' },
  { key: 'desiredPosition', label: 'Cargo desejado' },
  { key: 'phone', label: 'Telefone' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'stage', label: 'Etapa', badge: statusBadge },
  { key: 'rating', label: 'Nota' },
];

const filters = [
  { name: 'status', label: 'Status', options: [
    { value: 'novo', label: 'Novo' }, { value: 'em_triagem', label: 'Em triagem' }, { value: 'em_processo', label: 'Em processo' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'banco_talentos', label: 'Banco de talentos' }, { value: 'contratado', label: 'Contratado' }
  ] },
];

const stats = [
  { label: 'Candidatos', description: 'total cadastrado', getValue: (items) => items.length },
  { label: 'Em processo', description: 'ativos no pipeline', getValue: (items) => items.filter((item) => ['novo','em_triagem','em_processo'].includes(item.status)).length },
  { label: 'Aprovados', description: 'candidatos aprovados', getValue: (items) => items.filter((item) => item.status === 'aprovado').length },
];

function Candidatos() {
  return (
    <CrmCrudPage
      title="Candidatos"
      eyebrow="FLOWTATOO CORE"
      description="Gerencie candidatos, origem, etapa do processo, avaliação e dados de contato."
      endpoint="/candidates"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar candidato"
      detailTitle="Detalhes - Candidatos"
      documentsConfig={{
        endpoint: '/candidate-documents',
        title: 'Documentos do candidato',
        fileField: 'document',
        showOnCreate: true,
        defaultDocumentType: 'curriculo',
        typePlaceholder: 'Ex.: currículo, RG, CPF, certificado',
      }}
    />
  );
}

export default Candidatos;
