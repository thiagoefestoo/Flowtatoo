import { useEffect, useMemo, useState } from 'react';

import CrmCrudPage from '../components/CrmCrudPage';
import { apiRequest, extractData } from '../services/api';
import { statusClass } from '../config/crmOptions';

const occurrenceTypeOptions = [
  { value: 'cliente_ausente', label: 'Cliente ausente' },
  { value: 'endereco_incorreto', label: 'Endereço incorreto' },
  { value: 'recusa_recebimento', label: 'Recusa no recebimento' },
  { value: 'produto_avariado', label: 'Produto avariado' },
  { value: 'atraso_rota', label: 'Atraso na rota' },
  { value: 'problema_operacional', label: 'Problema operacional' },
  { value: 'outro', label: 'Outro' },
];

const severityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

const occurrenceStatusOptions = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'resolvida', label: 'Resolvida' },
  { value: 'cancelada', label: 'Cancelada' },
];

function Ocorrencias() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const result = await apiRequest('/deliveries');
        setDeliveries(extractData(result));
      } catch (error) {
        setDeliveries([]);
      }
    }

    loadDeliveries();
  }, []);

  const deliveryOptions = useMemo(
    () => deliveries.map((item) => ({ value: item.id, label: `${item.orderNumber || 'Entrega'} - ${item.title}` })),
    [deliveries]
  );

  const fields = useMemo(() => [
    { name: 'deliveryId', label: 'Entrega', type: 'select', options: deliveryOptions, required: true },
    { name: 'type', label: 'Tipo de ocorrência', type: 'select', options: occurrenceTypeOptions, defaultValue: 'outro' },
    { name: 'severity', label: 'Gravidade', type: 'select', options: severityOptions, defaultValue: 'media' },
    { name: 'status', label: 'Status', type: 'select', options: occurrenceStatusOptions, defaultValue: 'aberta' },
    { name: 'description', label: 'Descrição da ocorrência', type: 'textarea', required: true, full: true },
    { name: 'solution', label: 'Solução / tratativa', type: 'textarea', full: true },
  ], [deliveryOptions]);

  return (
    <CrmCrudPage
      title="Ocorrências"
      eyebrow="Flowtatoo"
      description="Registre problemas de rota, falhas de entrega, ausência do cliente, endereço incorreto, recusa de recebimento e tratativas operacionais."
      endpoint="/delivery-occurrences"
      fields={fields}
      columns={[
        { key: 'delivery.title', label: 'Entrega' },
        { key: 'delivery.customer.name', label: 'Cliente' },
        { key: 'type', label: 'Tipo', badge: statusClass },
        { key: 'severity', label: 'Gravidade', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'registeredBy.name', label: 'Registrado por' },
        { key: 'createdAt', label: 'Registro', type: 'datetime' },
      ]}
      filters={[
        { name: 'type', label: 'Tipo', options: occurrenceTypeOptions },
        { name: 'severity', label: 'Gravidade', options: severityOptions },
        { name: 'status', label: 'Status', options: occurrenceStatusOptions },
      ]}
      stats={[
        { label: 'Ocorrências', description: 'Total registrado', getValue: (items) => items.length },
        { label: 'Abertas', description: 'Precisam de ação', getValue: (items) => items.filter((item) => item.status === 'aberta').length },
        { label: 'Críticas', description: 'Prioridade máxima', getValue: (items) => items.filter((item) => item.severity === 'critica').length },
        { label: 'Resolvidas', description: 'Tratativas concluídas', getValue: (items) => items.filter((item) => item.status === 'resolvida').length },
      ]}
      primaryAction="Registrar ocorrência"
      detailTitle="Detalhes da ocorrência"
    />
  );
}

export default Ocorrencias;
