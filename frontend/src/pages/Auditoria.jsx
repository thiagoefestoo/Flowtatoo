import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const API_FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

const initialFilters = {
  q: '',
  entityType: '',
  action: '',
  dateFrom: '',
  dateTo: '',
};

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatFileSize(value) {
  const size = Number(value || 0);

  if (size < 1024) return `${size} B`;

  return `${(size / 1024).toFixed(2)} KB`;
}

function getActionLabel(action) {
  const labels = {
    purchase_created: 'Compra criada',
    purchase_approval_requested: 'Compra enviada para aprovação',
    purchase_approved: 'Compra aprovada',
    purchase_rejected: 'Compra reprovada',
    purchase_cancelled: 'Compra cancelada',

    sale_created: 'Venda criada',
    sale_approval_requested: 'Venda enviada para aprovação',
    sale_approved: 'Venda aprovada',
    sale_rejected: 'Venda reprovada',
    sale_cancelled: 'Venda cancelada',

    contract_created: 'Contrato criado',
    contract_updated: 'Contrato atualizado',
    contract_approval_requested: 'Contrato enviado para aprovação',
    contract_approved: 'Contrato aprovado',
    contract_rejected: 'Contrato reprovado',
    contract_cancelled: 'Contrato cancelado',

    project_created: 'Projeto criado',
    project_updated: 'Projeto atualizado',
    project_approval_requested: 'Projeto enviado para aprovação',
    project_approved: 'Projeto aprovado',
    project_rejected: 'Projeto reprovado',
    project_cancelled: 'Projeto cancelado',

    product_created: 'Produto criado',
    product_updated: 'Produto atualizado',
    product_inactivated: 'Produto inativado',
    product_approval_requested: 'Produto enviado para aprovação',
    product_approved: 'Produto aprovado',
    product_rejected: 'Produto reprovado',

    financial_created: 'Financeiro criado',
    financial_updated: 'Financeiro atualizado',
    financial_paid: 'Financeiro pago',
    financial_cancelled: 'Financeiro cancelado',

    customer_created: 'Cliente criado',
    customer_updated: 'Cliente atualizado',
    customer_inactivated: 'Cliente inativado',
    customer_approval_requested: 'Cliente enviado para aprovação',
    customer_approved: 'Cliente aprovado',
    customer_rejected: 'Cliente reprovado',
    customer_approval_pendente: 'Cliente enviado para aprovação',
    customer_approval_aprovado: 'Cliente aprovado',
    customer_approval_reprovado: 'Cliente reprovado',
    customer_document_uploaded: 'Documento de cliente anexado',
    customer_document_deleted: 'Documento de cliente removido',

    supplier_created: 'Fornecedor criado',
    supplier_updated: 'Fornecedor atualizado',
    supplier_inactivated: 'Fornecedor inativado',
    supplier_approval_requested: 'Fornecedor enviado para aprovação',
    supplier_approved: 'Fornecedor aprovado',
    supplier_rejected: 'Fornecedor reprovado',
    supplier_document_uploaded: 'Documento de fornecedor anexado',
    supplier_document_deleted: 'Documento de fornecedor removido',

    company_created: 'Empresa criada',
    company_updated: 'Empresa atualizada',
    company_inactivated: 'Empresa inativada',
    company_approval_requested: 'Empresa enviada para aprovação',
    company_approved: 'Empresa aprovada',
    company_rejected: 'Empresa reprovada',
    company_document_uploaded: 'Documento de empresa anexado',
    company_document_deleted: 'Documento de empresa removido',
    crm_campaign_document_uploaded: 'Documento de campanha anexado',
    crm_campaign_document_deleted: 'Documento de campanha removido',
    crm_opportunity_document_uploaded: 'Documento de oportunidade anexado',
    crm_opportunity_document_deleted: 'Documento de oportunidade removido',

    crm_activity_created: 'Atividade criada',
    crm_activity_updated: 'Atividade atualizada',
    crm_activity_deleted: 'Atividade removida',
    crm_activity_approval_requested: 'Atividade enviada para aprovação',
    crm_activity_approval_pendente: 'Atividade enviada para aprovação',
    crm_activity_approved: 'Atividade aprovada',
    crm_activity_approval_aprovado: 'Atividade aprovada',
    crm_activity_rejected: 'Atividade reprovada',
    crm_activity_approval_reprovado: 'Atividade reprovada',
    crm_activity_document_uploaded: 'Documento de atividade anexado',
    crm_activity_document_deleted: 'Documento de atividade removido',

    crm_proposal_created: 'Proposta criada',
    crm_proposal_updated: 'Proposta atualizada',
    crm_proposal_deleted: 'Proposta removida',
    crm_proposal_approval_requested: 'Proposta enviada para aprovação',
    crm_proposal_approved: 'Proposta aprovada',
    crm_proposal_rejected: 'Proposta reprovada',
    crm_proposal_approval_pendente: 'Proposta enviada para aprovação',
    crm_proposal_approval_aprovado: 'Proposta aprovada',
    crm_proposal_approval_reprovado: 'Proposta reprovada',
    crm_proposal_document_uploaded: 'Documento de proposta anexado',
    crm_proposal_document_deleted: 'Documento de proposta removido',

    crm_lead_created: 'Lead criado',
    crm_lead_updated: 'Lead atualizado',
    crm_opportunity_created: 'Oportunidade criada',
    crm_opportunity_updated: 'Oportunidade atualizada',
    crm_opportunity_approval_requested: 'Oportunidade enviada para aprovação',
    crm_opportunity_approved: 'Oportunidade aprovada',
    crm_opportunity_rejected: 'Oportunidade reprovada',
    crm_opportunity_approval_pendente: 'Oportunidade enviada para aprovação',
    crm_opportunity_approval_aprovado: 'Oportunidade aprovada',
    crm_opportunity_approval_reprovado: 'Oportunidade reprovada',
    crm_interaction_created: 'Interação criada',
    crm_interaction_updated: 'Interação atualizada',
    crm_campaign_created: 'Campanha criada',
    crm_campaign_updated: 'Campanha atualizada',
    crm_campaign_approval_requested: 'Campanha enviada para aprovação',
    crm_campaign_approved: 'Campanha aprovada',
    crm_campaign_rejected: 'Campanha reprovada',
    crm_campaign_approval_pendente: 'Campanha enviada para aprovação',
    crm_campaign_approval_aprovado: 'Campanha aprovada',
    crm_campaign_approval_reprovado: 'Campanha reprovada',
  };

  return labels[action] || action;
}

function getModuleLabel(entityType) {
  const labels = {
    purchase: 'Compras',
    sale: 'Vendas',
    contract: 'Contratos',
    project: 'Projetos',
    product: 'Produtos',
    financial: 'Financeiro',
    customer: 'Clientes',
    supplier: 'Fornecedores',
    company: 'Empresas',
    crm_activity: 'Atividades',
    crm_proposal: 'Propostas',
    crm_lead: 'Leads',
    crm_opportunity: 'Oportunidades',
    crm_interaction: 'Interações',
    crm_campaign: 'Campanhas',
  };

  return labels[entityType] || entityType || '-';
}

function getCurrentMetadata(metadata, preferredKey) {
  const current = metadata.current || metadata.after || {};
  const before = metadata.before || metadata.previous || {};

  if (preferredKey && current[preferredKey]) return current;
  if (current.name || current.number || current.code || current.description || current.corporateName || current.title) return current;
  if (preferredKey && before[preferredKey]) return before;
  if (before.name || before.number || before.code || before.description || before.corporateName || before.title) return before;

  return metadata;
}

function renderChange(beforeValue, afterValue, label, formatter) {
  if (beforeValue === undefined || afterValue === undefined) return null;
  if (beforeValue === afterValue) return null;

  const beforeText = formatter ? formatter(beforeValue) : beforeValue;
  const afterText = formatter ? formatter(afterValue) : afterValue;

  return (
    <span>
      {label}: {beforeText} → {afterText}
    </span>
  );
}

function renderMetadata(log) {
  const metadata = log.metadata || {};
  const before = metadata.before || metadata.previous || {};
  const after = metadata.after || metadata.current || {};
  const paymentProof = metadata.paymentProof || {};

  if (
    log.action === 'supplier_document_uploaded' ||
    log.action === 'supplier_document_deleted' ||
    log.action === 'customer_document_uploaded' ||
    log.action === 'customer_document_deleted' ||
    log.action === 'crm_activity_document_uploaded' ||
    log.action === 'crm_activity_document_deleted' ||
    log.action === 'crm_proposal_document_uploaded' ||
    log.action === 'crm_proposal_document_deleted' ||
    log.action === 'company_document_uploaded' ||
    log.action === 'company_document_deleted' ||
    log.action === 'crm_campaign_document_uploaded' ||
    log.action === 'crm_campaign_document_deleted' ||
    log.action === 'crm_opportunity_document_uploaded' ||
    log.action === 'crm_opportunity_document_deleted'
  ) {
    return (
      <>
        {metadata.customerName && <span>Cliente: {metadata.customerName}</span>}
        {metadata.supplierName && <span>Fornecedor: {metadata.supplierName}</span>}
        {metadata.activityTitle && <span>Atividade: {metadata.activityTitle}</span>}
        {metadata.proposalNumber && <span>Proposta: {metadata.proposalNumber}</span>}
        {metadata.proposalTitle && <span>Título da proposta: {metadata.proposalTitle}</span>}
        {metadata.entityName && <span>Registro: {metadata.entityName}</span>}
        {metadata.documentType && <span>Tipo do documento: {metadata.documentType}</span>}
        {metadata.originalName && <span>Arquivo: {metadata.originalName}</span>}
        {metadata.fileName && <span>Nome interno: {metadata.fileName}</span>}
        {metadata.sizeBytes !== undefined && (
          <span>Tamanho: {formatFileSize(metadata.sizeBytes)}</span>
        )}
        {metadata.notes && <span>Observações: {metadata.notes}</span>}

        {metadata.filePath && (
          <a
            className="audit-file-link"
            href={`${API_FILE_BASE_URL}${metadata.filePath}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir documento
          </a>
        )}
      </>
    );
  }

  if (log.entityType === 'purchase') {
    const current = getCurrentMetadata(metadata, 'number');

    return (
      <>
        {current.number && <span>Compra: {current.number}</span>}
        {current.total !== undefined && <span>Valor: {formatCurrency(current.total)}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
        {renderChange(before.total, after.total, 'Valor', formatCurrency)}
      </>
    );
  }

  if (log.entityType === 'sale') {
    const current = getCurrentMetadata(metadata, 'number');

    return (
      <>
        {current.number && <span>Venda: {current.number}</span>}
        {current.customerId && <span>Cliente ID: {current.customerId}</span>}
        {current.total !== undefined && <span>Valor: {formatCurrency(current.total)}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
        {renderChange(before.total, after.total, 'Valor', formatCurrency)}
      </>
    );
  }

  if (log.entityType === 'contract') {
    const current = getCurrentMetadata(metadata, 'number');

    return (
      <>
        {current.number && <span>Contrato: {current.number}</span>}
        {current.title && <span>Título: {current.title}</span>}
        {current.type && <span>Tipo: {current.type}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {current.monthlyValue !== undefined && (
          <span>Valor mensal: {formatCurrency(current.monthlyValue)}</span>
        )}
        {current.totalValue !== undefined && (
          <span>Valor total: {formatCurrency(current.totalValue)}</span>
        )}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
      </>
    );
  }

  if (log.entityType === 'project') {
    const current = getCurrentMetadata(metadata, 'code');

    return (
      <>
        {current.code && <span>Projeto: {current.code}</span>}
        {current.name && <span>Nome: {current.name}</span>}
        {current.managerName && <span>Responsável: {current.managerName}</span>}
        {current.priority && <span>Prioridade: {current.priority}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {current.budget !== undefined && <span>Orçamento: {formatCurrency(current.budget)}</span>}
        {current.progress !== undefined && <span>Progresso: {current.progress}%</span>}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
      </>
    );
  }

  if (log.entityType === 'product') {
    const current = getCurrentMetadata(metadata, 'name');

    return (
      <>
        {current.name && <span>Produto: {current.name}</span>}
        {current.sku && <span>SKU: {current.sku}</span>}
        {current.barcode && <span>Código de barras: {current.barcode}</span>}
        {current.supplierId && <span>Fornecedor ID: {current.supplierId}</span>}
        {current.type && <span>Tipo: {current.type}</span>}
        {current.category && <span>Categoria: {current.category}</span>}
        {current.unit && <span>Unidade: {current.unit}</span>}
        {current.costPrice !== undefined && <span>Custo: {formatCurrency(current.costPrice)}</span>}
        {current.salePrice !== undefined && <span>Venda: {formatCurrency(current.salePrice)}</span>}
        {current.currentStock !== undefined && <span>Estoque atual: {current.currentStock}</span>}
        {current.minStock !== undefined && <span>Estoque mínimo: {current.minStock}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {(metadata.reason || current.rejectionReason) && (
          <span>Motivo: {metadata.reason || current.rejectionReason}</span>
        )}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
        {renderChange(before.currentStock, after.currentStock, 'Estoque')}
        {renderChange(before.salePrice, after.salePrice, 'Venda', formatCurrency)}
      </>
    );
  }

  if (log.entityType === 'financial') {
    const current = getCurrentMetadata(metadata, 'description');

    return (
      <>
        {current.description && <span>Lançamento: {current.description}</span>}
        {current.reference && <span>Referência: {current.reference}</span>}
        {current.type && <span>Tipo: {current.type}</span>}
        {current.dueDate && <span>Vencimento: {current.dueDate}</span>}
        {current.amount !== undefined && <span>Valor: {formatCurrency(current.amount)}</span>}
        {current.paidAmount !== undefined && Number(current.paidAmount || 0) > 0 && (
          <span>Valor pago: {formatCurrency(current.paidAmount)}</span>
        )}
        {current.paymentDate && <span>Data pagamento: {current.paymentDate}</span>}
        {current.paymentMethod && <span>Forma pagamento: {current.paymentMethod}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.amount, after.amount, 'Valor', formatCurrency)}

        {paymentProof.originalName && (
          <>
            <span>Comprovante: {paymentProof.originalName}</span>

            {paymentProof.proofNumber && (
              <span>Nº comprovante/NSU: {paymentProof.proofNumber}</span>
            )}

            {paymentProof.bankAccount && <span>Banco/conta: {paymentProof.bankAccount}</span>}

            {paymentProof.sizeBytes !== undefined && (
              <span>Tamanho: {formatFileSize(paymentProof.sizeBytes)}</span>
            )}

            {paymentProof.notes && <span>Observações: {paymentProof.notes}</span>}

            {paymentProof.filePath && (
              <a
                className="audit-file-link"
                href={`${API_FILE_BASE_URL}${paymentProof.filePath}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir comprovante
              </a>
            )}
          </>
        )}
      </>
    );
  }

  if (log.entityType === 'customer' || log.entityType === 'supplier') {
    const current = getCurrentMetadata(metadata, 'name');

    return (
      <>
        {current.name && (
          <span>
            {log.entityType === 'customer' ? 'Cliente' : 'Fornecedor'}: {current.name}
          </span>
        )}
        {current.tradeName && <span>Nome fantasia: {current.tradeName}</span>}
        {current.document && <span>Documento: {current.document}</span>}
        {current.type && <span>Tipo: {current.type}</span>}
        {current.email && <span>E-mail: {current.email}</span>}
        {current.phone && <span>Telefone: {current.phone}</span>}
        {current.contactName && <span>Contato: {current.contactName}</span>}
        {current.city && <span>Cidade: {current.city}</span>}
        {current.state && <span>Estado: {current.state}</span>}
        {current.segment && <span>Segmento: {current.segment}</span>}
        {current.category && <span>Categoria: {current.category}</span>}
        {current.paymentTerms && <span>Pagamento: {current.paymentTerms}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
        {renderChange(before.name, after.name, 'Nome')}
        {renderChange(before.document, after.document, 'Documento')}
      </>
    );
  }

  if (log.entityType === 'company') {
    const current = getCurrentMetadata(metadata, 'corporateName');

    return (
      <>
        {current.corporateName && <span>Razão social: {current.corporateName}</span>}
        {current.tradeName && <span>Nome fantasia: {current.tradeName}</span>}
        {current.document && <span>Documento: {current.document}</span>}
        {current.type && <span>Tipo: {current.type}</span>}
        {current.email && <span>E-mail: {current.email}</span>}
        {current.phone && <span>Telefone: {current.phone}</span>}
        {current.city && <span>Cidade: {current.city}</span>}
        {current.state && <span>Estado: {current.state}</span>}
        {current.approvalStatus && <span>Aprovação: {current.approvalStatus}</span>}
        {(metadata.reason || metadata.approvalNote || current.approvalNote) && (
          <span>Observação da aprovação: {metadata.reason || metadata.approvalNote || current.approvalNote}</span>
        )}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.approvalStatus, after.approvalStatus, 'Aprovação')}
        {renderChange(before.corporateName, after.corporateName, 'Razão social')}
        {renderChange(before.document, after.document, 'Documento')}
      </>
    );
  }

  if (log.entityType?.startsWith('crm_')) {
    const current = getCurrentMetadata(metadata, 'title');

    return (
      <>
        {current.title && <span>Título: {current.title}</span>}
        {current.name && <span>Nome: {current.name}</span>}
        {current.number && <span>Número: {current.number}</span>}
        {current.document && <span>Documento: {current.document}</span>}
        {current.company && <span>Empresa: {current.company}</span>}
        {current.email && <span>E-mail: {current.email}</span>}
        {current.phone && <span>Telefone: {current.phone}</span>}
        {current.status && <span>Status: {current.status}</span>}
        {current.stage && <span>Etapa: {current.stage}</span>}
        {current.value !== undefined && <span>Valor: {formatCurrency(current.value)}</span>}
        {metadata.reason && <span>Motivo: {metadata.reason}</span>}

        {renderChange(before.status, after.status, 'Status')}
        {renderChange(before.stage, after.stage, 'Etapa')}
        {renderChange(before.value, after.value, 'Valor', formatCurrency)}
      </>
    );
  }

  return <span>-</span>;
}


const hiddenAuditMetadataFields = new Set([
  'id',
  'ownerId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'password',
  'passwordHash',
  'token',
]);

const auditMetadataLabels = {
  name: 'Nome',
  title: 'Título',
  number: 'Número',
  code: 'Código',
  company: 'Empresa',
  corporateName: 'Razão social',
  tradeName: 'Nome fantasia',
  document: 'Documento',
  email: 'E-mail',
  phone: 'Telefone',
  status: 'Status',
  approvalStatus: 'Status de aprovação',
  approvalNote: 'Observação da aprovação',
  stage: 'Etapa',
  source: 'Origem',
  channel: 'Canal',
  notes: 'Observações',
  description: 'Descrição',
  reason: 'Motivo',
  value: 'Valor',
  total: 'Total',
  amount: 'Valor',
  budget: 'Orçamento',
  expectedRevenue: 'Receita prevista',
  leadsGenerated: 'Leads gerados',
  opportunitiesGenerated: 'Oportunidades geradas',
  startDate: 'Data inicial',
  endDate: 'Data final',
  expectedCloseDate: 'Previsão de fechamento',
  probability: 'Probabilidade',
  priority: 'Prioridade',
  type: 'Tipo',
};

function getAuditMetadataLabel(key) {
  if (auditMetadataLabels[key]) return auditMetadataLabels[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (text) => text.toUpperCase());
}

function formatAuditMetadataValue(key, value) {
  if (value === null || value === undefined || value === '') return '-';

  if (['value', 'total', 'amount', 'budget', 'expectedRevenue'].includes(key)) {
    return formatCurrency(value);
  }

  if (['startDate', 'endDate', 'expectedCloseDate', 'approvalRequestedAt', 'approvalDecidedAt'].includes(key)) {
    return formatDateTime(value);
  }

  if (key === 'probability') {
    return `${value}%`;
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (typeof value === 'object') {
    return null;
  }

  return String(value);
}

function getReadableMetadataItems(log) {
  const metadata = log?.metadata || {};
  const current = getCurrentMetadata(metadata, 'title');
  const source = current && typeof current === 'object' ? current : metadata;

  return Object.entries(source)
    .filter(([key, value]) => !hiddenAuditMetadataFields.has(key) && typeof value !== 'object')
    .map(([key, value]) => ({
      key,
      label: getAuditMetadataLabel(key),
      value: formatAuditMetadataValue(key, value),
    }))
    .filter((item) => item.value !== null);
}

function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  async function loadLogs() {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.action) params.set('action', filters.action);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);

    const query = params.toString();

    const result = await apiRequest(`/audit-logs${query ? `?${query}` : ''}`);

    setLogs(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/audit-logs/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);
      setMessage('');

      await Promise.all([loadLogs(), loadStats()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadData();
  }

  async function handleClearFilters() {
    setFilters(initialFilters);

    setTimeout(() => {
      loadData();
    }, 0);
  }

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Governança</span>
          <h1>Auditoria</h1>
          <p>
            Acompanhe ações importantes realizadas no sistema, com usuário,
            data, módulo e descrição do evento.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Eventos registrados</p>
        </article>

        <article>
          <span>Financeiro</span>
          <strong>{stats?.financeiros || 0}</strong>
          <p>Eventos financeiros</p>
        </article>

        <article>
          <span>Clientes</span>
          <strong>{stats?.clientes || 0}</strong>
          <p>Eventos de clientes</p>
        </article>

        <article>
          <span>Fornecedores</span>
          <strong>{stats?.fornecedores || 0}</strong>
          <p>Eventos de fornecedores</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>Filtros</h2>
            <p>Pesquise por descrição, ação, módulo ou período.</p>
          </div>
        </div>

        <form className="company-form" onSubmit={handleSearch}>
          <label>
            Buscar
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Ex: compra, aprovação, número..."
            />
          </label>

          <label>
            Módulo
            <select
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="purchase">Compras</option>
              <option value="sale">Vendas</option>
              <option value="contract">Contratos</option>
              <option value="project">Projetos</option>
              <option value="product">Produtos</option>
              <option value="financial">Financeiro</option>
              <option value="customer">Clientes</option>
              <option value="supplier">Fornecedores</option>
              <option value="company">Empresas</option>
              <option value="crm_lead">Leads</option>
              <option value="crm_opportunity">Oportunidades</option>
              <option value="crm_activity">Atividades</option>
              <option value="crm_proposal">Propostas</option>
              <option value="crm_interaction">Interações</option>
              <option value="crm_campaign">Campanhas</option>
            </select>
          </label>

          <label>
            Ação
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
            >
              <option value="">Todas</option>

              <option value="purchase_created">Compra criada</option>
              <option value="purchase_approval_requested">Compra enviada para aprovação</option>
              <option value="purchase_approved">Compra aprovada</option>
              <option value="purchase_rejected">Compra reprovada</option>
              <option value="purchase_cancelled">Compra cancelada</option>

              <option value="sale_created">Venda criada</option>
              <option value="sale_approval_requested">Venda enviada para aprovação</option>
              <option value="sale_approved">Venda aprovada</option>
              <option value="sale_rejected">Venda reprovada</option>
              <option value="sale_cancelled">Venda cancelada</option>

              <option value="contract_created">Contrato criado</option>
              <option value="contract_updated">Contrato atualizado</option>
              <option value="contract_approval_requested">Contrato enviado para aprovação</option>
              <option value="contract_approved">Contrato aprovado</option>
              <option value="contract_rejected">Contrato reprovado</option>
              <option value="contract_cancelled">Contrato cancelado</option>

              <option value="project_created">Projeto criado</option>
              <option value="project_updated">Projeto atualizado</option>
              <option value="project_approval_requested">Projeto enviado para aprovação</option>
              <option value="project_approved">Projeto aprovado</option>
              <option value="project_rejected">Projeto reprovado</option>
              <option value="project_cancelled">Projeto cancelado</option>

              <option value="product_created">Produto criado</option>
              <option value="product_updated">Produto atualizado</option>
              <option value="product_inactivated">Produto inativado</option>
              <option value="product_approval_requested">Produto enviado para aprovação</option>
              <option value="product_approved">Produto aprovado</option>
              <option value="product_rejected">Produto reprovado</option>

              <option value="financial_created">Financeiro criado</option>
              <option value="financial_updated">Financeiro atualizado</option>
              <option value="financial_paid">Financeiro pago</option>
              <option value="financial_cancelled">Financeiro cancelado</option>

              <option value="customer_created">Cliente criado</option>
              <option value="customer_updated">Cliente atualizado</option>
              <option value="customer_inactivated">Cliente inativado</option>
              <option value="customer_approval_requested">Cliente enviado para aprovação</option>
              <option value="customer_approved">Cliente aprovado</option>
              <option value="customer_rejected">Cliente reprovado</option>
              <option value="customer_document_uploaded">Documento de cliente anexado</option>
              <option value="customer_document_deleted">Documento de cliente removido</option>

              <option value="supplier_created">Fornecedor criado</option>
              <option value="supplier_updated">Fornecedor atualizado</option>
              <option value="supplier_inactivated">Fornecedor inativado</option>
              <option value="supplier_approval_requested">Fornecedor enviado para aprovação</option>
              <option value="supplier_approved">Fornecedor aprovado</option>
              <option value="supplier_rejected">Fornecedor reprovado</option>
              <option value="supplier_document_uploaded">Documento de fornecedor anexado</option>
              <option value="supplier_document_deleted">Documento de fornecedor removido</option>

              <option value="company_created">Empresa criada</option>
              <option value="company_updated">Empresa atualizada</option>
              <option value="company_inactivated">Empresa inativada</option>
              <option value="company_document_uploaded">Documento de empresa anexado</option>
              <option value="company_document_deleted">Documento de empresa removido</option>
              <option value="crm_campaign_document_uploaded">Documento de campanha anexado</option>
              <option value="crm_campaign_document_deleted">Documento de campanha removido</option>
              <option value="crm_opportunity_document_uploaded">Documento de oportunidade anexado</option>
              <option value="crm_opportunity_document_deleted">Documento de oportunidade removido</option>

              <option value="crm_activity_created">Atividade criada</option>
              <option value="crm_activity_updated">Atividade atualizada</option>
              <option value="crm_activity_approval_requested">Atividade enviada para aprovação</option>
              <option value="crm_activity_approved">Atividade aprovada</option>
              <option value="crm_activity_rejected">Atividade reprovada</option>
              <option value="crm_activity_document_uploaded">Documento de atividade anexado</option>
              <option value="crm_activity_document_deleted">Documento de atividade removido</option>
              <option value="crm_opportunity_approval_requested">Oportunidade enviada para aprovação</option>
              <option value="crm_opportunity_approved">Oportunidade aprovada</option>
              <option value="crm_opportunity_rejected">Oportunidade reprovada</option>
              <option value="crm_campaign_approval_requested">Campanha enviada para aprovação</option>
              <option value="crm_campaign_approved">Campanha aprovada</option>
              <option value="crm_campaign_rejected">Campanha reprovada</option>
              <option value="crm_proposal_created">Proposta criada</option>
              <option value="crm_proposal_updated">Proposta atualizada</option>
              <option value="crm_proposal_approval_requested">Proposta enviada para aprovação</option>
              <option value="crm_proposal_approved">Proposta aprovada</option>
              <option value="crm_proposal_rejected">Proposta reprovada</option>
              <option value="crm_proposal_document_uploaded">Documento de proposta anexado</option>
              <option value="crm_proposal_document_deleted">Documento de proposta removido</option>
            </select>
          </label>

          <label>
            Data inicial
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Data final
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>

            <button
              type="button"
              className="ghost-button"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Limpar filtros
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Histórico do sistema</h2>
            <p>{logs.length} evento(s) encontrado(s)</p>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Data/Hora</th>
                <th>Resumo</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <strong>{log.description}</strong>
                    <span>ID: {log.entityId || '-'}</span>
                  </td>

                  <td>{getModuleLabel(log.entityType)}</td>

                  <td>
                    <span className={`audit-action audit-${log.action}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>

                  <td>
                    <strong>{log.user?.name || '-'}</strong>
                    <span>{log.user?.email || ''}</span>
                  </td>

                  <td>{formatDateTime(log.createdAt)}</td>

                  <td className="audit-details-cell">
                    {renderMetadata(log)}
                  </td>

                  <td>
                    <div className="table-actions">
                      <button type="button" className="details-button" onClick={() => setSelectedLog(log)}>
                        Detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Nenhum evento de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedLog && (
        <div className="record-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="record-modal-card audit-detail-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header">
              <div>
                <span>Histórico completo</span>
                <h2>Detalhes do evento de auditoria</h2>
                <p>Veja todas as informações registradas para rastreabilidade, conferência e governança.</p>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)}>×</button>
            </div>

            <div className="record-detail-grid">
              <div className="record-detail-item full">
                <small>Descrição</small>
                <strong>{selectedLog.description || '-'}</strong>
              </div>

              <div className="record-detail-item">
                <small>Módulo</small>
                <strong>{getModuleLabel(selectedLog.entityType)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Ação</small>
                <strong>{getActionLabel(selectedLog.action)}</strong>
              </div>
              <div className="record-detail-item">
                <small>ID do registro</small>
                <strong>{selectedLog.entityId || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Data/Hora</small>
                <strong>{formatDateTime(selectedLog.createdAt)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Usuário</small>
                <strong>{selectedLog.user?.name || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>E-mail do usuário</small>
                <strong>{selectedLog.user?.email || '-'}</strong>
              </div>

              <div className="record-detail-item full audit-modal-summary">
                <small>Resumo detalhado</small>
                <div className="audit-details-cell audit-details-expanded">
                  {renderMetadata(selectedLog)}
                </div>
              </div>

              <div className="record-detail-item full">
                <small>Informações complementares</small>
                <div className="audit-readable-list">
                  {getReadableMetadataItems(selectedLog).map((item) => (
                    <p key={item.key}>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </p>
                  ))}

                  {getReadableMetadataItems(selectedLog).length === 0 && (
                    <p>
                      <strong>Registro</strong>
                      <span>Nenhuma informação complementar disponível.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="record-modal-footer">
              <button type="button" onClick={() => setSelectedLog(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Auditoria;
