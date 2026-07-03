import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const initialForm = {
  code: '',
  name: '',
  type: 'despesa',
  nature: 'saida',
  status: 'ativo',
  parentCode: '',
  level: 1,
  notes: '',
};

function PlanoDeContas() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAccounts() {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';

    const [listResult, statsResult] = await Promise.all([
      apiRequest(`/account-plans${query}`),
      apiRequest('/account-plans/stats'),
    ]);

    setAccounts(extractData(listResult));
    setStats(statsResult.data);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function handleEdit(account) {
    setEditingId(account.id);

    setForm({
      code: account.code || '',
      name: account.name || '',
      type: account.type || 'despesa',
      nature: account.nature || 'saida',
      status: account.status || 'ativo',
      parentCode: account.parentCode || '',
      level: account.level || 1,
      notes: account.notes || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        parentCode: form.parentCode || null,
        level: Number(form.level || 1),
      };

      if (editingId) {
        await apiRequest(`/account-plans/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setMessage('Conta atualizada com sucesso.');
      } else {
        await apiRequest('/account-plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setMessage('Conta criada com sucesso.');
      }

      resetForm();
      await loadAccounts();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await confirm({
  title: 'Remover conta',
  message: 'Deseja remover esta conta do plano de contas?',
  confirmText: 'Remover',
  cancelText: 'Voltar',
  danger: true,
});

if (!confirmed) return;

    try {
      await apiRequest(`/account-plans/${id}`, {
        method: 'DELETE',
      });

      setMessage('Conta removida com sucesso.');
      await loadAccounts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadAccounts();
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Controladoria</span>
          <h1>Plano de Contas</h1>
          <p>
            Estruture receitas, custos, despesas, ativos e passivos para classificacao financeira e DRE.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Contas cadastradas</p>
        </article>

        <article>
          <span>Receitas</span>
          <strong>{stats?.receitas || 0}</strong>
          <p>Contas de entrada</p>
        </article>

        <article>
          <span>Despesas</span>
          <strong>{stats?.despesas || 0}</strong>
          <p>Contas de saida</p>
        </article>

        <article>
          <span>Custos</span>
          <strong>{stats?.custos || 0}</strong>
          <p>Custos operacionais</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar conta' : 'Nova conta'}</h2>
            <p>Cadastre as contas usadas para classificacao financeira.</p>
          </div>

          {editingId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancelar edicao
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Codigo *
            <input name="code" value={form.code} onChange={handleChange} required />
          </label>

          <label>
            Nome *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Tipo *
            <select name="type" value={form.type} onChange={handleChange} required>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="custo">Custo</option>
              <option value="ativo">Ativo</option>
              <option value="passivo">Passivo</option>
              <option value="patrimonio">Patrimonio</option>
            </select>
          </label>

          <label>
            Natureza
            <select name="nature" value={form.nature} onChange={handleChange}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
              <option value="neutro">Neutro</option>
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>

          <label>
            Conta pai
            <input
              name="parentCode"
              value={form.parentCode}
              onChange={handleChange}
              placeholder="Ex: 1.01"
            />
          </label>

          <label>
            Nivel
            <input
              type="number"
              min="1"
              name="level"
              value={form.level}
              onChange={handleChange}
            />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar conta' : 'Criar conta'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Contas cadastradas</h2>
            <p>{accounts.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              placeholder="Buscar por codigo ou nome..."
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />

            <select
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">Todos os tipos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="custo">Custo</option>
              <option value="ativo">Ativo</option>
              <option value="passivo">Passivo</option>
              <option value="patrimonio">Patrimonio</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th>Tipo</th>
                <th>Natureza</th>
                <th>Status</th>
                <th>Conta pai</th>
                <th>Nivel</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.code}</strong>
                    <span>{account.name}</span>
                  </td>

                  <td>
                    <span className={`account-type account-type-${account.type}`}>
                      {account.type}
                    </span>
                  </td>

                  <td>{account.nature}</td>

                  <td>
                    <span className={`status-badge status-${account.status}`}>
                      {account.status}
                    </span>
                  </td>

                  <td>{account.parentCode || '-'}</td>
                  <td>{account.level}</td>

                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => handleEdit(account)}>
                        Editar
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(account.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {accounts.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Nenhuma conta encontrada.
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

export default PlanoDeContas;