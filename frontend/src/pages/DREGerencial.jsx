import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function DREGerencial() {
  const [dre, setDre] = useState(null);
  const [costCenters, setCostCenters] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    costCenterId: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadCostCenters() {
    const result = await apiRequest('/cost-centers?status=ativo');
    setCostCenters(extractData(result));
  }

  async function loadDre() {
    try {
      setLoading(true);
      setMessage('');

      const params = new URLSearchParams();

      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.costCenterId) params.set('costCenterId', filters.costCenterId);

      const query = params.toString();
      const result = await apiRequest(`/financial/dre${query ? `?${query}` : ''}`);

      setDre(result.data);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar DRE gerencial.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCostCenters();
    loadDre();
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await loadDre();
  }

  const summary = dre?.summary || {
    receitas: 0,
    custos: 0,
    despesas: 0,
    resultado: 0,
    totalLancamentos: 0,
  };

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Controladoria</span>
          <h1>DRE Gerencial</h1>
          <p>
            Analise receitas, custos, despesas e resultado por periodo,
            centro de custo e plano de contas.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>Filtros da DRE</h2>
            <p>Use os filtros para analisar o resultado por periodo ou centro de custo.</p>
          </div>
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
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

          <label>
            Centro de Custo
            <select
              name="costCenterId"
              value={filters.costCenterId}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              {costCenters.map((costCenter) => (
                <option key={costCenter.id} value={costCenter.id}>
                  {costCenter.code} - {costCenter.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar DRE'}
            </button>
          </div>
        </form>
      </section>

      <section className="kpi-grid">
        <article>
          <span>Receitas</span>
          <strong>{formatCurrency(summary.receitas)}</strong>
          <p>Entradas classificadas como receita.</p>
        </article>

        <article>
          <span>Custos</span>
          <strong>{formatCurrency(summary.custos)}</strong>
          <p>Custos vinculados a operacao.</p>
        </article>

        <article>
          <span>Despesas</span>
          <strong>{formatCurrency(summary.despesas)}</strong>
          <p>Saidas administrativas e financeiras.</p>
        </article>

        <article>
          <span>Resultado</span>
          <strong>{formatCurrency(summary.resultado)}</strong>
          <p>{summary.resultado >= 0 ? 'Resultado positivo.' : 'Resultado negativo.'}</p>
        </article>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>DRE por Plano de Contas</h2>
            <p>{dre?.byAccountPlan?.length || 0} conta(s) analisada(s)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Plano de Contas</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>

            <tbody>
              {(dre?.byAccountPlan || []).map((item) => (
                <tr key={item.name}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.type}</td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}

              {(!dre?.byAccountPlan || dre.byAccountPlan.length === 0) && (
                <tr>
                  <td colSpan="3" className="empty-table">
                    Nenhum dado encontrado para a DRE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>DRE por Centro de Custo</h2>
            <p>{dre?.byCostCenter?.length || 0} centro(s) analisado(s)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Centro de Custo</th>
                <th>Valor movimentado</th>
              </tr>
            </thead>

            <tbody>
              {(dre?.byCostCenter || []).map((item) => (
                <tr key={item.name}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}

              {(!dre?.byCostCenter || dre.byCostCenter.length === 0) && (
                <tr>
                  <td colSpan="2" className="empty-table">
                    Nenhum centro de custo encontrado.
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

export default DREGerencial;