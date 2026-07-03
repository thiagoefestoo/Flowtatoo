import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData, getApiFileUrl } from '../services/api';
import { getLoggedUser } from '../services/auth';
import { useAppModal } from './AppModalProvider';

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

const VALUE_LABELS = {

  rascunho: 'Rascunho',
  triagem: 'Triagem',
  entrevistas: 'Entrevistas',
  proposta: 'Proposta',
  admissao: 'Admissão',
  cancelada: 'Cancelada',
  clt: 'CLT',
  pj: 'PJ',
  temporario: 'Temporário',
  estagio: 'Estágio',
  aprendiz: 'Aprendiz',
  terceiro: 'Terceiro',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  lideranca: 'Liderança',
  especialista: 'Especialista',
  novo: 'Novo',
  em_triagem: 'Em triagem',
  em_processo: 'Em processo',
  banco_talentos: 'Banco de talentos',
  contratado: 'Contratado',
  inscrito: 'Inscrito',
  triagem_curricular: 'Triagem curricular',
  contato_inicial: 'Contato inicial',
  entrevista_rh: 'Entrevista RH',
  entrevista_tecnica: 'Entrevista técnica',
  teste_pratico: 'Teste prático',
  entrevista_gestor: 'Entrevista gestor',
  finalizado: 'Finalizado',
  pausado: 'Pausado',
  desistente: 'Desistente',
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  remarcada: 'Remarcada',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
  aguardando: 'Aguardando',
  proxima_fase: 'Próxima fase',
  em_elaboracao: 'Em elaboração',
  aceita: 'Aceita',
  recusada: 'Recusada',
  documentos_pendentes: 'Documentos pendentes',
  exame_pendente: 'Exame pendente',
  contrato_pendente: 'Contrato pendente',
  acessos_pendentes: 'Acessos pendentes',
  integracao_agendada: 'Integração agendada',
  validado: 'Validado',
  recusado: 'Recusado',
  vencido: 'Vencido',
  colaborador: 'Colaborador',
  candidato: 'Candidato',
  enviado: 'Enviado',
  assinado: 'Assinado',
  liberado: 'Liberado',
  separado: 'Separado',
  nao_aplica: 'Não aplica',
  experiencia: 'Experiência',
  afastado: 'Afastado',
  ferias: 'Férias',
  desligado: 'Desligado',
  documentos: 'Documentos',
  acessos: 'Acessos',
  equipamentos: 'Equipamentos',
  integracao: 'Integração',
  treinamento: 'Treinamento',
  atrasada: 'Atrasada',
  atestado: 'Atestado',
  licenca: 'Licença',
  afastamento: 'Afastamento',
  ausencia_justificada: 'Ausência justificada',
  banco_horas: 'Banco de horas',
  solicitado: 'Solicitado',
  reprovado: 'Reprovado',
  concluido: 'Concluído',
  pedido_demissao: 'Pedido de demissão',
  empresa_sem_justa_causa: 'Empresa sem justa causa',
  empresa_com_justa_causa: 'Empresa com justa causa',
  termino_contrato: 'Término de contrato',
  acordo: 'Acordo',
  aviso_previo: 'Aviso prévio',
  imediata: 'Imediata',
  ate_15_dias: 'Até 15 dias',
  ate_30_dias: 'Até 30 dias',
  empregado: 'Empregado',
  indisponivel: 'Indisponível',
  nao_enviado: 'Não enviado',
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  em_andamento: 'Em andamento',
  em_contato: 'Em contato',
  em_negociacao: 'Em negociação',
  pessoa_juridica: 'Pessoa jurídica',
  pessoa_fisica: 'Pessoa física',
  prospeccao: 'Prospecção',
  qualificacao: 'Qualificação',
  diagnostico: 'Diagnóstico',
  negociacao: 'Negociação',
  indicacao: 'Indicação',
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  concluida: 'Concluída',
  critica: 'Crítica',
  media: 'Média',
  saida: 'Saída',
  urgente: 'Urgente',
  enviada: 'Enviada',
  recebida: 'Recebida',
  em_rota: 'Em rota',
  entregue: 'Entregue',
  nao_entregue: 'Não entregue',
  cliente_ausente: 'Cliente ausente',
  endereco_incorreto: 'Endereço incorreto',
  recusa_recebimento: 'Recusa no recebimento',
  produto_avariado: 'Produto avariado',
  atraso_rota: 'Atraso na rota',
  problema_operacional: 'Problema operacional',
  aberta: 'Aberta',
  em_analise: 'Em análise',
  resolvida: 'Resolvida',
};

function formatLabel(value) {
  if (value === null || value === undefined || value === '') return '-';

  const safeValue = String(value);
  return VALUE_LABELS[safeValue] || safeValue.replaceAll('_', ' ');
}

function formatFileSize(value) {
  const bytes = Number(value || 0);

  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '-';

  if (type === 'currency') {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  if (type === 'date') {
    return new Date(value).toLocaleDateString('pt-BR');
  }

  if (type === 'datetime') {
    return new Date(value).toLocaleString('pt-BR');
  }

  if (type === 'percent') {
    return `${Number(value || 0)}%`;
  }

  return formatLabel(value);
}

function readNestedValue(item, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], item);
}

function normalizeInitialForm(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? '';
    return acc;
  }, {});
}

function readOptionValue(item, keyOrFn) {
  if (typeof keyOrFn === 'function') return keyOrFn(item);
  return item?.[keyOrFn || 'id'];
}

function readOptionLabel(item, keyOrFn) {
  if (typeof keyOrFn === 'function') return keyOrFn(item);
  return item?.[keyOrFn || 'name'] || item?.title || item?.email || item?.id;
}

function buildDynamicOptions(items, field) {
  return items.map((item) => ({
    value: readOptionValue(item, field.optionValue),
    label: readOptionLabel(item, field.optionLabel),
    raw: item,
  })).filter((option) => option.value !== undefined && option.value !== null);
}

function readMappedOptionValue(source, item, currentForm) {
  if (typeof source === 'function') return source(item, currentForm);
  return readNestedValue(item, source);
}

function buildRequiredLabel(label, required) {
  if (!required) return label;
  return label.endsWith('*') ? label : `${label} *`;
}

function prepareValue(field, value) {
  if (field.type === 'number' || field.type === 'currency') {
    if (value === '') return null;
    return Number(value);
  }

  if (value === '') return null;

  return value;
}

function buildDetailFields(fields, columns) {
  const map = new Map();

  fields.forEach((field) => {
    if (field.type === 'hidden' || field.hideInDetails) return;

    map.set(field.name, {
      key: field.name,
      label: field.label,
      type: field.type,
    });
  });

  columns.forEach((column) => {
    if (!map.has(column.key)) {
      map.set(column.key, {
        key: column.key,
        label: column.label,
        type: column.type,
        render: column.render,
      });
    }
  });

  return Array.from(map.values());
}

function CrmCrudPage({
  title,
  eyebrow = 'Flowtatoo',
  description,
  endpoint,
  fields,
  columns,
  filters = [],
  stats = [],
  primaryAction = 'Salvar registro',
  detailTitle = 'Detalhes do registro',
  documentsConfig = null,
  approvalConfig = null,
}) {
  const initialForm = useMemo(() => normalizeInitialForm(fields), [fields]);
  const detailFields = useMemo(() => buildDetailFields(fields, columns), [fields, columns]);
  const user = getLoggedUser();
  const { confirm } = useAppModal();
  const canDecideApproval = ['admin', 'gestor'].includes(user?.role);
  const defaultDocumentType = documentsConfig?.defaultDocumentType || 'documento';

  const [items, setItems] = useState([]);
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState({ q: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [documentItem, setDocumentItem] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({ documentType: defaultDocumentType, notes: '', file: null });
  const [createDocumentForm, setCreateDocumentForm] = useState({ documentType: defaultDocumentType, notes: '', file: null });
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsMessage, setDocumentsMessage] = useState('');

  const isEditing = Boolean(editingId);

  async function loadItems() {
    try {
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const result = await apiRequest(`${endpoint}${params.toString() ? `?${params}` : ''}`);
      setItems(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadDynamicOptions() {
    const fieldsWithDynamicOptions = fields.filter((field) => field.optionsEndpoint);

    if (fieldsWithDynamicOptions.length === 0) return;

    try {
      const entries = await Promise.all(fieldsWithDynamicOptions.map(async (field) => {
        const result = await apiRequest(field.optionsEndpoint);
        return [field.name, buildDynamicOptions(extractData(result), field)];
      }));

      setDynamicOptions(Object.fromEntries(entries));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadItems();
    loadDynamicOptions();
  }, []);

  function getFieldOptions(field) {
    return field.options || dynamicOptions[field.name] || [];
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const field = fields.find((item) => item.name === name);

    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      };

      if (field?.optionMap) {
        const selectedOption = getFieldOptions(field).find((option) => String(option.value) === String(value));
        const raw = selectedOption?.raw;

        if (raw) {
          Object.entries(field.optionMap).forEach(([target, source]) => {
            nextForm[target] = readMappedOptionValue(source, raw, current) ?? '';
          });
        }
      }

      return nextForm;
    });
  }

  function resetForm() {
    setForm(initialForm);
    setCreateDocumentForm({ documentType: defaultDocumentType, notes: '', file: null });
    setEditingId(null);
  }


  async function uploadCreateDocument(itemId) {
    if (!documentsConfig || !createDocumentForm.file) return null;

    const formData = new FormData();
    formData.append(documentsConfig.fileField || 'document', createDocumentForm.file);
    formData.append('documentType', createDocumentForm.documentType || defaultDocumentType);
    formData.append('notes', createDocumentForm.notes || 'Documento anexado no cadastro inicial.');

    return apiRequest(`${documentsConfig.endpoint}/${itemId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!isEditing && documentsConfig?.requiredOnCreate && !createDocumentForm.file) {
      setMessage('Anexe pelo menos um documento para criar este registro.');
      setLoading(false);
      return;
    }

    try {
      const payload = fields.reduce((acc, field) => {
        acc[field.name] = prepareValue(field, form[field.name]);
        return acc;
      }, {});

      const result = await apiRequest(isEditing ? `${endpoint}/${editingId}` : endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      if (!isEditing && documentsConfig && createDocumentForm.file) {
        const itemId = result.data?.id;

        if (!itemId) {
          throw new Error('Registro criado, mas não foi possível localizar o ID para anexar documento.');
        }

        await uploadCreateDocument(itemId);
      }

      setMessage(result.message || 'Registro salvo com sucesso.');
      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item) {
    const nextForm = { ...initialForm };

    fields.forEach((field) => {
      const value = item[field.name];
      if (field.type === 'datetime') {
        nextForm[field.name] = toInputDateTime(value);
      } else if (field.type === 'date') {
        nextForm[field.name] = toInputDate(value);
      } else {
        nextForm[field.name] = value ?? '';
      }
    });

    setForm(nextForm);
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(item) {
    const label = item.name || item.title || item.number || 'este registro';

    const confirmed = await confirm({
      title: 'Excluir registro',
      message: `Deseja excluir ${label}?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      const result = await apiRequest(`${endpoint}/${item.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Registro excluído com sucesso.');
      await loadItems();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openDocuments(item) {
    if (!documentsConfig) return;

    setDocumentItem(item);
    setDocuments([]);
    setDocumentsMessage('');
    setDocumentForm({ documentType: defaultDocumentType, notes: '', file: null });
    setDocumentsLoading(true);

    try {
      const result = await apiRequest(`${documentsConfig.endpoint}/${item.id}`);
      setDocuments(extractData(result));
    } catch (error) {
      setDocumentsMessage(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleDocumentUpload(event) {
    event.preventDefault();

    if (!documentsConfig || !documentItem) return;

    if (!documentForm.file) {
      setDocumentsMessage('Selecione um arquivo para anexar.');
      return;
    }

    const formData = new FormData();
    formData.append(documentsConfig.fileField || 'document', documentForm.file);
    formData.append('documentType', documentForm.documentType || defaultDocumentType);
    formData.append('notes', documentForm.notes || '');

    setDocumentsLoading(true);
    setDocumentsMessage('');

    try {
      const result = await apiRequest(`${documentsConfig.endpoint}/${documentItem.id}`, {
        method: 'POST',
        body: formData,
      });

      setDocumentsMessage(result.message || 'Documento anexado com sucesso.');
      setDocumentForm({ documentType: defaultDocumentType, notes: '', file: null });

      const refresh = await apiRequest(`${documentsConfig.endpoint}/${documentItem.id}`);
      setDocuments(extractData(refresh));
      await loadItems();
    } catch (error) {
      setDocumentsMessage(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleDocumentDelete(document) {
    if (!documentsConfig) return;

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
      const result = await apiRequest(`${documentsConfig.endpoint}/${document.id}`, {
        method: 'DELETE',
      });

      setDocumentsMessage(result.message || 'Documento removido com sucesso.');
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      await loadItems();
    } catch (error) {
      setDocumentsMessage(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleApprovalAction(item, action) {
    if (!approvalConfig) return;

    const actionMap = {
      send: {
        path: approvalConfig.sendPath || 'send-approval',
        message: `Enviar ${item.title || 'esta atividade'} para aprovação?`,
      },
      approve: {
        path: approvalConfig.approvePath || 'approve',
        message: `Aprovar ${item.title || 'esta atividade'}?`,
      },
      reject: {
        path: approvalConfig.rejectPath || 'reject',
        message: `Reprovar ${item.title || 'esta atividade'}?`,
      },
    };

    const selected = actionMap[action];
    if (!selected) return;

    const confirmed = await confirm({
      title: 'Fluxo de aprovação',
      message: selected.message,
      confirmText: action === 'send' ? 'Enviar' : action === 'approve' ? 'Aprovar' : 'Reprovar',
      cancelText: 'Cancelar',
      danger: action === 'reject',
    });

    if (!confirmed) return;

    try {
      const result = await apiRequest(`${endpoint}/${item.id}/${selected.path}`, {
        method: 'POST',
      });

      setMessage(result.message || 'Fluxo de aprovação atualizado.');
      await loadItems();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const statValues = stats.map((stat) => {
    const value = stat.getValue(items);
    return {
      ...stat,
      value,
    };
  });

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      {statValues.length > 0 && (
        <section className="kpi-grid">
          {statValues.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{formatValue(stat.value, stat.type)}</strong>
              <p>{stat.description}</p>
            </article>
          ))}
        </section>
      )}

      {message && <div className="module-message">{message}</div>}

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{isEditing ? 'Editar registro' : 'Novo registro'}</h2>
            <p>Registre informações operacionais, histórico e dados de acompanhamento.</p>
          </div>

          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          {fields.map((field) => {
            if (field.type === 'hidden') {
              return (
                <input
                  key={field.name}
                  type="hidden"
                  name={field.name}
                  value={form[field.name] ?? ''}
                />
              );
            }

            const options = getFieldOptions(field);

            return (
              <label key={field.name} className={field.full ? 'form-full' : ''}>
                {buildRequiredLabel(field.label, field.required)}
                {field.type === 'select' ? (
                  <select name={field.name} value={form[field.name] ?? ''} onChange={handleChange} required={field.required}>
                    <option value="">{field.placeholder || 'Selecione'}</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={form[field.name] ?? ''}
                    onChange={handleChange}
                    rows={field.rows || 3}
                    required={field.required}
                    readOnly={field.readOnly}
                  />
                ) : (
                  <input
                    type={field.type === 'currency' ? 'number' : field.type || 'text'}
                    name={field.name}
                    value={form[field.name] ?? ''}
                    onChange={handleChange}
                    step={field.type === 'currency' ? '0.01' : undefined}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                    readOnly={field.readOnly}
                  />
                )}
                {field.helpText && <small className="form-help-text">{field.helpText}</small>}
              </label>
            );
          })}

          {!isEditing && documentsConfig && (documentsConfig.showOnCreate || documentsConfig.requiredOnCreate) && (
            <div className="document-upload-panel required-create-document-panel form-full">
              <div className="form-full required-create-document-title">
                <strong>{documentsConfig.requiredOnCreate ? 'Documento obrigatório para cadastro' : 'Documento do cadastro'}</strong>
                <span>{documentsConfig.requiredOnCreate ? 'Anexe um arquivo para concluir a criação deste registro.' : 'Opcional: anexe currículo, RG, CPF, certificado ou outro arquivo relacionado.'}</span>
              </div>

              <label>
                Tipo do documento
                <input
                  type="text"
                  value={createDocumentForm.documentType}
                  onChange={(event) => setCreateDocumentForm((current) => ({ ...current, documentType: event.target.value }))}
                  placeholder={documentsConfig.typePlaceholder || 'Ex.: currículo, RG, CPF, certificado'}
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
                {documentsConfig.requiredOnCreate ? 'Arquivo *' : 'Arquivo'}
                <input
                  type="file"
                  required={documentsConfig.requiredOnCreate}
                  accept={documentsConfig.accept || '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv'}
                  onChange={(event) => setCreateDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                />
              </label>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Atualizar registro' : primaryAction}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Registros</h2>
            <p>Consulte, filtre, edite e acompanhe as informações da operação.</p>
          </div>

          <div className="filters">
            <input
              type="search"
              placeholder="Buscar..."
              value={query.q || ''}
              onChange={(event) => setQuery((current) => ({ ...current, q: event.target.value }))}
            />

            {filters.map((filter) => (
              <select
                key={filter.name}
                value={query[filter.name] || ''}
                onChange={(event) =>
                  setQuery((current) => ({ ...current, [filter.name]: event.target.value }))
                }
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}

            <button type="button" onClick={loadItems}>
              Filtrar
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => {
                    const value = column.render
                      ? column.render(item)
                      : readNestedValue(item, column.key);

                    return (
                      <td key={column.key}>
                        {column.badge ? (
                          <span className={`status-badge ${column.badge(value)}`}>
                            {formatValue(value, column.type)}
                          </span>
                        ) : (
                          <span>{formatValue(value, column.type)}</span>
                        )}
                      </td>
                    );
                  })}

                  <td>
                    <div className="table-actions crm-table-actions-expanded">
                      <button type="button" className="details-button" onClick={() => setDetailItem(item)}>
                        Detalhes
                      </button>

                      {documentsConfig && (
                        <button type="button" className="document-button" onClick={() => openDocuments(item)}>
                          Documentos
                        </button>
                      )}

                      {approvalConfig && item.approvalStatus !== 'pendente' && item.approvalStatus !== 'aprovado' && (
                        <button type="button" className="approval-button" onClick={() => handleApprovalAction(item, 'send')}>
                          Enviar aprovação
                        </button>
                      )}

                      {approvalConfig && item.approvalStatus === 'pendente' && canDecideApproval && (
                        <>
                          <button type="button" className="approval-button" onClick={() => handleApprovalAction(item, 'approve')}>
                            Aprovar
                          </button>
                          <button type="button" className="danger-button" onClick={() => handleApprovalAction(item, 'reject')}>
                            Reprovar
                          </button>
                        </>
                      )}

                      <button type="button" onClick={() => handleEdit(item)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(item)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan={columns.length + 1}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailItem && (
        <div className="record-modal-backdrop" onClick={() => setDetailItem(null)}>
          <div className="record-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header">
              <div>
                <span>Visualização completa</span>
                <h2>{detailTitle}</h2>
                <p>Consulte os dados registrados, status, histórico básico e informações completas.</p>
              </div>
              <button type="button" onClick={() => setDetailItem(null)}>×</button>
            </div>

            <div className="record-detail-grid">
              {detailFields.map((field) => {
                const rawValue = field.render ? field.render(detailItem) : readNestedValue(detailItem, field.key);

                return (
                  <div key={field.key} className={field.type === 'textarea' ? 'record-detail-item full' : 'record-detail-item'}>
                    <small>{field.label}</small>
                    <strong>{formatValue(rawValue, field.type)}</strong>
                  </div>
                );
              })}

              {'approvalStatus' in detailItem && (
                <>
                  <div className="record-detail-item">
                    <small>Status de aprovação</small>
                    <strong>{formatValue(detailItem.approvalStatus)}</strong>
                  </div>
                  <div className="record-detail-item">
                    <small>Solicitado em</small>
                    <strong>{formatValue(detailItem.approvalRequestedAt, 'datetime')}</strong>
                  </div>
                  <div className="record-detail-item">
                    <small>Decidido em</small>
                    <strong>{formatValue(detailItem.approvalDecidedAt, 'datetime')}</strong>
                  </div>
                  <div className="record-detail-item full">
                    <small>Observação da aprovação</small>
                    <strong>{formatValue(detailItem.approvalNote)}</strong>
                  </div>
                </>
              )}

              <div className="record-detail-item">
                <small>Criado em</small>
                <strong>{formatValue(detailItem.createdAt, 'datetime')}</strong>
              </div>
              <div className="record-detail-item">
                <small>Atualizado em</small>
                <strong>{formatValue(detailItem.updatedAt, 'datetime')}</strong>
              </div>
            </div>

            <div className="record-modal-footer">
              {documentsConfig && (
                <button type="button" className="document-button" onClick={() => openDocuments(detailItem)}>
                  Ver documentos
                </button>
              )}
              <button type="button" onClick={() => setDetailItem(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {documentItem && documentsConfig && (
        <div className="record-modal-backdrop" onClick={() => setDocumentItem(null)}>
          <div className="record-modal-card document-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header">
              <div>
                <span>Documentos anexados</span>
                <h2>{documentsConfig.title || 'Documentos do registro'}</h2>
                <p>{documentItem.title || documentItem.name || documentItem.number || 'Registro selecionado'}</p>
              </div>
              <button type="button" onClick={() => setDocumentItem(null)}>×</button>
            </div>

            {documentsMessage && <div className="module-message">{documentsMessage}</div>}

            <form className="document-upload-panel" onSubmit={handleDocumentUpload}>
              <label>
                Tipo do documento
                <input
                  type="text"
                  value={documentForm.documentType}
                  onChange={(event) => setDocumentForm((current) => ({ ...current, documentType: event.target.value }))}
                  placeholder="Ex.: proposta, contrato, evidência, briefing"
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
                  accept={documentsConfig.accept || '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv'}
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
                    <span>{formatLabel(document.documentType)} · {formatFileSize(document.sizeBytes)}</span>
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
              <button type="button" onClick={() => setDocumentItem(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrmCrudPage;
