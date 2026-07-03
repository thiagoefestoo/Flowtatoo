import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const emptyForm = {
  productId: '',
  type: 'entrada',
  quantity: '',
  newStock: '',
  unitCost: '',
  reason: '',
  reference: '',
  notes: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  });
}

function Estoque() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [stats, setStats] = useState({
    totalMovements: 0,
    entradas: 0,
    saidas: 0,
    ajustes: 0,
    baixoEstoque: 0,
    valorEstoque: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ productId: '', type: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === form.productId);
  }, [form.productId, products]);

  async function loadProducts() {
    const result = await apiRequest('/products?type=produto&status=ativo');
    setProducts(extractData(result).filter((product) => product.trackStock));
  }

  async function loadMovements() {
    const params = new URLSearchParams();

    if (filters.productId) params.set('productId', filters.productId);
    if (filters.type) params.set('type', filters.type);

    const query = params.toString();
    const result = await apiRequest(
      `/stock-movements${query ? `?${query}` : ''}`
    );

    setMovements(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/stock-movements/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadProducts(), loadMovements(), loadStats()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar estoque.');
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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        newStock: form.newStock ? Number(form.newStock) : undefined,
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
      };

      const result = await apiRequest('/stock-movements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(result.message || 'Movimentacao registrada com sucesso.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao registrar movimentacao.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadMovements();
  }

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Estoque</h1>
          <p>
            Registre entradas, saidas e ajustes de estoque com historico por
            produto e atualizacao automatica do saldo.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <div className="kpi-grid">
        <article>
          <span>Movimentacoes</span>
          <strong>{stats.totalMovements || 0}</strong>
          <p>Total registrado.</p>
        </article>

        <article>
          <span>Entradas</span>
          <strong>{stats.entradas || 0}</strong>
          <p>Reposicoes de estoque.</p>
        </article>

        <article>
          <span>Saidas</span>
          <strong>{stats.saidas || 0}</strong>
          <p>Baixas registradas.</p>
        </article>

        <article>
          <span>Valor estoque</span>
          <strong>{formatCurrency(stats.valorEstoque)}</strong>
          <p>Custo total estimado.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>Nova movimentacao</h2>
            <p>Entrada, saida ou ajuste do saldo de estoque.</p>
          </div>
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Produto *
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - Estoque: {formatNumber(product.currentStock)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </label>

          {form.type === 'ajuste' ? (
            <label>
              Novo estoque *
              <input
                name="newStock"
                type="number"
                step="0.001"
                value={form.newStock}
                onChange={handleChange}
                required
              />
            </label>
          ) : (
            <label>
              Quantidade *
              <input
                name="quantity"
                type="number"
                step="0.001"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label>
            Custo unitario
            <input
              name="unitCost"
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={handleChange}
              placeholder={selectedProduct?.costPrice || '0.00'}
            />
          </label>

          <label>
            Motivo
            <input
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Compra, venda, ajuste inventario..."
            />
          </label>

          <label>
            Referencia
            <input
              name="reference"
              value={form.reference}
              onChange={handleChange}
              placeholder="NF, pedido, OS..."
            />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar movimentacao'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Historico de movimentacoes</h2>
            <p>{movements.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <select
              name="productId"
              value={filters.productId}
              onChange={handleFilterChange}
            >
              <option value="">Todos os produtos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
              <option value="ajuste">Ajuste</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Antes</th>
                <th>Depois</th>
                <th>Custo</th>
                <th>Referencia</th>
                <th>Usuario</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>
                    <strong>{movement.product?.name || '-'}</strong>
                    <span>{movement.product?.sku || movement.reason || '-'}</span>
                  </td>
                  <td>
                    <span className={`status-badge movement-${movement.type}`}>
                      {movement.type}
                    </span>
                  </td>
                  <td>{formatNumber(movement.quantity)}</td>
                  <td>{formatNumber(movement.stockBefore)}</td>
                  <td>{formatNumber(movement.stockAfter)}</td>
                  <td>{formatCurrency(movement.totalCost)}</td>
                  <td>{movement.reference || '-'}</td>
                  <td>{movement.user?.name || '-'}</td>
                </tr>
              ))}

              {movements.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhuma movimentacao encontrada.
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

export default Estoque;