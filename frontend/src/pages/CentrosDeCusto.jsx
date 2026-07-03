import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const initialForm = {
  code: '',
  name: '',
  type: 'operacional',
  status: 'ativo',
  responsibleName: '',
  budgetLimit: '',
  notes: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function CentrosDeCusto() {
  const [costCenters, setCostCenters] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ q: '', type: '', status: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadCostCenters() {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';

    const [listResult, statsResult] = await Promise.all([
      apiRequest(`/cost-centers${query}`),
      apiRequest('/cost-centers/stats'),
    ]);

    setCostCenters(extractData(listResult));
    setStats(statsResult.data);
  }

  useEffect(() => {
    loadCostCenters();
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

  function handleEdit(costCenter) {
    setEditingId(costCenter.id);
    setForm({
      code: costCenter.code || '',
      name: costCenter.name || '',
      type: costCenter.type || 'operacional',
      status: costCenter.status || 'ativo',
      responsibleName: costCenter.responsibleName || '',
      budgetLimit: costCenter.budgetLimit || '',
      notes: costCenter.notes || '',
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
        budgetLimit: Number(form.budgetLimit || 0),
      };

      if (editingId) {
        await apiRequest(`/cost-centers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setMessage('Centro de custo atualizado com sucesso.');
      } else {
        await apiRequest('/cost-centers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setMessage('Centro de custo criado com sucesso.');
      }

      resetForm();
      await loadCostCenters();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInactivate(id) {
    const confirmed = await confirm({
  title: 'Inativar centro de custo',
  message: 'Deseja inativar este centro de custo?',
  confirmText: 'Inativar',
  cancelText: 'Voltar',
  danger: true,
});

if (!confirmed) return;

    try {
      await apiRequest(`/cost-centers/${id}`, {
        method: 'DELETE',
      });

      setMessage('Centro de custo inativado com sucesso.');
      await loadCostCenters();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadCostCenters();
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Controladoria</span>
          <h1>Centros de Custo</h1>
          <p>Organize despesas, receitas, projetos e operacoes por areas de responsabilidade.</p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Centros cadastrados</p>
        </article>

        <article>
          <span>Ativos</span>
          <strong>{stats?.ativos || 0}</strong>
          <p>Disponiveis para uso</p>
        </article>

        <article>
          <span>Inativos</span>
          <strong>{stats?.inativos || 0}</strong>
          <p>Fora de uso</p>
        </article>

        <article>
          <span>Orcamento</span>
          <strong>{formatCurrency(stats?.budgetTotal)}</strong>
          <p>Limite total planejado</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar centro de custo' : 'Novo centro de custo'}</h2>
            <p>Cadastre unidades de controle para analise gerencial.</p>
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
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="administrativo">Administrativo</option>
              <option value="comercial">Comercial</option>
              <option value="operacional">Operacional</option>
              <option value="financeiro">Financeiro</option>
              <option value="projeto">Projeto</option>
              <option value="outro">Outro</option>
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
            Responsavel
            <input name="responsibleName" value={form.responsibleName} onChange={handleChange} />
          </label>

          <label>
            Limite orcamentario
            <input
              type="number"
              step="0.01"
              name="budgetLimit"
              value={form.budgetLimit}
              onChange={handleChange}
            />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar centro' : 'Criar centro'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Centros cadastrados</h2>
            <p>{costCenters.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              placeholder="Buscar centro..."
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />

            <select
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">Todos os tipos</option>
              <option value="administrativo">Administrativo</option>
              <option value="comercial">Comercial</option>
              <option value="operacional">Operacional</option>
              <option value="financeiro">Financeiro</option>
              <option value="projeto">Projeto</option>
              <option value="outro">Outro</option>
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
                <th>Centro</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Responsavel</th>
                <th>Limite</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {costCenters.map((costCenter) => (
                <tr key={costCenter.id}>
                  <td>
                    <strong>{costCenter.code}</strong>
                    <span>{costCenter.name}</span>
                  </td>

                  <td>{costCenter.type}</td>

                  <td>
                    <span className={`status-badge status-${costCenter.status}`}>
                      {costCenter.status}
                    </span>
                  </td>

                  <td>{costCenter.responsibleName || '-'}</td>

                  <td>{formatCurrency(costCenter.budgetLimit)}</td>

                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => handleEdit(costCenter)}>
                        Editar
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleInactivate(costCenter.id)}
                      >
                        Inativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {costCenters.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table">
                    Nenhum centro de custo encontrado.
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

export default CentrosDeCusto;