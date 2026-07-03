import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData, getApiFileUrl } from '../services/api';
import { useAppModal } from '../components/AppModalProvider';

const emptyForm = {
  type: 'matriz',
  corporateName: '',
  tradeName: '',
  document: '',
  stateRegistration: '',
  municipalRegistration: '',
  email: '',
  phone: '',
  zipCode: '',
  address: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  status: 'ativa',
  notes: '',
};

const detailFields = [
  { key: 'type', label: 'Tipo' },
  { key: 'corporateName', label: 'Razão social' },
  { key: 'tradeName', label: 'Nome fantasia' },
  { key: 'document', label: 'CNPJ / Documento' },
  { key: 'stateRegistration', label: 'Inscrição estadual' },
  { key: 'municipalRegistration', label: 'Inscrição municipal' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'zipCode', label: 'CEP' },
  { key: 'address', label: 'Endereço' },
  { key: 'number', label: 'Número' },
  { key: 'complement', label: 'Complemento' },
  { key: 'district', label: 'Bairro' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'UF' },
  { key: 'status', label: 'Status' },
  { key: 'approvalStatus', label: 'Aprovação' },
  { key: 'approvalNote', label: 'Observação da aprovação', full: true },
  { key: 'notes', label: 'Observações', full: true },
];


const approvalStatusOptions = [
  { value: '', label: 'Todas as aprovações' },
  { value: 'nao_enviado', label: 'Não enviado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
];

const approvalStatusLabels = {
  nao_enviado: 'Não enviado',
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

function formatApprovalStatus(status) {
  return approvalStatusLabels[status] || status || '-';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value).replaceAll('_', ' ');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatFileSize(value) {
  const bytes = Number(value || 0);

  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Empresas() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ativas: 0,
    inativas: 0,
    matriz: 0,
    filiais: 0,
    aprovadas: 0,
    pendentes: 0,
    reprovadas: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ q: '', type: '', status: '', approvalStatus: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailCompany, setDetailCompany] = useState(null);
  const [documentCompany, setDocumentCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({ documentType: 'documento', notes: '', file: null });
  const [createDocumentForm, setCreateDocumentForm] = useState({ documentType: 'documento', notes: '', file: null });
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsMessage, setDocumentsMessage] = useState('');
  const { confirm, prompt } = useAppModal();

  const isEditing = Boolean(editingId);

  async function loadCompanies() {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.approvalStatus) params.set('approvalStatus', filters.approvalStatus);

    const query = params.toString();
    const result = await apiRequest(`/companies${query ? `?${query}` : ''}`);

    setCompanies(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/companies/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadCompanies(), loadStats()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar empresas.');
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
    setCreateDocumentForm({ documentType: 'documento', notes: '', file: null });
    setEditingId(null);
  }

  function handleEdit(company) {
    setEditingId(company.id);

    setForm({
      type: company.type || 'matriz',
      corporateName: company.corporateName || '',
      tradeName: company.tradeName || '',
      document: company.document || '',
      stateRegistration: company.stateRegistration || '',
      municipalRegistration: company.municipalRegistration || '',
      email: company.email || '',
      phone: company.phone || '',
      zipCode: company.zipCode || '',
      address: company.address || '',
      number: company.number || '',
      complement: company.complement || '',
      district: company.district || '',
      city: company.city || '',
      state: company.state || '',
      status: company.status || 'ativa',
      notes: company.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  async function uploadCompanyDocument(companyId, sourceForm) {
    const formData = new FormData();
    formData.append('document', sourceForm.file);
    formData.append('documentType', sourceForm.documentType || 'documento');
    formData.append('notes', sourceForm.notes || 'Documento anexado no cadastro inicial.');

    return apiRequest(`/entity-documents/company/${companyId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async function openCompanyDocuments(company) {
    setDocumentCompany(company);
    setDocuments([]);
    setDocumentsMessage('');
    setDocumentForm({ documentType: 'documento', notes: '', file: null });
    setDocumentsLoading(true);

    try {
      const result = await apiRequest(`/entity-documents/company/${company.id}`);
      setDocuments(extractData(result));
    } catch (error) {
      setDocumentsMessage(error.message || 'Erro ao carregar documentos.');
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleDocumentUpload(event) {
    event.preventDefault();

    if (!documentCompany) return;

    if (!documentForm.file) {
      setDocumentsMessage('Selecione um arquivo para anexar.');
      return;
    }

    setDocumentsLoading(true);
    setDocumentsMessage('');

    try {
      const result = await uploadCompanyDocument(documentCompany.id, documentForm);
      setDocumentsMessage(result.message || 'Documento anexado com sucesso.');
      setDocumentForm({ documentType: 'documento', notes: '', file: null });

      const refresh = await apiRequest(`/entity-documents/company/${documentCompany.id}`);
      setDocuments(extractData(refresh));
    } catch (error) {
      setDocumentsMessage(error.message || 'Erro ao anexar documento.');
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleDocumentDelete(document) {
    const confirmed = await confirm({
      title: 'Remover documento',
      message: `Deseja remover o documento ${document.originalName}?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      danger: true,
    });

    if (!confirmed) return;

    setDocumentsLoading(true);
    setDocumentsMessage('');

    try {
      const result = await apiRequest(`/entity-documents/company/${document.id}`, {
        method: 'DELETE',
      });

      setDocumentsMessage(result.message || 'Documento removido com sucesso.');
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (error) {
      setDocumentsMessage(error.message || 'Erro ao remover documento.');
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    if (!isEditing && !createDocumentForm.file) {
      setMessage('Anexe pelo menos um documento para criar a empresa / filial.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEditing ? `/companies/${editingId}` : '/companies';
      const method = isEditing ? 'PUT' : 'POST';

      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      if (!isEditing) {
        const companyId = result.data?.id;

        if (!companyId) {
          throw new Error('Empresa criada, mas não foi possível localizar o ID para anexar documento.');
        }

        await uploadCompanyDocument(companyId, createDocumentForm);
      }

      setMessage(result.message || 'Empresa salva com sucesso.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar empresa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(company) {
    const label = company.tradeName || company.corporateName || 'esta empresa';

    const confirmed = await confirm({
      title: 'Inativar empresa',
      message: `Deseja inativar a empresa "${label}"?`,
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/companies/${company.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Empresa inativada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao inativar empresa.');
    } finally {
      setLoading(false);
    }
  }


  async function handleSendApproval(company) {
    const label = company.tradeName || company.corporateName || 'esta empresa / filial';

    const confirmed = await confirm({
      title: 'Enviar empresa para aprovação',
      message: `Enviar "${label}" para aprovação?`,
      confirmText: 'Enviar aprovação',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await apiRequest(`/companies/${company.id}/send-approval`, {
        method: 'POST',
        body: JSON.stringify({ note: 'Cadastro enviado para validação da empresa / filial.' }),
      });

      setMessage(result.message || 'Empresa / filial enviada para aprovação.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar empresa / filial para aprovação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(company) {
    const label = company.tradeName || company.corporateName || 'esta empresa / filial';

    const confirmed = await confirm({
      title: 'Aprovar empresa / filial',
      message: `Aprovar "${label}"? O cadastro ficará validado para uso no sistema.`,
      confirmText: 'Aprovar',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await apiRequest(`/companies/${company.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: 'Empresa / filial validada e aprovada.' }),
      });

      setMessage(result.message || 'Empresa / filial aprovada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao aprovar empresa / filial.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(company) {
    const label = company.tradeName || company.corporateName || 'esta empresa / filial';

    const reason = await prompt({
      title: 'Reprovar empresa / filial',
      message: `Informe o motivo para reprovar "${label}".`,
      defaultValue: 'Empresa / filial reprovada para ajuste.',
      placeholder: 'Digite o motivo da reprovação...',
      confirmText: 'Reprovar',
      cancelText: 'Voltar',
      danger: true,
    });

    if (reason === null) return;

    try {
      setLoading(true);
      const result = await apiRequest(`/companies/${company.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: reason }),
      });

      setMessage(result.message || 'Empresa / filial reprovada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao reprovar empresa / filial.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadCompanies();
  }

  const title = useMemo(() => {
    return isEditing ? 'Editar empresa / filial' : 'Nova empresa / filial';
  }, [isEditing]);

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Empresas e Filiais</h1>
          <p>
            Cadastre a matriz e as filiais que serão usadas nos módulos de
            estoque, vendas, compras, financeiro e relatórios.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <div className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total || 0}</strong>
          <p>Empresas cadastradas.</p>
        </article>

        <article>
          <span>Ativas</span>
          <strong>{stats.ativas || 0}</strong>
          <p>Disponíveis para operação.</p>
        </article>

        <article>
          <span>Matriz</span>
          <strong>{stats.matriz || 0}</strong>
          <p>Empresas principais.</p>
        </article>

        <article>
          <span>Filiais</span>
          <strong>{stats.filiais || 0}</strong>
          <p>Unidades vinculadas.</p>
        </article>

        <article>
          <span>Aprovação pendente</span>
          <strong>{stats.pendentes || 0}</strong>
          <p>Aguardando validação.</p>
        </article>

        <article>
          <span>Aprovadas</span>
          <strong>{stats.aprovadas || 0}</strong>
          <p>Empresas validadas.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            <p>Informe os dados principais da empresa.</p>
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
              <option value="matriz">Matriz</option>
              <option value="filial">Filial</option>
            </select>
          </label>

          <label>
            Razão social *
            <input
              name="corporateName"
              value={form.corporateName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nome fantasia
            <input name="tradeName" value={form.tradeName} onChange={handleChange} />
          </label>

          <label>
            CNPJ / Documento *
            <input name="document" value={form.document} onChange={handleChange} required />
          </label>

          <label>
            Inscrição estadual
            <input name="stateRegistration" value={form.stateRegistration} onChange={handleChange} />
          </label>

          <label>
            Inscrição municipal
            <input name="municipalRegistration" value={form.municipalRegistration} onChange={handleChange} />
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
            CEP
            <input name="zipCode" value={form.zipCode} onChange={handleChange} />
          </label>

          <label>
            Endereço
            <input name="address" value={form.address} onChange={handleChange} />
          </label>

          <label>
            Número
            <input name="number" value={form.number} onChange={handleChange} />
          </label>

          <label>
            Complemento
            <input name="complement" value={form.complement} onChange={handleChange} />
          </label>

          <label>
            Bairro
            <input name="district" value={form.district} onChange={handleChange} />
          </label>

          <label>
            Cidade
            <input name="city" value={form.city} onChange={handleChange} />
          </label>

          <label>
            UF
            <input name="state" maxLength="2" value={form.state} onChange={handleChange} />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </label>

          <label className="form-full">
            Observações
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          {!isEditing && (
            <div className="document-upload-panel required-create-document-panel form-full">
              <div className="form-full required-create-document-title">
                <strong>Documento obrigatório para cadastro</strong>
                <span>Anexe contrato social, cartão CNPJ, identificação ou outro arquivo de referência para concluir a criação.</span>
              </div>

              <label>
                Tipo do documento
                <input
                  type="text"
                  value={createDocumentForm.documentType}
                  onChange={(event) => setCreateDocumentForm((current) => ({ ...current, documentType: event.target.value }))}
                  placeholder="Ex.: contrato social, cartão CNPJ, identificação"
                />
              </label>

              <label>
                Observações
                <input
                  type="text"
                  value={createDocumentForm.notes}
                  onChange={(event) => setCreateDocumentForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Resumo do documento anexado"
                />
              </label>

              <label className="form-full">
                Arquivo *
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={(event) => setCreateDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                />
              </label>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Empresas cadastradas</h2>
            <p>{companies.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Buscar por nome, CNPJ ou cidade..."
            />

            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos os tipos</option>
              <option value="matriz">Matriz</option>
              <option value="filial">Filial</option>
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Todos os status</option>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>

            <select name="approvalStatus" value={filters.approvalStatus} onChange={handleFilterChange}>
              {approvalStatusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Cidade/UF</th>
                <th>Status</th>
                <th>Aprovação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <strong>{company.tradeName || company.corporateName}</strong>
                    <span>{company.corporateName}</span>
                  </td>
                  <td>{formatValue(company.type)}</td>
                  <td>{company.document || '-'}</td>
                  <td>
                    {[company.city, company.state].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td>
                    <span className={`status-badge status-${company.status}`}>
                      {formatValue(company.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge approval-${company.approvalStatus || 'nao_enviado'}`}>
                      {formatApprovalStatus(company.approvalStatus)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions crm-table-actions-expanded">
                      <button type="button" className="details-button" onClick={() => setDetailCompany(company)}>
                        Detalhes
                      </button>
                      <button type="button" className="document-button" onClick={() => openCompanyDocuments(company)}>
                        Documentos
                      </button>
                      {company.approvalStatus !== 'pendente' && company.approvalStatus !== 'aprovado' && (
                        <button type="button" onClick={() => handleSendApproval(company)} disabled={loading}>
                          Enviar aprovação
                        </button>
                      )}
                      {company.approvalStatus === 'pendente' && (
                        <>
                          <button type="button" onClick={() => handleApprove(company)} disabled={loading}>
                            Aprovar
                          </button>
                          <button type="button" className="danger-button" onClick={() => handleReject(company)} disabled={loading}>
                            Reprovar
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => handleEdit(company)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(company)}
                      >
                        Inativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {companies.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {documentCompany && (
        <div className="record-modal-backdrop" onClick={() => setDocumentCompany(null)}>
          <div className="record-modal-card document-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header">
              <div>
                <span>Documentos anexados</span>
                <h2>Documentos da empresa / filial</h2>
                <p>{documentCompany.tradeName || documentCompany.corporateName || 'Empresa selecionada'}</p>
              </div>
              <button type="button" onClick={() => setDocumentCompany(null)}>×</button>
            </div>

            {documentsMessage && <div className="module-message">{documentsMessage}</div>}

            <form className="document-upload-panel" onSubmit={handleDocumentUpload}>
              <label>
                Tipo do documento
                <input
                  type="text"
                  value={documentForm.documentType}
                  onChange={(event) => setDocumentForm((current) => ({ ...current, documentType: event.target.value }))}
                  placeholder="Ex.: contrato social, cartão CNPJ, identificação"
                />
              </label>

              <label>
                Observações
                <input
                  type="text"
                  value={documentForm.notes}
                  onChange={(event) => setDocumentForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Resumo do arquivo anexado"
                />
              </label>

              <label className="form-full">
                Arquivo
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={(event) => setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                />
              </label>

              <button type="submit" disabled={documentsLoading}>
                {documentsLoading ? 'Processando...' : 'Anexar documento'}
              </button>
            </form>

            <div className="document-list-panel">
              <div className="panel-title compact">
                <div>
                  <h3>Arquivos registrados</h3>
                  <p>{documents.length} documento(s) anexado(s)</p>
                </div>
              </div>

              {documents.map((document) => (
                <article className="document-list-item" key={document.id}>
                  <div>
                    <strong>{document.originalName}</strong>
                    <span>{formatValue(document.documentType)} · {formatFileSize(document.sizeBytes)}</span>
                    {document.notes && <small>{document.notes}</small>}
                  </div>

                  <div>
                    <a href={getApiFileUrl(document.filePath)} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                    <button type="button" className="danger-button" onClick={() => handleDocumentDelete(document)}>
                      Remover
                    </button>
                  </div>
                </article>
              ))}

              {!documentsLoading && documents.length === 0 && (
                <div className="empty-documents">Nenhum documento anexado ainda.</div>
              )}
            </div>

            <div className="record-modal-footer">
              <button type="button" onClick={() => setDocumentCompany(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {detailCompany && (
        <div className="record-modal-backdrop" onClick={() => setDetailCompany(null)}>
          <div className="record-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header">
              <div>
                <span>Visualização completa</span>
                <h2>Detalhes da empresa / filial</h2>
                <p>Consulte os dados cadastrais, endereço, contato, status e histórico básico do registro.</p>
              </div>
              <button type="button" onClick={() => setDetailCompany(null)}>×</button>
            </div>

            <div className="record-detail-grid">
              {detailFields.map((field) => (
                <div key={field.key} className={field.full ? 'record-detail-item full' : 'record-detail-item'}>
                  <small>{field.label}</small>
                  <strong>{formatValue(detailCompany[field.key])}</strong>
                </div>
              ))}

              <div className="record-detail-item">
                <small>Criado em</small>
                <strong>{formatDateTime(detailCompany.createdAt)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Atualizado em</small>
                <strong>{formatDateTime(detailCompany.updatedAt)}</strong>
              </div>
            </div>

            <div className="record-modal-footer">
              <button type="button" onClick={() => setDetailCompany(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Empresas;
