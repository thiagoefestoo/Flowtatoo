import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getToken } from '../services/auth';
import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';
const API_FILE_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

const emptyForm = {
  type: 'receber',
  description: '',
  customerId: '',
  supplierId: '',
  costCenterId: '',
  accountPlanId: '',
  reference: '',
  dueDate: new Date().toISOString().slice(0, 10),
  paymentDate: '',
  amount: '',
  paidAmount: '',
  status: 'aberto',
  paymentMethod: '',
  notes: '',
};

const emptyPaymentForm = {
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'PIX',
  paidAmount: '',
  proofNumber: '',
  bankAccount: '',
  notes: '',
  paymentProof: null,
};

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
function Financeiro() {
  const { confirm } = useAppModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [accountPlans, setAccountPlans] = useState([]);
const [detailModal, setDetailModal] = useState({
  open: false,
  entry: null,
  auditLogs: [],
  paymentProofs: [],
});

const [detailLoading, setDetailLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    contasReceber: 0,
    contasPagar: 0,
    recebido: 0,
    pago: 0,
    abertoReceber: 0,
    abertoPagar: 0,
    saldoPrevisto: 0,
    vencidos: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    status: searchParams.get('status') || '',
  });

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    entry: null,
  });

  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(editingId);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');

    setFilters((current) => ({
      ...current,
      status: statusFromUrl || '',
    }));
  }, [searchParams]);

  async function loadEntries(customFilters = filters) {
    const params = new URLSearchParams();

    if (customFilters.q) params.set('q', customFilters.q);
    if (customFilters.type) params.set('type', customFilters.type);
    if (customFilters.status) params.set('status', customFilters.status);

    const query = params.toString();
    const result = await apiRequest(`/financial${query ? `?${query}` : ''}`);

    setEntries(extractData(result));
  }

  async function loadCustomers() {
    const result = await apiRequest('/customers?status=ativo');
    setCustomers(extractData(result));
  }

  async function loadSuppliers() {
    const result = await apiRequest('/suppliers?status=ativo');
    setSuppliers(extractData(result));
  }

  async function loadCostCenters() {
    const result = await apiRequest('/cost-centers?status=ativo');
    setCostCenters(extractData(result));
  }

  async function loadAccountPlans() {
    const result = await apiRequest('/account-plans?status=ativo');
    setAccountPlans(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/financial/stats');
    setStats(result.data || {});
  }

  async function loadData(customFilters = filters) {
    try {
      setLoading(true);

      await Promise.all([
        loadEntries(customFilters),
        loadCustomers(),
        loadSuppliers(),
        loadCostCenters(),
        loadAccountPlans(),
        loadStats(),
      ]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(filters);
  }, []);

  useEffect(() => {
    loadEntries(filters);
  }, [filters.status]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === 'type') {
        next.customerId = '';
        next.supplierId = '';
      }

      if (name === 'status' && value !== 'pago') {
        next.paymentDate = '';
      }

      return next;
    });
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

function handlePaymentFormChange(event) {
  const { name, value, files } = event.target;

  if (name === 'paymentProof') {
    setPaymentForm((current) => ({
      ...current,
      paymentProof: files?.[0] || null,
    }));

    return;
  }

  setPaymentForm((current) => ({
    ...current,
    [name]: value,
  }));
}

  function resetForm() {
    setForm({
      ...emptyForm,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
  }

function openPaymentModal(entry) {
  setPaymentModal({
    open: true,
    entry,
  });

  setPaymentForm({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: entry.paymentMethod || 'PIX',
    paidAmount: entry.amount || '',
    proofNumber: '',
    bankAccount: '',
    notes: '',
    paymentProof: null,
  });
}

  function closePaymentModal() {
    setPaymentModal({
      open: false,
      entry: null,
    });

    setPaymentForm(emptyPaymentForm);
  }


async function openDetailModal(entry) {
  try {
    setDetailLoading(true);

    setDetailModal({
      open: true,
      entry,
      auditLogs: [],
      paymentProofs: [],
    });

    const [auditResult, proofsResult] = await Promise.all([
      apiRequest(`/audit-logs?entityType=financial&entityId=${entry.id}`),
      apiRequest(`/financial/${entry.id}/payment-proofs`),
    ]);

    setDetailModal({
      open: true,
      entry,
      auditLogs: extractData(auditResult),
      paymentProofs: extractData(proofsResult),
    });
  } catch (error) {
    setMessage(error.message || 'Erro ao carregar detalhes do lançamento.');
  } finally {
    setDetailLoading(false);
  }
}

function closeDetailModal() {
  setDetailModal({
    open: false,
    entry: null,
    auditLogs: [],
    paymentProofs: [],
  });
}


  function handleEdit(entry) {
    setEditingId(entry.id);

    setForm({
      type: entry.type || 'receber',
      description: entry.description || '',
      customerId: entry.customerId || '',
      supplierId: entry.supplierId || '',
      costCenterId: entry.costCenterId || '',
      accountPlanId: entry.accountPlanId || '',
      reference: entry.reference || '',
      dueDate: entry.dueDate || new Date().toISOString().slice(0, 10),
      paymentDate: entry.paymentDate || '',
      amount: entry.amount || '',
      paidAmount: entry.paidAmount || '',
      status: entry.status || 'aberto',
      paymentMethod: entry.paymentMethod || '',
      notes: entry.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        customerId: form.type === 'receber' ? form.customerId || null : null,
        supplierId: form.type === 'pagar' ? form.supplierId || null : null,
        costCenterId: form.costCenterId || null,
        accountPlanId: form.accountPlanId || null,
        amount: Number(form.amount || 0),
        paidAmount: Number(form.paidAmount || 0),
        paymentDate: form.paymentDate || null,
      };

      const endpoint = isEditing ? `/financial/${editingId}` : '/financial';
      const method = isEditing ? 'PUT' : 'POST';

      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setMessage(result.message || 'Lancamento salvo com sucesso.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar lancamento financeiro.');
    } finally {
      setLoading(false);
    }
  }

async function handleConfirmPay(event) {
  event.preventDefault();

  if (!paymentModal.entry) return;

  if (!paymentForm.paymentDate) {
    await alert({
      title: 'Data obrigatória',
      message: 'Informe a data do pagamento.',
      confirmText: 'Entendi',
      danger: true,
    });

    return;
  }

  if (!paymentForm.paymentMethod) {
    await alert({
      title: 'Forma de pagamento obrigatória',
      message: 'Informe a forma de pagamento.',
      confirmText: 'Entendi',
      danger: true,
    });

    return;
  }

  if (!paymentForm.paidAmount || Number(String(paymentForm.paidAmount).replace(',', '.')) <= 0) {
    await alert({
      title: 'Valor pago obrigatório',
      message: 'Informe um valor pago maior que zero.',
      confirmText: 'Entendi',
      danger: true,
    });

    return;
  }

  if (!paymentForm.paymentProof) {
    await alert({
      title: 'Comprovante obrigatório',
      message: 'Anexe o comprovante de pagamento para realizar a baixa.',
      confirmText: 'Entendi',
      danger: true,
    });

    return;
  }

  try {
    setLoading(true);

    const token = getToken();

    const formData = new FormData();
    formData.append('paymentDate', paymentForm.paymentDate);
    formData.append('paymentMethod', paymentForm.paymentMethod);
    formData.append('paidAmount', String(paymentForm.paidAmount).replace(',', '.'));
    formData.append('proofNumber', paymentForm.proofNumber || '');
    formData.append('bankAccount', paymentForm.bankAccount || '');
    formData.append('notes', paymentForm.notes || '');
    formData.append('paymentProof', paymentForm.paymentProof);

    const response = await fetch(
      `${API_FILE_BASE_URL}/api/financial/${paymentModal.entry.id}/pay`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Erro ao baixar lançamento.');
    }

    setMessage(result.message || 'Lançamento marcado como pago com comprovante.');
    closePaymentModal();
    await loadData();
  } catch (error) {
    setMessage(error.message || 'Erro ao baixar lançamento.');
  } finally {
    setLoading(false);
  }
}

  async function handleCancel(entry) {
    const confirmed = await confirm({
      title: 'Cancelar lançamento',
      message: `Deseja cancelar o lançamento "${entry.description}"?`,
      confirmText: 'Cancelar lançamento',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/financial/${entry.id}/cancel`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Lancamento cancelado.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao cancelar lancamento.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadEntries(filters);
  }

function handleQuickStatusFilter(status) {
  const params = new URLSearchParams(searchParams);

  if (status) {
    params.set('status', status);
  } else {
    params.delete('status');
  }

  setSearchParams(params);

  setFilters((current) => ({
    ...current,
    status,
  }));
}


  const title = useMemo(() => {
    return isEditing ? 'Editar lancamento' : 'Novo lancamento';
  }, [isEditing]);

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Financeiro</h1>
          <p>
            Controle contas a pagar, contas a receber, vencimentos, pagamentos
            e previsao de saldo.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

{detailModal.open && (
  <div className="app-modal-backdrop">
    <div className="app-modal-card financial-detail-modal" role="dialog" aria-modal="true">
      <div className="app-modal-icon">
        i
      </div>

      <div className="app-modal-content">
        <h2>Detalhes do lançamento</h2>
        <p>
          Consulte os dados principais e o histórico de auditoria deste lançamento financeiro.
        </p>

        <div className="financial-detail-grid">
          <div>
            <span>Descrição</span>
            <strong>{detailModal.entry?.description || '-'}</strong>
          </div>

          <div>
            <span>Tipo</span>
            <strong>{detailModal.entry?.type || '-'}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{detailModal.entry?.status || '-'}</strong>
          </div>

          <div>
            <span>Valor</span>
            <strong>{formatCurrency(detailModal.entry?.amount)}</strong>
          </div>

          <div>
            <span>Valor pago</span>
            <strong>{formatCurrency(detailModal.entry?.paidAmount)}</strong>
          </div>

          <div>
            <span>Vencimento</span>
            <strong>{detailModal.entry?.dueDate || '-'}</strong>
          </div>

          <div>
            <span>Pagamento</span>
            <strong>{detailModal.entry?.paymentDate || '-'}</strong>
          </div>

          <div>
            <span>Forma pagamento</span>
            <strong>{detailModal.entry?.paymentMethod || '-'}</strong>
          </div>

          <div>
            <span>Centro de custo</span>
            <strong>{detailModal.entry?.costCenter?.name || '-'}</strong>
          </div>

          <div>
            <span>Plano de contas</span>
            <strong>{detailModal.entry?.accountPlan?.name || '-'}</strong>
          </div>
        </div>
<div className="financial-proof-box">
  <div className="financial-proof-title">
    <strong>Comprovantes de pagamento</strong>
    <span>
      {detailLoading
        ? 'Carregando...'
        : `${detailModal.paymentProofs.length} comprovante(s)`}
    </span>
  </div>

  <div className="financial-proof-list">
    {detailModal.paymentProofs.map((proof) => (
      <div className="financial-proof-row" key={proof.id}>
        <div>
          <strong>{proof.originalName}</strong>
          <span>
            Forma: {proof.paymentMethod} · Valor: {formatCurrency(proof.paidAmount)}
          </span>
          <span>
            Data: {proof.paymentDate || '-'} · Tamanho: {formatFileSize(proof.sizeBytes)}
          </span>

          {proof.proofNumber && <small>Comprovante/NSU: {proof.proofNumber}</small>}
          {proof.bankAccount && <small>Banco/conta: {proof.bankAccount}</small>}
          {proof.notes && <small>Obs.: {proof.notes}</small>}
        </div>

        <div className="financial-proof-actions">
          <a
            href={`${API_FILE_BASE_URL}${proof.filePath}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir comprovante
          </a>
        </div>
      </div>
    ))}

    {!detailLoading && detailModal.paymentProofs.length === 0 && (
      <p>Nenhum comprovante anexado para este lançamento.</p>
    )}
  </div>
</div>
        <div className="financial-audit-box">
          <div className="financial-audit-title">
            <strong>Histórico do lançamento</strong>
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
                  <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                </div>

                <small>{log.user?.name || 'Sistema'}</small>
              </div>
            ))}

            {!detailLoading && detailModal.auditLogs.length === 0 && (
              <p>Nenhum histórico encontrado para este lançamento.</p>
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


      {paymentModal.open && (
        <div className="app-modal-backdrop">
          <div className="app-modal-card" role="dialog" aria-modal="true">
            <div className="app-modal-icon">
              ✓
            </div>

            <div className="app-modal-content">
              <h2>Baixar lançamento financeiro</h2>
<p>
  Informe os dados da baixa e anexe o comprovante de pagamento.
</p>

              <div className="payment-modal-summary">
                <span>Lançamento</span>
                <strong>{paymentModal.entry?.description}</strong>

                <span>Valor</span>
                <strong>{formatCurrency(paymentModal.entry?.amount)}</strong>
              </div>

              <form className="payment-modal-form" onSubmit={handleConfirmPay}>
                <label>
                  Data do pagamento *
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentFormChange}
                    required
                  />
                </label>

                <label>
                  Forma de pagamento *
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentFormChange}
                    required
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
<label>
  Valor pago *
  <input
    type="number"
    name="paidAmount"
    value={paymentForm.paidAmount}
    onChange={handlePaymentFormChange}
    min="0"
    step="0.01"
    required
  />
</label>

<label>
  Nº comprovante / NSU / referência
  <input
    name="proofNumber"
    value={paymentForm.proofNumber}
    onChange={handlePaymentFormChange}
    placeholder="Ex: NSU, ID PIX, autenticação bancária..."
  />
</label>

<label>
  Banco ou conta utilizada
  <input
    name="bankAccount"
    value={paymentForm.bankAccount}
    onChange={handlePaymentFormChange}
    placeholder="Ex: Banco do Brasil, Caixa, Itaú..."
  />
</label>

<label>
  Comprovante de pagamento *
  <input
    type="file"
    name="paymentProof"
    onChange={handlePaymentFormChange}
    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
    required
  />
</label>

<label className="form-full">
  Observações da baixa
  <textarea
    name="notes"
    value={paymentForm.notes}
    onChange={handlePaymentFormChange}
    placeholder="Observações sobre este pagamento..."
  />
</label>
                <div className="app-modal-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={closePaymentModal}
                    disabled={loading}
                  >
                    Voltar
                  </button>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Baixando...' : 'Confirmar baixa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <article>
          <span>A receber</span>
          <strong>{formatCurrency(stats.abertoReceber)}</strong>
          <p>Valores em aberto.</p>
        </article>

        <article>
          <span>A pagar</span>
          <strong>{formatCurrency(stats.abertoPagar)}</strong>
          <p>Compromissos em aberto.</p>
        </article>

        <article>
          <span>Saldo previsto</span>
          <strong>{formatCurrency(stats.saldoPrevisto)}</strong>
          <p>Receber menos pagar.</p>
        </article>

        <article>
          <span>Vencidos</span>
          <strong>{stats.vencidos || 0}</strong>
          <p>Contas fora do prazo.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            <p>Registre contas a receber ou contas a pagar.</p>
          </div>

          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edicao
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="receber">Conta a receber</option>
              <option value="pagar">Conta a pagar</option>
            </select>
          </label>

          <label>
            Descricao *
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>

          {form.type === 'receber' ? (
            <label>
              Cliente
              <select
                name="customerId"
                value={form.customerId}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.tradeName || customer.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Fornecedor
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.tradeName || supplier.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Centro de Custo
            <select
              name="costCenterId"
              value={form.costCenterId}
              onChange={handleChange}
            >
              <option value="">Selecione...</option>
              {costCenters.map((costCenter) => (
                <option key={costCenter.id} value={costCenter.id}>
                  {costCenter.code} - {costCenter.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Plano de Contas
            <select
              name="accountPlanId"
              value={form.accountPlanId}
              onChange={handleChange}
            >
              <option value="">Selecione...</option>
              {accountPlans
                .filter((account) => {
                  if (form.type === 'receber') return account.nature === 'entrada';
                  if (form.type === 'pagar') return account.nature === 'saida';
                  return true;
                })
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Referencia
            <input
              name="reference"
              value={form.reference}
              onChange={handleChange}
              placeholder="VENDA-001, COMP-001..."
            />
          </label>

          <label>
            Vencimento *
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Valor *
            <input
              name="amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Valor pago
            <input
              name="paidAmount"
              type="number"
              step="0.01"
              value={form.paidAmount}
              onChange={handleChange}
            />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="aberto">Aberto</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>

          <label>
            Data pagamento
            <input
              name="paymentDate"
              type="date"
              value={form.paymentDate}
              onChange={handleChange}
              disabled={form.status !== 'pago'}
            />
          </label>

          <label>
            Metodo pagamento
            <input
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              placeholder="PIX, boleto, cartao..."
            />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Criar lancamento'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Lancamentos financeiros</h2>
            <p>{entries.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Buscar por descricao ou referencia..."
            />

            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos os tipos</option>
              <option value="receber">Receber</option>
              <option value="pagar">Pagar</option>
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>
        <div className="quick-filter-bar">
  <button
    type="button"
    className={filters.status === '' ? 'quick-filter active' : 'quick-filter'}
    onClick={() => handleQuickStatusFilter('')}
  >
    Todos
  </button>

  <button
    type="button"
    className={filters.status === 'aberto' ? 'quick-filter active' : 'quick-filter'}
    onClick={() => handleQuickStatusFilter('aberto')}
  >
    Em aberto
  </button>

  <button
    type="button"
    className={filters.status === 'vencido' ? 'quick-filter active' : 'quick-filter'}
    onClick={() => handleQuickStatusFilter('vencido')}
  >
    Vencidos
  </button>

  <button
    type="button"
    className={filters.status === 'pago' ? 'quick-filter active' : 'quick-filter'}
    onClick={() => handleQuickStatusFilter('pago')}
  >
    Pagos
  </button>

  <button
    type="button"
    className={filters.status === 'cancelado' ? 'quick-filter active' : 'quick-filter'}
    onClick={() => handleQuickStatusFilter('cancelado')}
  >
    Cancelados
  </button>
</div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Lancamento</th>
                <th>Tipo</th>
                <th>Cliente/Fornecedor</th>
                <th>Centro de Custo</th>
                <th>Plano de Contas</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry) => {
                const party =
                  entry.type === 'receber'
                    ? entry.customer?.tradeName || entry.customer?.name
                    : entry.supplier?.tradeName || entry.supplier?.name;

                return (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.description}</strong>
                      <span>{entry.reference || '-'}</span>
                    </td>

                    <td>
                      <span className={`status-badge finance-${entry.type}`}>
                        {entry.type}
                      </span>
                    </td>

                    <td>{party || '-'}</td>

                    <td>
                      {entry.costCenter
                        ? `${entry.costCenter.code || ''} ${entry.costCenter.name || ''}`.trim()
                        : '-'}
                    </td>

                    <td>
                      {entry.accountPlan
                        ? `${entry.accountPlan.code || ''} ${entry.accountPlan.name || ''}`.trim()
                        : '-'}
                    </td>

                    <td>{entry.dueDate}</td>
                    <td>{formatCurrency(entry.amount)}</td>

                    <td>
                      <span className={`status-badge finance-status-${entry.status}`}>
                        {entry.status}
                      </span>
                    </td>

                    <td>
<div className="table-actions">
  <button type="button" onClick={() => openDetailModal(entry)}>
    Detalhes
  </button>

  <button type="button" onClick={() => handleEdit(entry)}>
    Editar
  </button>

  {!['pago', 'cancelado'].includes(entry.status) && (
    <button type="button" onClick={() => openPaymentModal(entry)}>
      Baixar
    </button>
  )}

  {entry.status !== 'cancelado' && (
    <button
      type="button"
      className="danger-button"
      onClick={() => handleCancel(entry)}
    >
      Cancelar
    </button>
  )}
</div>
                    </td>
                  </tr>
                );
              })}

              {entries.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-table">
                    Nenhum lancamento financeiro encontrado.
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

export default Financeiro;