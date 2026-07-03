import { useEffect, useState } from 'react';

import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';

const initialForm = {
  code: '',
  name: '',
  priority: 'media',
  customerId: '',
  contractId: '',
  managerName: '',
  startDate: '',
  endDate: '',
  budget: '',
  spentValue: '',
  progress: 0,
  description: '',
  notes: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getProjectStatusLabel(status) {
  const labels = {
    planejamento: 'Planejamento',
    em_andamento: 'Em andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
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

function getPriorityLabel(priority) {
  const labels = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica',
  };

  return labels[priority] || priority || '-';
}

function Projetos() {
  const { confirm, prompt: promptModal } = useAppModal();

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priority: '',
    approvalStatus: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadProjects() {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.approvalStatus) {
      params.append('approvalStatus', filters.approvalStatus);
    }

    const query = params.toString() ? `?${params.toString()}` : '';

    const [projectsResult, statsResult] = await Promise.all([
      apiRequest(`/projects${query}`),
      apiRequest('/projects/stats'),
    ]);

    setProjects(extractData(projectsResult));
    setStats(statsResult.data);
  }

  async function loadBaseData() {
    const [customersResult, contractsResult] = await Promise.all([
      apiRequest('/customers'),
      apiRequest('/contracts'),
    ]);

    setCustomers(extractData(customersResult));
    setContracts(extractData(contractsResult));
  }

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadBaseData(),
        loadProjects(),
      ]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar projetos.');
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

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function handleEdit(project) {
    setEditingId(project.id);

    setForm({
      code: project.code || '',
      name: project.name || '',
      priority: project.priority || 'media',
      customerId: project.customerId || '',
      contractId: project.contractId || '',
      managerName: project.managerName || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      spentValue: project.spentValue || '',
      progress: project.progress || 0,
      description: project.description || '',
      notes: project.notes || '',
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
        customerId: form.customerId || null,
        contractId: form.contractId || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: Number(form.budget || 0),
        spentValue: Number(form.spentValue || 0),
        progress: Number(form.progress || 0),
      };

      if (editingId) {
        const result = await apiRequest(`/projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setMessage(result.message || 'Projeto atualizado com sucesso.');
      } else {
        const result = await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setMessage(result.message || 'Projeto criado em planejamento.');
      }

      resetForm();
      await loadProjects();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar projeto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestApproval(project) {
    const confirmed = await confirm({
      title: 'Enviar projeto para aprovação',
      message: `Deseja enviar o projeto "${project.code}" para aprovação?`,
      confirmText: 'Enviar para aprovação',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/projects/${project.id}/request-approval`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Projeto enviado para aprovação.');
      await loadProjects();
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar projeto para aprovação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveProject(project) {
    const confirmed = await confirm({
      title: 'Aprovar projeto',
      message: `Deseja aprovar e iniciar o projeto "${project.code}"?`,
      confirmText: 'Aprovar projeto',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/projects/${project.id}/approve`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Projeto aprovado e iniciado com sucesso.');
      await loadProjects();
    } catch (error) {
      setMessage(error.message || 'Erro ao aprovar projeto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectProject(project) {
    const reason = await promptModal({
      title: 'Reprovar projeto',
      message: `Informe o motivo da reprovação do projeto "${project.code}".`,
      inputLabel: 'Motivo',
      inputPlaceholder: 'Ex: escopo pendente, orçamento divergente, contrato não aprovado...',
      confirmText: 'Reprovar projeto',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!reason) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/projects/${project.id}/reject-approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason,
        }),
      });

      setMessage(result.message || 'Projeto reprovado com sucesso.');
      await loadProjects();
    } catch (error) {
      setMessage(error.message || 'Erro ao reprovar projeto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelProject(project) {
    const confirmed = await confirm({
      title: 'Cancelar projeto',
      message: `Deseja cancelar o projeto "${project.code}"?`,
      confirmText: 'Cancelar projeto',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/projects/${project.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Projeto cancelado com sucesso.');
      await loadProjects();
    } catch (error) {
      setMessage(error.message || 'Erro ao cancelar projeto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadProjects();
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Gestão de projetos</span>
          <h1>Projetos</h1>
          <p>
            Controle escopo, prazos, responsáveis, custos e aprovação antes do início.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Projetos cadastrados</p>
        </article>

        <article>
          <span>Pendentes</span>
          <strong>{stats?.pendentesAprovacao || 0}</strong>
          <p>Aguardando aprovação</p>
        </article>

        <article>
          <span>Em andamento</span>
          <strong>{stats?.emAndamento || 0}</strong>
          <p>Projetos aprovados e iniciados</p>
        </article>

        <article>
          <span>Saldo</span>
          <strong>{formatCurrency(stats?.balanceTotal)}</strong>
          <p>Orçado menos gasto</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar projeto' : 'Novo projeto'}</h2>
            <p>
              O projeto será criado em planejamento. Para iniciar, envie para aprovação.
            </p>
          </div>

          {editingId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Código *
            <input name="code" value={form.code} onChange={handleChange} required />
          </label>

          <label>
            Nome *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Prioridade
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </label>

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

          <label>
            Contrato
            <select name="contractId" value={form.contractId} onChange={handleChange}>
              <option value="">Selecione</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.number} - {contract.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Responsável
            <input name="managerName" value={form.managerName} onChange={handleChange} />
          </label>

          <label>
            Início
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Fim
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Orçamento
            <input
              type="number"
              step="0.01"
              name="budget"
              value={form.budget}
              onChange={handleChange}
            />
          </label>

          <label>
            Valor gasto
            <input
              type="number"
              step="0.01"
              name="spentValue"
              value={form.spentValue}
              onChange={handleChange}
            />
          </label>

          <label>
            Progresso %
            <input
              type="number"
              min="0"
              max="100"
              name="progress"
              value={form.progress}
              onChange={handleChange}
            />
          </label>

          <label className="form-full">
            Descrição
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>

          <label className="form-full">
            Observações
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar projeto' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Projetos cadastrados</h2>
            <p>{projects.length} resultado(s)</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              placeholder="Buscar projeto..."
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />

            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="planejamento">Planejamento</option>
              <option value="em_andamento">Em andamento</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluído</option>
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

            <select
              value={filters.priority}
              onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
            >
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>

            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Status</th>
                <th>Aprovação</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Progresso</th>
                <th>Orçamento</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.code}</strong>
                    <span>{project.name}</span>
                  </td>

                  <td>
                    <span className={`status-badge status-${project.status}`}>
                      {getProjectStatusLabel(project.status)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge approval-${
                        project.approvalStatus || 'nao_enviado'
                      }`}
                    >
                      {getApprovalStatusLabel(project.approvalStatus)}
                    </span>

                    {project.rejectionReason && (
                      <small>{project.rejectionReason}</small>
                    )}
                  </td>

                  <td>{getPriorityLabel(project.priority)}</td>
                  <td>{project.managerName || '-'}</td>

                  <td>
                    <strong>{project.progress}%</strong>
                    <span>{formatCurrency(project.spentValue)} gasto</span>
                  </td>

                  <td>
                    <strong>{formatCurrency(project.budget)}</strong>
                    <span>Saldo {formatCurrency(project.balance)}</span>
                  </td>

                  <td>
                    <div className="table-actions">
                      {project.status === 'planejamento' &&
                        project.approvalStatus !== 'pendente' &&
                        project.approvalStatus !== 'aprovado' && (
                          <button type="button" onClick={() => handleEdit(project)}>
                            Editar
                          </button>
                        )}

                      {project.status === 'planejamento' &&
                        ['nao_enviado', 'reprovado', null, undefined].includes(
                          project.approvalStatus
                        ) && (
                          <button
                            type="button"
                            onClick={() => handleRequestApproval(project)}
                          >
                            Enviar aprovação
                          </button>
                        )}

                      {project.status === 'planejamento' &&
                        project.approvalStatus === 'pendente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveProject(project)}
                            >
                              Aprovar
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => handleRejectProject(project)}
                            >
                              Reprovar
                            </button>
                          </>
                        )}

                      {project.status !== 'cancelado' && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleCancelProject(project)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhum projeto encontrado.
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

export default Projetos;