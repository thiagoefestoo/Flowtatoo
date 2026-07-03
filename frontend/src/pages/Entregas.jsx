import { useEffect, useMemo, useState } from 'react';

import CrmCrudPage from '../components/CrmCrudPage';
import { apiRequest, extractData } from '../services/api';
import { approvalStatusOptions, statusClass } from '../config/crmOptions';

const deliveryStatusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviada', label: 'Enviada ao entregador' },
  { value: 'recebida', label: 'Recebida' },
  { value: 'em_rota', label: 'Em rota' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'nao_entregue', label: 'Não entregue' },
  { value: 'cancelada', label: 'Cancelada' },
];

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

function Entregas() {
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [customersResult, companiesResult, usersResult] = await Promise.all([
          apiRequest('/customers'),
          apiRequest('/companies'),
          apiRequest('/users?role=entregador'),
        ]);

        setCustomers(extractData(customersResult));
        setCompanies(extractData(companiesResult));
        setDrivers(extractData(usersResult));
      } catch (error) {
        setCustomers([]);
        setCompanies([]);
        setDrivers([]);
      }
    }

    loadOptions();
  }, []);

  const customerOptions = useMemo(
    () => customers.map((item) => ({ value: item.id, label: item.tradeName || item.name })),
    [customers]
  );
  const companyOptions = useMemo(
    () => companies.map((item) => ({ value: item.id, label: item.tradeName || item.corporateName })),
    [companies]
  );
  const driverOptions = useMemo(
    () => drivers.map((item) => ({ value: item.id, label: item.name })),
    [drivers]
  );

  const fields = useMemo(() => [
    { name: 'orderNumber', label: 'Número do pedido' },
    { name: 'title', label: 'Título da entrega', required: true },
    { name: 'document', label: 'Documento da entrega', required: true },
    { name: 'customerId', label: 'Cliente', type: 'select', options: customerOptions, required: true },
    { name: 'companyId', label: 'Empresa / filial', type: 'select', options: companyOptions },
    { name: 'driverId', label: 'Entregador', type: 'select', options: driverOptions },
    { name: 'recipientName', label: 'Responsável pelo recebimento' },
    { name: 'recipientPhone', label: 'Telefone do destinatário' },
    { name: 'zipCode', label: 'CEP' },
    { name: 'address', label: 'Endereço', required: true },
    { name: 'number', label: 'Número' },
    { name: 'complement', label: 'Complemento' },
    { name: 'district', label: 'Bairro' },
    { name: 'city', label: 'Cidade', required: true },
    { name: 'state', label: 'UF', required: true },
    { name: 'referencePoint', label: 'Ponto de referência' },
    { name: 'scheduledDate', label: 'Data prevista', type: 'datetime', required: true },
    { name: 'priority', label: 'Prioridade', type: 'select', options: priorityOptions, defaultValue: 'media' },
    { name: 'status', label: 'Status', type: 'select', options: deliveryStatusOptions, defaultValue: 'pendente' },
    { name: 'deliveryFee', label: 'Valor da entrega', type: 'currency' },
    { name: 'notes', label: 'Observações da operação', type: 'textarea', full: true },
    { name: 'driverNotes', label: 'Observações do entregador', type: 'textarea', full: true },
  ], [customerOptions, companyOptions, driverOptions]);

  return (
    <CrmCrudPage
      title="Entregas"
      eyebrow="Flowtatoo"
      description="Cadastre ordens de entrega, defina cliente, endereço, responsável e acompanhe o ciclo completo até a confirmação final no smartphone do entregador."
      endpoint="/deliveries"
      fields={fields}
      columns={[
        { key: 'orderNumber', label: 'Pedido' },
        { key: 'title', label: 'Entrega' },
        { key: 'customer.name', label: 'Cliente' },
        { key: 'driver.name', label: 'Entregador' },
        { key: 'city', label: 'Cidade' },
        { key: 'scheduledDate', label: 'Previsão', type: 'datetime' },
        { key: 'priority', label: 'Prioridade', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
      ]}
      filters={[
        { name: 'status', label: 'Status', options: deliveryStatusOptions },
        { name: 'priority', label: 'Prioridade', options: priorityOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Entregas', description: 'Ordens cadastradas', getValue: (items) => items.length },
        { label: 'Em rota', description: 'Operação em campo', getValue: (items) => items.filter((item) => item.status === 'em_rota').length },
        { label: 'Concluídas', description: 'Entregas finalizadas', getValue: (items) => items.filter((item) => item.status === 'entregue').length },
        { label: 'Pendentes aprovação', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Receita', description: 'Valor operacional', getValue: (items) => items.reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0), type: 'currency' },
      ]}
      documentsConfig={{
        endpoint: '/entity-documents/flow_delivery',
        title: 'Documentos da entrega',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      approvalConfig={{}}
      primaryAction="Cadastrar entrega"
      detailTitle="Detalhes da entrega"
    />
  );
}

export default Entregas;
