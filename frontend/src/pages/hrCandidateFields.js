export function candidateLabel(candidate) {
  const position = candidate.desiredPosition || 'cargo não informado';
  const city = candidate.city ? ` · ${candidate.city}${candidate.state ? `/${candidate.state}` : ''}` : '';
  return `${candidate.name} — ${position}${city}`;
}

export function candidateSelectField(optionMap = {}) {
  return {
    name: 'candidateId',
    label: 'Candidato cadastrado',
    type: 'select',
    required: true,
    optionsEndpoint: '/candidates',
    optionValue: 'id',
    optionLabel: candidateLabel,
    placeholder: 'Selecione um candidato já cadastrado',
    helpText: 'Este fluxo usa somente candidatos cadastrados no módulo Candidatos.',
    hideInDetails: true,
    optionMap: {
      candidateName: 'name',
      employeeName: 'name',
      personName: 'name',
      email: 'email',
      phone: 'phone',
      jobTitle: 'desiredPosition',
      area: 'desiredPosition',
      ...optionMap,
    },
  };
}

export const hiddenCandidateNameField = {
  name: 'candidateName',
  label: 'Candidato',
  type: 'hidden',
  required: true,
};

export const hiddenEmployeeNameField = {
  name: 'employeeName',
  label: 'Nome do admitido',
  type: 'hidden',
  required: true,
};

export const hiddenPersonNameField = {
  name: 'personName',
  label: 'Pessoa',
  type: 'hidden',
  required: true,
};
