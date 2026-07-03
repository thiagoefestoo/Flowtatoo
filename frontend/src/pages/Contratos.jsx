import { useEffect, useMemo, useState } from 'react';

import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';

const initialForm = {
  number: '',
  title: '',
  type: 'cliente',
  status: 'rascunho',
approvalStatus: 'nao_enviado',
  customerId: '',
  supplierId: '',
  startDate: '',
  endDate: '',
  monthlyValue: '',
  totalValue: '',
  paymentDay: '',
  renewalType: 'anual',
  object: '',
  notes: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
function getContractStatusLabel(status) {
  const labels = {
    rascunho: 'Rascunho',
    ativo: 'Ativo',
    suspenso: 'Suspenso',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
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

  return labels[status] || status || '-';
}
function Contratos() {
  const { confirm, prompt: promptModal } = useAppModal();
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
  q: '',
  type: '',
  status: '',
  approvalStatus: '',
});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedTypeLabel = useMemo(() => {
    if (form.type === 'cliente') return 'Cliente';
    if (form.type === 'fornecedor') return 'Fornecedor';
    return 'Interno';
  }, [form.type]);

  async function loadContracts() {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);

    const query = params.toString() ? `?${params.toString()}` : '';

    const [contractsResult, statsResult] = await Promise.all([
      apiRequest(`/contracts${query}`),
      apiRequest('/contracts/stats'),
    ]);

    setContracts(extractData(contractsResult));
    setStats(statsResult.data);
  }

  async function loadBaseData() {
    const [customersResult, suppliersResult] = await Promise.all([
      apiRequest('/customers'),
      apiRequest('/suppliers'),
    ]);

    setCustomers(extractData(customersResult));
    setSuppliers(extractData(suppliersResult));
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadContracts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'type' && value !== 'cliente' ? { customerId: '' } : {}),
      ...(name === 'type' && value !== 'fornecedor' ? { supplierId: '' } : {}),
    }));
  }

  function handleEdit(contract) {
    setEditingId(contract.id);
    setForm({
      number: contract.number || '',
      title: contract.title || '',
      type: contract.type || 'cliente',
      status: contract.status || 'rascunho',
approvalStatus: contract.approvalStatus || 'nao_enviado',
      customerId: contract.customerId || '',
      supplierId: contract.supplierId || '',
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      monthlyValue: contract.monthlyValue || '',
      totalValue: contract.totalValue || '',
      paymentDay: contract.paymentDay || '',
      renewalType: contract.renewalType || 'anual',
      object: contract.object || '',
      notes: contract.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        customerId: form.type === 'cliente' ? form.customerId || null : null,
        supplierId: form.type === 'fornecedor' ? form.supplierId || null : null,
        monthlyValue: Number(form.monthlyValue || 0),
        totalValue: Number(form.totalValue || 0),
        paymentDay: form.paymentDay ? Number(form.paymentDay) : null,
        endDate: form.endDate || null,
      };

      if (editingId) {
        await apiRequest(`/contracts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage('Contrato atualizado com sucesso.');
      } else {
        await apiRequest('/contracts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Contrato criado com sucesso.');
      }

      resetForm();
      await loadContracts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }
async function handleRequestApproval(contract) {
  const confirmed = await confirm({
    title: 'Enviar contrato para aprovação',
    message: `Deseja enviar o contrato "${contract.number}" para aprovação?`,
    confirmText: 'Enviar para aprovação',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/contracts/${contract.id}/request-approval`, {
      method: 'PATCH',
    });

    setMessage(result.message || 'Contrato enviado para aprovação.');
    await loadContracts();
  } catch (error) {
    setMessage(error.message || 'Erro ao enviar contrato para aprovação.');
  } finally {
    setLoading(false);
  }
}

async function handleApproveContract(contract) {
  const confirmed = await confirm({
    title: 'Aprovar contrato',
    message: `Deseja aprovar e ativar o contrato "${contract.number}"?`,
    confirmText: 'Aprovar contrato',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/contracts/${contract.id}/approve`, {
      method: 'PATCH',
    });

    setMessage(result.message || 'Contrato aprovado e ativado com sucesso.');
    await loadContracts();
  } catch (error) {
    setMessage(error.message || 'Erro ao aprovar contrato.');
  } finally {
    setLoading(false);
  }
}

async function handleRejectContract(contract) {
  const reason = await promptModal({
    title: 'Reprovar contrato',
    message: `Informe o motivo da reprovação do contrato "${contract.number}".`,
    inputLabel: 'Motivo',
    inputPlaceholder: 'Ex: dados incorretos, pendência documental, valor divergente...',
    confirmText: 'Reprovar contrato',
    cancelText: 'Voltar',
    danger: true,
  });

  if (!reason) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/contracts/${contract.id}/reject-approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason,
      }),
    });

    setMessage(result.message || 'Contrato reprovado com sucesso.');
    await loadContracts();
  } catch (error) {
    setMessage(error.message || 'Erro ao reprovar contrato.');
  } finally {
    setLoading(false);
  }
}
  async function handleCancelContract(contractId) {
   const confirmed = await confirm({
  title: 'Cancelar contrato',
  message: 'Deseja cancelar este contrato?',
  confirmText: 'Cancelar contrato',
  cancelText: 'Voltar',
  danger: true,
});

if (!confirmed) return;

    try {
      await apiRequest(`/contracts/${contractId}`, {
        method: 'DELETE',
      });

      setMessage('Contrato cancelado com sucesso.');
      await loadContracts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadContracts();
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Gestao contratual</span>
          <h1>Contratos</h1>
          <p>Controle contratos de clientes, fornecedores e acordos internos.</p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Contratos cadastrados</p>
        </article>

        <article>
          <span>Ativos</span>
          <strong>{stats?.ativos || 0}</strong>
          <p>Contratos em vigor</p>
        </article>

        <article>
          <span>Receita mensal</span>
          <strong>{formatCurrency(stats?.receitaMensal)}</strong>
          <p>Contratos de clientes</p>
        </article>

        <article>
          <span>Saldo mensal</span>
          <strong>{formatCurrency(stats?.saldoMensal)}</strong>
          <p>Receita menos custo</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar contrato' : 'Novo contrato'}</h2>
            <p>Preencha os dados principais do contrato.</p>
          </div>

          {editingId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancelar edicao
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Numero *
            <input name="number" value={form.number} onChange={handleChange} required />
          </label>

          <label>
            Titulo *
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>

          <label>
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="cliente">Cliente</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="interno">Interno</option>
            </select>
          </label>

          {form.type === 'cliente' && (
            <label>
              Cliente
              <select name="customerId" value={form.customerId} onChange={handleChange}>
                <option value="">Selecione</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.tradeName || customer.corporateName}
                  </option>
                ))}
              </select>
            </label>
          )}

          {form.type === 'fornecedor' && (
            <label>
              Fornecedor
              <select name="supplierId" value={form.supplierId} onChange={handleChange}>
                <option value="">Selecione</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name || supplier.tradeName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="rascunho">Rascunho</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
  value={filters.approvalStatus}
  onChange={(event) =>
    setFilters({ ...filters, approvalStatus: event.target.value })
  }
>
  <option value="">Todas as aprovações</option>
  <option value="nao_enviado">Não enviado</option>
  <option value="pendente">Pendente</option>
  <option value="aprovado">Aprovado</option>
  <option value="reprovado">Reprovado</option>
</select>
          </label>

          <label>
            Inicio *
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
          </label>

          <label>
            Fim
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
          </label>

          <label>
            Valor mensal
            <input type="number" step="0.01" name="monthlyValue" value={form.monthlyValue} onChange={handleChange} />
          </label>

          <label>
            Valor total
            <input type="number" step="0.01" name="totalValue" value={form.totalValue} onChange={handleChange} />
          </label>

          <label>
            Dia pagamento
            <input type="number" min="1" max="31" name="paymentDay" value={form.paymentDay} onChange={handleChange} />
          </label>

          <label>
            Renovacao
            <select name="renewalType" value={form.renewalType} onChange={handleChange}>
              <option value="nao_renova">Nao renova</option>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="form-full">
            Objeto do contrato
            <textarea name="object" value={form.object} onChange={handleChange} />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar contrato' : 'Criar contrato'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Contratos cadastrados</h2>
            <p>{contracts.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              placeholder="Buscar contrato..."
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />

            <select
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">Todos os tipos</option>
              <option value="cliente">Cliente</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="interno">Interno</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Tipo</th>
                <th>Status</th>
<th>Aprovação</th>
<th>Periodo</th>
                <th>Valor mensal</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>
                    <strong>{contract.number}</strong>
                    <span>{contract.title}</span>
                  </td>
                  <td>{contract.type}</td>
<td>
  <span className={`status-badge status-${contract.status}`}>
    {getContractStatusLabel(contract.status)}
  </span>
</td>

<td>
  <span className={`status-badge approval-${contract.approvalStatus || 'nao_enviado'}`}>
    {getApprovalStatusLabel(contract.approvalStatus)}
  </span>

  {contract.rejectionReason && (
    <small>{contract.rejectionReason}</small>
  )}
</td>

<td>
  <strong>{contract.startDate}</strong>
                    <span>{contract.endDate || 'Sem fim definido'}</span>
                  </td>
                  <td>{formatCurrency(contract.monthlyValue)}</td>
                  <td>
<div className="table-actions">
  {contract.status === 'rascunho' &&
    contract.approvalStatus !== 'pendente' &&
    contract.approvalStatus !== 'aprovado' && (
      <button type="button" onClick={() => handleEdit(contract)}>
        Editar
      </button>
    )}

  {contract.status === 'rascunho' &&
    ['nao_enviado', 'reprovado', null, undefined].includes(contract.approvalStatus) && (
      <button type="button" onClick={() => handleRequestApproval(contract)}>
        Enviar aprovação
      </button>
    )}

  {contract.status === 'rascunho' && contract.approvalStatus === 'pendente' && (
    <>
      <button type="button" onClick={() => handleApproveContract(contract)}>
        Aprovar
      </button>

      <button
        type="button"
        className="danger-button"
        onClick={() => handleRejectContract(contract)}
      >
        Reprovar
      </button>
    </>
  )}

  {contract.status !== 'cancelado' && (
    <button
      type="button"
      className="danger-button"
      onClick={() => handleCancelContract(contract.id)}
    >
      Cancelar
    </button>
  )}
</div>
                  </td>
                </tr>
              ))}

              {contracts.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Contratos;