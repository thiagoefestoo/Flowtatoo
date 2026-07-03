import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';

const emptyForm = {
  type: 'produto',
  name: '',
  sku: '',
  barcode: '',
  category: '',
  supplierId: '',
  unit: 'UN',
  costPrice: '',
  salePrice: '',
  minStock: '',
  currentStock: '',
  trackStock: true,
  status: 'ativo',
  notes: '',
};

function formatCurrency(value) {
  const number = Number(value || 0);

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}



function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

const stockMovementLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  baixa_entrega: 'Baixa por entrega',
  devolucao_entrega: 'Devolução de entrega',
};

function getStockStatus(product) {
  if (!product?.trackStock) return 'Não controla estoque';

  const currentStock = Number(product.currentStock || 0);
  const minStock = Number(product.minStock || 0);

  if (currentStock <= 0) return 'Sem estoque';
  if (currentStock <= minStock) return 'Estoque baixo';

  return 'Estoque saudável';
}

function Produtos() {
  const { confirm } = useAppModal();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    produtos: 0,
    servicos: 0,
    baixoEstoque: 0,
    valorEstoque: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ q: '', type: '', status: '', category: '' });
  const [stockFilter, setStockFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({
    open: false,
    product: null,
    movements: [],
    loading: false,
    error: '',
  });

  const isEditing = Boolean(editingId);

  useEffect(() => {
    const stockFromUrl = searchParams.get('stock');
    setStockFilter(stockFromUrl || '');
  }, [searchParams]);

  async function loadProducts() {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);

    const query = params.toString();
    const result = await apiRequest(`/products${query ? `?${query}` : ''}`);

    setProducts(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/products/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadProducts(), loadStats(), loadSuppliers()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }
  async function loadSuppliers() {
    const result = await apiRequest('/suppliers?status=ativo');
    setSuppliers(extractData(result));
  }
  
  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
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

  function handleEdit(product) {
    setEditingId(product.id);

setForm({
  type: product.type || 'produto',
  name: product.name || '',
  sku: product.sku || '',
  barcode: product.barcode || '',
  category: product.category || '',
  supplierId: product.supplierId || '',
  unit: product.unit || 'UN',
  costPrice: product.costPrice || '',
  salePrice: product.salePrice || '',
  minStock: product.minStock || '',
  currentStock: product.currentStock || '',
  trackStock: Boolean(product.trackStock),
  status: product.status || 'ativo',
  notes: product.notes || '',
});

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleViewDetails(product) {
    setDetailModal({
      open: true,
      product,
      movements: [],
      loading: true,
      error: '',
    });

    try {
      const [productResult, movementsResult] = await Promise.all([
        apiRequest(`/products/${product.id}`),
        apiRequest(`/stock-movements?productId=${product.id}`),
      ]);

      setDetailModal({
        open: true,
        product: productResult.data || product,
        movements: extractData(movementsResult),
        loading: false,
        error: '',
      });
    } catch (error) {
      setDetailModal({
        open: true,
        product,
        movements: [],
        loading: false,
        error: error.message || 'Erro ao carregar detalhes do produto.',
      });
    }
  }

  function closeDetails() {
    setDetailModal({
      open: false,
      product: null,
      movements: [],
      loading: false,
      error: '',
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint = isEditing ? `/products/${editingId}` : '/products';
      const method = isEditing ? 'PUT' : 'POST';

      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      setMessage(result.message || 'Produto salvo com sucesso.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = await confirm({
      title: 'Inativar produto',
      message: `Deseja inativar o produto "${product.name}"?`,
      confirmText: 'Inativar',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/products/${product.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Produto inativado com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao inativar produto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadProducts();
  }

  const title = useMemo(() => {
    return isEditing ? 'Editar produto / servico' : 'Novo produto / servico';
  }, [isEditing]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (stockFilter === 'baixo') {
        return (
          product.trackStock &&
          Number(product.currentStock || 0) <= Number(product.minStock || 0)
        );
      }

      return true;
    });
  }, [products, stockFilter]);

  const detailProduct = detailModal.product;
  const detailMovements = detailModal.movements || [];
  const detailCurrentStock = Number(detailProduct?.currentStock || 0);
  const detailMinStock = Number(detailProduct?.minStock || 0);
  const detailStockValue = detailCurrentStock * Number(detailProduct?.costPrice || 0);
  const detailEntries = detailMovements.filter((movement) => movement.type === 'entrada').length;
  const detailOutputs = detailMovements.filter((movement) => movement.type === 'saida' || movement.type === 'baixa_entrega').length;
  const detailAdjustments = detailMovements.filter((movement) => movement.type === 'ajuste' || movement.type === 'devolucao_entrega').length;

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Produtos</h1>
          <p>
            Cadastre produtos e servicos para estoque, compras, vendas,
            precificacao e relatorios.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <div className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total || 0}</strong>
          <p>Itens cadastrados.</p>
        </article>

        <article>
          <span>Produtos</span>
          <strong>{stats.produtos || 0}</strong>
          <p>Itens com controle operacional.</p>
        </article>

        <article>
          <span>Baixo estoque</span>
          <strong>{stats.baixoEstoque || 0}</strong>
          <p>Itens abaixo do minimo.</p>
        </article>

        <article>
          <span>Valor estoque</span>
          <strong>{formatCurrency(stats.valorEstoque)}</strong>
          <p>Custo total em estoque.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{title}</h2>
            <p>Informe dados, precos e controle de estoque.</p>
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
              <option value="produto">Produto</option>
              <option value="servico">Servico</option>
            </select>
          </label>

          <label>
            Nome *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            SKU
            <input name="sku" value={form.sku} onChange={handleChange} />
          </label>

          <label>
            Codigo de barras
            <input name="barcode" value={form.barcode} onChange={handleChange} />
          </label>

          <label>
            Categoria
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Tecnologia, material, servico..."
            />
          </label>
          <label>
  Fornecedor principal
  <select name="supplierId" value={form.supplierId} onChange={handleChange}>
    <option value="">Sem fornecedor vinculado</option>
    {suppliers.map((supplier) => (
      <option key={supplier.id} value={supplier.id}>
        {supplier.tradeName || supplier.name}
      </option>
    ))}
  </select>
</label>
<label>
  Fornecedor principal
  <select name="supplierId" value={form.supplierId} onChange={handleChange}>
    <option value="">Sem fornecedor vinculado</option>
    {suppliers.map((supplier) => (
      <option key={supplier.id} value={supplier.id}>
        {supplier.tradeName || supplier.name}
      </option>
    ))}
  </select>
</label>
          <label>
            Unidade
            <input name="unit" value={form.unit} onChange={handleChange} />
          </label>

          <label>
            Custo
            <input
              name="costPrice"
              type="number"
              step="0.01"
              value={form.costPrice}
              onChange={handleChange}
            />
          </label>

          <label>
            Preco de venda
            <input
              name="salePrice"
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={handleChange}
            />
          </label>

          <label>
            Estoque minimo
            <input
              name="minStock"
              type="number"
              step="0.001"
              value={form.minStock}
              onChange={handleChange}
            />
          </label>

          <label>
            Estoque atual
            <input
              name="currentStock"
              type="number"
              step="0.001"
              value={form.currentStock}
              onChange={handleChange}
            />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              name="trackStock"
              checked={form.trackStock}
              onChange={handleChange}
            />
            Controlar estoque deste item
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Criar produto'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Produtos cadastrados</h2>
            <p>{filteredProducts.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Buscar por nome, SKU, categoria..."
            />

            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos os tipos</option>
              <option value="produto">Produto</option>
              <option value="servico">Servico</option>
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="quick-filter-bar">
          <button
            type="button"
            className={stockFilter === '' ? 'quick-filter active' : 'quick-filter'}
            onClick={() => setStockFilter('')}
          >
            Todos
          </button>

          <button
            type="button"
            className={stockFilter === 'baixo' ? 'quick-filter active' : 'quick-filter'}
            onClick={() => setStockFilter('baixo')}
          >
            Estoque baixo
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const currentStock = Number(product.currentStock || 0);
                const minStock = Number(product.minStock || 0);
                const isLowStock = product.trackStock && currentStock <= minStock;

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>{product.sku || product.barcode || 'Sem codigo'}</span>
                    </td>

                    <td>{product.type}</td>
                    <td>{product.category || '-'}</td>
                    <td>{formatCurrency(product.costPrice)}</td>
                    <td>{formatCurrency(product.salePrice)}</td>

                    <td>
                      <strong className={isLowStock ? 'low-stock' : ''}>
                        {product.trackStock ? currentStock : 'Nao controla'}
                      </strong>
                      {product.trackStock && <span>Min: {minStock}</span>}
                    </td>

                    <td>
                      <span className={`status-badge status-${product.status}`}>
                        {product.status}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions crm-table-actions-expanded">
                        <button type="button" className="details-button" onClick={() => handleViewDetails(product)}>
                          Detalhes
                        </button>

                        <button type="button" onClick={() => handleEdit(product)}>
                          Editar
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(product)}
                        >
                          Inativar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailModal.open && detailProduct && (
        <div
          className="record-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do produto ${detailProduct.name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <article className="record-modal-card product-detail-modal-card">
            <header className="record-modal-header">
              <div>
                <span>Detalhes do produto</span>
                <h2>{detailProduct.name}</h2>
                <p>Resumo do cadastro, estoque e movimentações do produto selecionado.</p>
              </div>
              <button type="button" onClick={closeDetails} aria-label="Fechar">×</button>
            </header>

            <div className="record-detail-grid">
              <div className="record-detail-item">
                <small>Nome</small>
                <strong>{detailProduct.name || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Tipo</small>
                <strong>{detailProduct.type || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>SKU</small>
                <strong>{detailProduct.sku || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Código de barras</small>
                <strong>{detailProduct.barcode || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Categoria</small>
                <strong>{detailProduct.category || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Unidade</small>
                <strong>{detailProduct.unit || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Fornecedor</small>
                <strong>{detailProduct.supplier?.tradeName || detailProduct.supplier?.name || 'Sem fornecedor vinculado'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Status</small>
                <strong>{detailProduct.status || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Custo</small>
                <strong>{formatCurrency(detailProduct.costPrice)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Preço de venda</small>
                <strong>{formatCurrency(detailProduct.salePrice)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Estoque atual</small>
                <strong>{detailProduct.trackStock ? formatNumber(detailCurrentStock) : 'Não controla'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Estoque mínimo</small>
                <strong>{detailProduct.trackStock ? formatNumber(detailMinStock) : '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Situação do estoque</small>
                <strong>{getStockStatus(detailProduct)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Valor em estoque</small>
                <strong>{detailProduct.trackStock ? formatCurrency(detailStockValue) : '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Cadastrado em</small>
                <strong>{formatDateTime(detailProduct.createdAt)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Atualizado em</small>
                <strong>{formatDateTime(detailProduct.updatedAt)}</strong>
              </div>
              <div className="record-detail-item full">
                <small>Observações</small>
                <strong>{detailProduct.notes || 'Sem observações cadastradas.'}</strong>
              </div>
            </div>

            <section className="driver-box-modal-kpis product-detail-kpis">
              <article>
                <span>Movimentações</span>
                <strong>{detailMovements.length}</strong>
              </article>
              <article>
                <span>Entradas</span>
                <strong>{detailEntries}</strong>
              </article>
              <article>
                <span>Saídas</span>
                <strong>{detailOutputs}</strong>
              </article>
              <article>
                <span>Ajustes</span>
                <strong>{detailAdjustments}</strong>
              </article>
            </section>

            {detailModal.loading && <div className="module-message">Carregando detalhes do produto...</div>}
            {detailModal.error && <div className="module-message error">{detailModal.error}</div>}

            {!detailModal.loading && !detailModal.error && (
              <div className="driver-box-modal-list product-detail-movement-list">
                <h3>Últimas movimentações</h3>

                {detailMovements.slice(0, 10).map((movement) => (
                  <article className="driver-box-modal-delivery" key={movement.id}>
                    <div className="driver-box-modal-delivery-head">
                      <div>
                        <small>{formatDateTime(movement.createdAt)}</small>
                        <h3>{stockMovementLabels[movement.type] || movement.type || 'Movimentação'}</h3>
                        <p>{movement.reason || movement.reference || 'Sem referência informada'}</p>
                      </div>
                      <span className={`status-badge crm-status-${String(movement.type || 'entrada').replaceAll('_', '-')}`}>
                        {formatNumber(movement.quantity)} {detailProduct.unit || 'UN'}
                      </span>
                    </div>

                    <div className="driver-box-modal-delivery-grid">
                      <span><strong>Estoque anterior:</strong> {formatNumber(movement.stockBefore)}</span>
                      <span><strong>Estoque após:</strong> {formatNumber(movement.stockAfter)}</span>
                      <span><strong>Custo unitário:</strong> {formatCurrency(movement.unitCost)}</span>
                      <span><strong>Total:</strong> {formatCurrency(movement.totalCost)}</span>
                      <span><strong>Usuário:</strong> {movement.user?.name || '-'}</span>
                      <span><strong>Observação:</strong> {movement.notes || '-'}</span>
                    </div>
                  </article>
                ))}

                {detailMovements.length === 0 && (
                  <div className="empty-table product-detail-empty">
                    Nenhuma movimentação de estoque registrada para este produto.
                  </div>
                )}
              </div>
            )}

            <footer className="record-modal-footer">
              <button type="button" onClick={closeDetails}>Fechar</button>
            </footer>
          </article>
        </div>
      )}
    </section>
  );
}

export default Produtos;