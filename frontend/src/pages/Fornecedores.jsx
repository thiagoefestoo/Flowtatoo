import { useEffect, useMemo, useState } from 'react';

import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';
import { getToken } from '../services/auth';

const API_FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

const emptyForm = {
  type: 'pessoa_juridica',
  name: '',
  tradeName: '',
  document: '',
  stateRegistration: '',
  email: '',
  phone: '',
  contactName: '',
  zipCode: '',
  address: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  category: '',
  paymentTerms: '',
  status: 'bloqueado',
  approvalStatus: 'nao_enviado',
  notes: '',
};

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR');
}

function formatFileSize(value) {
  const size = Number(value || 0);

  if (size < 1024) return `${size} B`;

  return `${(size / 1024).toFixed(2)} KB`;
}

function getStatusLabel(status) {
  const labels = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    bloqueado: 'Bloqueado',
  };

  return labels[status] || status || '-';
}

function getApprovalStatusLabel(status) {
  const labels = {
    nao_enviado: 'Não enviado',
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
  };

  return labels[status] || status || 'Não enviado';
}

function Fornecedores() {
  const { confirm, alert, prompt: promptModal } = useAppModal();

  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    bloqueados: 0,
    pessoaFisica: 0,
    pessoaJuridica: 0,
    pendentesAprovacao: 0,
    aprovados: 0,
    reprovados: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    status: '',
    category: '',
    approvalStatus: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [documentModal, setDocumentModal] = useState({
    open: false,
    supplier: null,
    documents: [],
  });

  const [documentForm, setDocumentForm] = useState({
    documentType: 'documento',
    notes: '',
    file: null,
  });

  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const [detailModal, setDetailModal] = useState({
    open: false,
    supplier: null,
    documents: [],
    auditLogs: [],
  });

  const [detailLoading, setDetailLoading] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadSuppliers() {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.approvalStatus) params.set('approvalStatus', filters.approvalStatus);

    const query = params.toString();
    const result = await apiRequest(`/suppliers${query ? `?${query}` : ''}`);

    setSuppliers(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/suppliers/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadSuppliers(), loadStats()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(supplier) {
    setEditingId(supplier.id);

    setForm({
      type: supplier.type || 'pessoa_juridica',
      name: supplier.name || '',
      tradeName: supplier.tradeName || '',
      document: supplier.document || '',
      stateRegistration: supplier.stateRegistration || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contactName: supplier.contactName || '',
      zipCode: supplier.zipCode || '',
      address: supplier.address || '',
      number: supplier.number || '',
      complement: supplier.complement || '',
      district: supplier.district || '',
      city: supplier.city || '',
      state: supplier.state || '',
      category: supplier.category || '',
      paymentTerms: supplier.paymentTerms || '',
      status: supplier.status || 'bloqueado',
      approvalStatus: supplier.approvalStatus || 'nao_enviado',
      notes: supplier.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint = isEditing ? `/suppliers/${editingId}` : '/suppliers';
      const method = isEditing ? 'PUT' : 'POST';

      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      setMessage(
        result.message ||
          (isEditing
            ? 'Fornecedor atualizado com sucesso.'
            : 'Fornecedor criado como bloqueado. Envie para aprovação antes de ativar.')
      );

      resetForm();
      await loadData();
    } catch (error) {
      const errorMessage = error.message || 'Erro ao salvar fornecedor.';

      if (
        errorMessage.toLowerCase().includes('documento') ||
        errorMessage.toLowerCase().includes('fornecedor com este documento')
      ) {
        await alert({
          title: 'Fornecedor já cadastrado',
          message:
            'Já existe um fornecedor com este documento. Verifique o CPF/CNPJ informado ou edite o fornecedor existente.',
          confirmText: 'Entendi',
          danger: true,
        });

        setMessage('Fornecedor com documento já cadastrado.');
        return;
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestApproval(supplier) {
    const confirmed = await confirm({
      title: 'Enviar fornecedor para aprovação',
      message: `Deseja enviar o fornecedor "${supplier.tradeName || supplier.name}" para aprovação?`,
      confirmText: 'Enviar para aprovação',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/suppliers/${supplier.id}/request-approval`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Fornecedor enviado para aprovação.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar fornecedor para aprovação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveSupplier(supplier) {
    const confirmed = await confirm({
      title: 'Aprovar fornecedor',
      message: `Deseja aprovar e ativar o fornecedor "${supplier.tradeName || supplier.name}"?`,
      confirmText: 'Aprovar fornecedor',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/suppliers/${supplier.id}/approve`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Fornecedor aprovado e ativado com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao aprovar fornecedor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectSupplier(supplier) {
    const reason = await promptModal({
      title: 'Reprovar fornecedor',
      message: `Informe o motivo da reprovação do fornecedor "${supplier.tradeName || supplier.name}".`,
      inputLabel: 'Motivo',
      inputPlaceholder: 'Ex: documentação pendente, dados divergentes, fornecedor não homologado...',
      confirmText: 'Reprovar fornecedor',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!reason) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/suppliers/${supplier.id}/reject-approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason,
        }),
      });

      setMessage(result.message || 'Fornecedor reprovado com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao reprovar fornecedor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(supplier) {
    const confirmed = await confirm({
      title: 'Inativar fornecedor',
      message: `Deseja inativar o fornecedor "${supplier.name}"?`,
      confirmText: 'Inativar',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Fornecedor inativado com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao inativar fornecedor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadSuppliers();
  }

  async function loadSupplierDocuments(supplierId) {
    const result = await apiRequest(`/supplier-documents/${supplierId}`);
    return extractData(result);
  }

  async function openDocumentModal(supplier) {
    try {
      setDocumentLoading(true);

      setDocumentModal({
        open: true,
        supplier,
        documents: [],
      });

      const documents = await loadSupplierDocuments(supplier.id);

      setDocumentModal({
        open: true,
        supplier,
        documents,
      });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar documentos do fornecedor.');
    } finally {
      setDocumentLoading(false);
    }
  }

  function closeDocumentModal() {
    setDocumentModal({
      open: false,
      supplier: null,
      documents: [],
    });

    setDocumentForm({
      documentType: 'documento',
      notes: '',
      file: null,
    });
  }

  function handleDocumentFormChange(event) {
    const { name, value, files } = event.target;

    if (name === 'file') {
      setDocumentForm((current) => ({
        ...current,
        file: files?.[0] || null,
      }));

      return;
    }

    setDocumentForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleUploadDocument(event) {
    event.preventDefault();

    if (!documentModal.supplier) return;

    if (!documentForm.file) {
      await alert({
        title: 'Arquivo obrigatório',
        message: 'Selecione um arquivo para anexar ao fornecedor.',
        confirmText: 'Entendi',
        danger: true,
      });

      return;
    }

    try {
      setDocumentUploading(true);

      const token = getToken();

      const formData = new FormData();
      formData.append('documentType', documentForm.documentType);
      formData.append('notes', documentForm.notes);
      formData.append('document', documentForm.file);

      const response = await fetch(
        `${API_FILE_BASE_URL}/api/supplier-documents/${documentModal.supplier.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Erro ao anexar documento.');
      }

      const documents = await loadSupplierDocuments(documentModal.supplier.id);

      setDocumentModal((current) => ({
        ...current,
        documents,
      }));

      setDocumentForm({
        documentType: 'documento',
        notes: '',
        file: null,
      });

      setMessage(result.message || 'Documento anexado com sucesso.');
    } catch (error) {
      setMessage(error.message || 'Erro ao anexar documento.');
    } finally {
      setDocumentUploading(false);
    }
  }

  async function handleDeleteDocument(document) {
    const confirmed = await confirm({
      title: 'Remover documento',
      message: `Deseja remover o documento "${document.originalName}"?`,
      confirmText: 'Remover',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setDocumentLoading(true);

      const result = await apiRequest(`/supplier-documents/${document.id}`, {
        method: 'DELETE',
      });

      const documents = await loadSupplierDocuments(documentModal.supplier.id);

      setDocumentModal((current) => ({
        ...current,
        documents,
      }));

      setMessage(result.message || 'Documento removido com sucesso.');
    } catch (error) {
      setMessage(error.message || 'Erro ao remover documento.');
    } finally {
      setDocumentLoading(false);
    }
  }

  async function openDetailModal(supplier) {
    try {
      setDetailLoading(true);

      setDetailModal({
        open: true,
        supplier,
        documents: [],
        auditLogs: [],
      });

      const [documentsResult, auditResult] = await Promise.all([
        apiRequest(`/supplier-documents/${supplier.id}`),
        apiRequest(`/audit-logs?entityType=supplier&entityId=${supplier.id}`),
      ]);

      setDetailModal({
        open: true,
        supplier,
        documents: extractData(documentsResult),
        auditLogs: extractData(auditResult),
      });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar detalhes do fornecedor.');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    setDetailModal({
      open: false,
      supplier: null,
      documents: [],
      auditLogs: [],
    });
  }

  const title = useMemo(() => {
    return isEditing ? 'Editar fornecedor' : 'Novo fornecedor';
  }, [isEditing]);

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Fornecedores</h1>
          <p>
            Cadastre fornecedores para compras, estoque, financeiro e relatórios,
            com aprovação antes da ativação.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      {detailModal.open && (
        <div className="app-modal-backdrop">
          <div className="app-modal-card supplier-detail-modal" role="dialog" aria-modal="true">
            <div className="app-modal-icon">i</div>

            <div className="app-modal-content">
              <h2>Detalhes do fornecedor</h2>
              <p>Consulte dados completos, aprovação, documentos e histórico.</p>

              <div className="supplier-detail-grid">
                <div>
                  <span>Nome / Razão social</span>
                  <strong>{detailModal.supplier?.name || '-'}</strong>
                </div>

                <div>
                  <span>Nome fantasia</span>
                  <strong>{detailModal.supplier?.tradeName || '-'}</strong>
                </div>

                <div>
                  <span>Tipo</span>
                  <strong>{detailModal.supplier?.type || '-'}</strong>
                </div>

                <div>
                  <span>Documento</span>
                  <strong>{detailModal.supplier?.document || '-'}</strong>
                </div>

                <div>
                  <span>Categoria</span>
                  <strong>{detailModal.supplier?.category || '-'}</strong>
                </div>

                <div>
                  <span>Condição de pagamento</span>
                  <strong>{detailModal.supplier?.paymentTerms || '-'}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{getStatusLabel(detailModal.supplier?.status)}</strong>
                </div>

                <div>
                  <span>Aprovação</span>
                  <strong>{getApprovalStatusLabel(detailModal.supplier?.approvalStatus)}</strong>
                </div>

                {detailModal.supplier?.rejectionReason && (
                  <div>
                    <span>Motivo da reprovação</span>
                    <strong>{detailModal.supplier.rejectionReason}</strong>
                  </div>
                )}

                <div>
                  <span>Contato</span>
                  <strong>{detailModal.supplier?.contactName || '-'}</strong>
                </div>

                <div>
                  <span>E-mail</span>
                  <strong>{detailModal.supplier?.email || '-'}</strong>
                </div>

                <div>
                  <span>Telefone</span>
                  <strong>{detailModal.supplier?.phone || '-'}</strong>
                </div>

                <div>
                  <span>Cidade / UF</span>
                  <strong>
                    {[detailModal.supplier?.city, detailModal.supplier?.state]
                      .filter(Boolean)
                      .join(' / ') || '-'}
                  </strong>
                </div>

                <div>
                  <span>Documentos</span>
                  <strong>
                    {detailLoading
                      ? 'Carregando...'
                      : `${detailModal.documents.length} documento(s)`}
                  </strong>
                </div>
              </div>

              {detailModal.supplier?.notes && (
                <div className="supplier-detail-notes">
                  <span>Observações</span>
                  <p>{detailModal.supplier.notes}</p>
                </div>
              )}

              <div className="supplier-document-list-box">
                <div className="supplier-document-title">
                  <strong>Documentos anexados</strong>
                  <span>{detailModal.documents.length} documento(s)</span>
                </div>

                <div className="supplier-document-list">
                  {detailModal.documents.map((document) => (
                    <div className="supplier-document-row" key={document.id}>
                      <div>
                        <strong>{document.originalName}</strong>
                        <span>
                          Tipo: {document.documentType} · Tamanho:{' '}
                          {formatFileSize(document.sizeBytes)}
                        </span>
                        {document.notes && <small>{document.notes}</small>}
                      </div>

                      <div className="supplier-document-actions">
                        <a
                          href={`${API_FILE_BASE_URL}${document.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir
                        </a>
                      </div>
                    </div>
                  ))}

                  {!detailLoading && detailModal.documents.length === 0 && (
                    <p>Nenhum documento anexado para este fornecedor.</p>
                  )}
                </div>
              </div>

              <div className="financial-audit-box">
                <div className="financial-audit-title">
                  <strong>Histórico do fornecedor</strong>
                  <span>
                    {detailLoading
                      ? 'Carregando...'
                      : `${detailModal.auditLogs.length} evento(s)`}
                  </span>
                </div>

                <div className="financial-audit-list">
                  {detailModal.auditLogs.map((log) => (
                    <div className="financial-audit-row" key={log.id}>
                      <div>
                        <strong>{log.description}</strong>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>

                      <small>{log.user?.name || 'Sistema'}</small>
                    </div>
                  ))}

                  {!detailLoading && detailModal.auditLogs.length === 0 && (
                    <p>Nenhum histórico encontrado para este fornecedor.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="app-modal-actions">
              <button type="button" className="ghost-button" onClick={closeDetailModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {documentModal.open && (
        <div className="app-modal-backdrop">
          <div className="app-modal-card supplier-document-modal" role="dialog" aria-modal="true">
            <div className="app-modal-icon">📎</div>

            <div className="app-modal-content">
              <h2>Documentos do fornecedor</h2>
              <p>
                Anexe contratos, certificados, propostas, tabelas e documentos importantes
                do fornecedor.
              </p>

              <div className="supplier-document-header">
                <span>Fornecedor</span>
                <strong>
                  {documentModal.supplier?.tradeName ||
                    documentModal.supplier?.name ||
                    '-'}
                </strong>
              </div>

              <form className="supplier-document-form" onSubmit={handleUploadDocument}>
                <label>
                  Tipo do documento
                  <select
                    name="documentType"
                    value={documentForm.documentType}
                    onChange={handleDocumentFormChange}
                  >
                    <option value="documento">Documento geral</option>
                    <option value="contrato_social">Contrato social</option>
                    <option value="cartao_cnpj">Cartão CNPJ</option>
                    <option value="certificado">Certificado</option>
                    <option value="proposta">Proposta comercial</option>
                    <option value="tabela_precos">Tabela de preços</option>
                  </select>
                </label>

                <label>
                  Arquivo
                  <input
                    type="file"
                    name="file"
                    onChange={handleDocumentFormChange}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  />
                </label>

                <label className="form-full">
                  Observações
                  <textarea
                    name="notes"
                    value={documentForm.notes}
                    onChange={handleDocumentFormChange}
                    placeholder="Observações sobre este documento..."
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" disabled={documentUploading}>
                    {documentUploading ? 'Anexando...' : 'Anexar documento'}
                  </button>
                </div>
              </form>

              <div className="supplier-document-list-box">
                <div className="supplier-document-title">
                  <strong>Arquivos anexados</strong>
                  <span>
                    {documentLoading
                      ? 'Carregando...'
                      : `${documentModal.documents.length} documento(s)`}
                  </span>
                </div>

                <div className="supplier-document-list">
                  {documentModal.documents.map((document) => (
                    <div className="supplier-document-row" key={document.id}>
                      <div>
                        <strong>{document.originalName}</strong>
                        <span>
                          Tipo: {document.documentType} · Enviado por:{' '}
                          {document.uploadedByUser?.name || 'Sistema'}
                        </span>
                        {document.notes && <small>{document.notes}</small>}
                      </div>

                      <div className="supplier-document-actions">
                        <a
                          href={`${API_FILE_BASE_URL}${document.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir
                        </a>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDeleteDocument(document)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  {!documentLoading && documentModal.documents.length === 0 && (
                    <p>Nenhum documento anexado para este fornecedor.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="app-modal-actions">
              <button type="button" className="ghost-button" onClick={closeDocumentModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total || 0}</strong>
          <p>Fornecedores cadastrados.</p>
        </article>

        <article>
          <span>Ativos</span>
          <strong>{stats.ativos || 0}</strong>
          <p>Disponíveis para compras.</p>
        </article>

        <article>
          <span>Pendentes</span>
          <strong>{stats.pendentesAprovacao || 0}</strong>
          <p>Aguardando aprovação.</p>
        </article>

        <article>
          <span>Bloqueados</span>
          <strong>{stats.bloqueados || 0}</strong>
          <p>Não disponíveis para uso.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            <p>
              {isEditing
                ? 'Atualize os dados principais do fornecedor.'
                : 'O fornecedor será criado como bloqueado até aprovação.'}
            </p>
          </div>

          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="pessoa_juridica">Pessoa Jurídica</option>
              <option value="pessoa_fisica">Pessoa Física</option>
            </select>
          </label>

          <label>
            Nome / Razão social *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Nome fantasia
            <input name="tradeName" value={form.tradeName} onChange={handleChange} />
          </label>

          <label>
            CPF / CNPJ
            <input name="document" value={form.document} onChange={handleChange} />
          </label>

          <label>
            Categoria
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Tecnologia, serviços, materiais..."
            />
          </label>

          <label>
            Condição de pagamento
            <input
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleChange}
              placeholder="30 dias, boleto, PIX..."
            />
          </label>

          <label>
            Contato principal
            <input name="contactName" value={form.contactName} onChange={handleChange} />
          </label>

          <label>
            E-mail
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>

          <label>
            Telefone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <label>
            Cidade
            <input name="city" value={form.city} onChange={handleChange} />
          </label>

          <label>
            UF
            <input name="state" maxLength="2" value={form.state} onChange={handleChange} />
          </label>

          {isEditing && (
            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </label>
          )}

          <label className="form-full">
            Observações
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Criar fornecedor bloqueado'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Fornecedores cadastrados</h2>
            <p>{suppliers.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Buscar por nome, CNPJ, categoria..."
            />

            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos os tipos</option>
              <option value="pessoa_juridica">Pessoa Jurídica</option>
              <option value="pessoa_fisica">Pessoa Física</option>
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>

            <select
              name="approvalStatus"
              value={filters.approvalStatus}
              onChange={handleFilterChange}
            >
              <option value="">Todas as aprovações</option>
              <option value="nao_enviado">Não enviado</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Categoria</th>
                <th>Pagamento</th>
                <th>Cidade/UF</th>
                <th>Status</th>
                <th>Aprovação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <strong>{supplier.tradeName || supplier.name}</strong>
                    <span>{supplier.name}</span>
                  </td>

                  <td>{supplier.type}</td>
                  <td>{supplier.document || '-'}</td>
                  <td>{supplier.category || '-'}</td>
                  <td>{supplier.paymentTerms || '-'}</td>

                  <td>
                    {[supplier.city, supplier.state].filter(Boolean).join(' / ') || '-'}
                  </td>

                  <td>
                    <span className={`status-badge status-${supplier.status}`}>
                      {getStatusLabel(supplier.status)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge approval-${
                        supplier.approvalStatus || 'nao_enviado'
                      }`}
                    >
                      {getApprovalStatusLabel(supplier.approvalStatus)}
                    </span>

                    {supplier.rejectionReason && (
                      <small>{supplier.rejectionReason}</small>
                    )}
                  </td>

                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => openDetailModal(supplier)}>
                        Detalhes
                      </button>

                      <button type="button" onClick={() => openDocumentModal(supplier)}>
                        Documentos
                      </button>

                      {supplier.approvalStatus !== 'pendente' &&
                        supplier.approvalStatus !== 'aprovado' && (
                          <button type="button" onClick={() => handleEdit(supplier)}>
                            Editar
                          </button>
                        )}

                      {supplier.status === 'bloqueado' &&
                        ['nao_enviado', 'reprovado', null, undefined].includes(
                          supplier.approvalStatus
                        ) && (
                          <button
                            type="button"
                            onClick={() => handleRequestApproval(supplier)}
                          >
                            Enviar aprovação
                          </button>
                        )}

                      {supplier.status === 'bloqueado' &&
                        supplier.approvalStatus === 'pendente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveSupplier(supplier)}
                            >
                              Aprovar
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => handleRejectSupplier(supplier)}
                            >
                              Reprovar
                            </button>
                          </>
                        )}

                      {supplier.status !== 'inativo' && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(supplier)}
                        >
                          Inativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-table">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default Fornecedores;