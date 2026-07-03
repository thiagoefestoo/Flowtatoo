require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = require('../app/models/user');
const JobOpening = require('../app/models/jobOpening');
const Candidate = require('../app/models/candidate');
const CandidateDocument = require('../app/models/candidateDocument');
const RecruitmentProcess = require('../app/models/recruitmentProcess');
const Interview = require('../app/models/interview');
const Admission = require('../app/models/admission');
const Employee = require('../app/models/employee');
const OnboardingTask = require('../app/models/onboardingTask');
const TimeOffRequest = require('../app/models/timeOffRequest');
const Termination = require('../app/models/termination');
const HrDocument = require('../app/models/hrDocument');
const HrProposal = require('../app/models/hrProposal');
const TalentPool = require('../app/models/talentPool');

const firstNames = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Quitéria', 'Rafael', 'Sofia', 'Thiago', 'Vitória', 'William'];
const lastNames = ['Almeida', 'Barbosa', 'Castro', 'Dias', 'Ferreira', 'Gomes', 'Lima', 'Mendes', 'Nogueira', 'Oliveira', 'Pereira', 'Rocha', 'Santos', 'Teixeira', 'Vieira'];
const cities = [['São Paulo', 'SP'], ['Campinas', 'SP'], ['Curitiba', 'PR'], ['Londrina', 'PR'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Joinville', 'SC'], ['Florianópolis', 'SC']];
const positions = ['Analista de Recursos Humanos', 'Assistente Administrativo', 'Desenvolvedor Full Stack', 'Analista Financeiro', 'Vendedor Interno', 'Coordenador Operacional', 'Designer Social Media', 'Analista de Suporte', 'Auxiliar de Logística', 'Gerente Comercial'];
const departments = ['RH', 'Administrativo', 'Tecnologia', 'Financeiro', 'Comercial', 'Operações', 'Marketing', 'Logística'];
const sources = ['indicacao', 'linkedin', 'site', 'whatsapp', 'banco_talentos', 'agencia', 'outro'];
const candidateStatuses = ['novo', 'em_triagem', 'em_processo', 'aprovado', 'reprovado', 'banco_talentos'];
const candidateStages = ['inscrito', 'triagem_curricular', 'contato_inicial', 'entrevista_rh', 'entrevista_tecnica', 'teste_pratico', 'entrevista_gestor', 'proposta'];
const processStages = ['triagem_curricular', 'contato_inicial', 'entrevista_rh', 'entrevista_tecnica', 'teste_pratico', 'entrevista_gestor', 'proposta', 'admissao'];
const processStatuses = ['em_andamento', 'pausado', 'aprovado', 'reprovado', 'desistente', 'contratado'];
const interviewStatuses = ['agendada', 'confirmada', 'realizada', 'remarcada', 'cancelada', 'nao_compareceu'];
const proposalStatuses = ['em_elaboracao', 'enviada', 'aceita', 'recusada', 'negociacao'];

function pick(items, index, salt = 0) {
  return items[(index + salt) % items.length];
}

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function historicalDate(index, span = 180, offset = 0) {
  const daysBack = (index * 3 + offset) % span;
  return addDays(-1 * daysBack);
}

async function ensureAdmin() {
  const email = 'admin@flowpeople.com';
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  await User.findOrCreate({
    where: { email },
    defaults: {
      name: 'Administrador FlowPeople',
      email,
      passwordHash,
      role: 'admin',
      status: 'ativo',
      notes: 'Administrador criado para testes de volume.',
    },
  });
}

async function main() {
  const total = Math.max(Number(process.argv[2] || process.env.FLOWPEOPLE_VOLUME || 50), 1);
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12);

  await sequelize.authenticate();
  await sequelize.query("SET client_encoding TO 'UTF8';");
  await sequelize.sync({ alter: true });
  await ensureAdmin();

  const jobs = [];
  for (let i = 0; i < Math.max(5, Math.ceil(total / 10)); i += 1) {
    const title = pick(positions, i);
    jobs.push({
      code: `VOL-${stamp}-${String(i + 1).padStart(3, '0')}`,
      title,
      department: pick(departments, i),
      seniority: pick(['junior', 'pleno', 'senior', 'lideranca'], i),
      contractType: pick(['clt', 'pj', 'temporario', 'estagio'], i),
      workModel: pick(['presencial', 'hibrido', 'remoto'], i),
      location: `${pick(cities, i)[0]} - ${pick(cities, i)[1]}`,
      openings: (i % 3) + 1,
      salaryMin: 2200 + (i % 10) * 450,
      salaryMax: 3600 + (i % 10) * 650,
      status: pick(['aberta', 'triagem', 'entrevistas', 'proposta'], i),
      priority: pick(['baixa', 'media', 'alta', 'urgente'], i),
      recruiterName: pick(['Marina RH', 'Carlos RH', 'Patrícia Almeida', 'Suelen Gestão'], i),
      managerName: pick(['Diretoria', 'Coordenação', 'Gestão de Área'], i),
      deadline: addDays(7 + (i % 20)),
      createdAt: historicalDate(i, 180, 4),
      updatedAt: historicalDate(i, 120, 2),
      description: `Vaga criada por seed de volume para ${title}.`,
      requirements: 'Comunicação, organização, experiência na área e disponibilidade para evolução no processo.',
    });
  }

  const createdJobs = await JobOpening.bulkCreate(jobs);
  const uploadDir = path.join(__dirname, '../uploads/candidates');
  fs.mkdirSync(uploadDir, { recursive: true });

  for (let i = 0; i < total; i += 1) {
    const [city, state] = pick(cities, i);
    const job = createdJobs[i % createdJobs.length];
    const name = `${pick(firstNames, i)} ${pick(lastNames, i, 3)} ${pick(lastNames, i, 8)}`;
    const email = `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')}.${stamp}.${i + 1}@flowpeople.test`;
    const candidateCreatedAt = historicalDate(i, 180);
    const candidateUpdatedAt = historicalDate(i, 120, 1);

    const candidate = await Candidate.create({
      name,
      email,
      phone: `(11) 9${String(10000000 + i).slice(0, 8)}`,
      city,
      state,
      desiredPosition: job.title,
      source: pick(sources, i),
      salaryExpectation: 2200 + (i % 12) * 600,
      linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`,
      status: pick(candidateStatuses, i),
      stage: pick(candidateStages, i),
      rating: (i % 10) + 1,
      tags: pick(['comunicativo,organizado', 'técnico,analítico', 'liderança,experiência', 'junior,potencial'], i),
      notes: `Candidato de teste gerado automaticamente no lote ${stamp}.`,
      createdAt: candidateCreatedAt,
      updatedAt: candidateUpdatedAt,
    });

    await RecruitmentProcess.create({
      candidateId: candidate.id,
      candidateName: candidate.name,
      jobTitle: job.title,
      recruiterName: pick(['Marina RH', 'Carlos RH', 'Patrícia Almeida'], i),
      stage: pick(processStages, i),
      status: pick(processStatuses, i),
      score: 45 + (i % 55),
      startedAt: addDays(-1 * (i % 30)),
      nextActionAt: addDays((i % 12) + 1),
      lastContactAt: i % 3 === 0 ? addDays(-1 * (i % 10)) : null,
      strengths: 'Boa comunicação, histórico coerente e aderência inicial ao cargo.',
      risks: 'Validar pretensão salarial, disponibilidade e profundidade técnica.',
      notes: `Processo seletivo automático do lote ${stamp}.`,
      createdAt: historicalDate(i, 170, 1),
      updatedAt: historicalDate(i, 120, 2),
    });

    if (i % 2 === 0) {
      await Interview.create({
        candidateId: candidate.id,
        candidateName: candidate.name,
        jobTitle: job.title,
        interviewerName: pick(['Marina RH', 'Gestor da Área', 'Coordenação Técnica'], i),
        interviewType: pick(['online', 'rh', 'tecnica', 'gestor', 'telefone'], i),
        scheduledAt: i % 10 === 0 ? addDays((i % 7) + 1) : historicalDate(i, 150, 2),
        locationOrLink: i % 3 === 0 ? 'Google Meet' : 'Sala de reunião / Teams',
        status: pick(interviewStatuses, i),
        communicationScore: i % 11,
        technicalScore: (i + 2) % 11,
        cultureScore: (i + 4) % 11,
        result: pick(['aguardando', 'proxima_fase', 'aprovado', 'reprovado', 'banco_talentos'], i),
        feedback: 'Registro de entrevista criado para teste de volume.',
        createdAt: historicalDate(i, 150, 2),
        updatedAt: historicalDate(i, 110, 3),
      });
    }

    if (i % 3 === 0) {
      await HrProposal.create({
        candidateId: candidate.id,
        candidateName: candidate.name,
        jobTitle: job.title,
        salary: 2600 + (i % 12) * 700,
        benefits: 'Vale refeição, vale transporte, plano de saúde e trilha de desenvolvimento.',
        startDate: addDays(10 + (i % 20)),
        contractType: pick(['clt', 'pj', 'temporario', 'estagio'], i),
        workModel: pick(['presencial', 'hibrido', 'remoto'], i),
        status: pick(proposalStatuses, i),
        sentAt: i % 4 === 0 ? addDays(-2) : null,
        acceptedAt: i % 9 === 0 ? addDays(-1) : null,
        notes: 'Proposta gerada automaticamente para teste.',
        createdAt: historicalDate(i, 130, 3),
        updatedAt: historicalDate(i, 100, 4),
      });
    }

    if (i % 4 === 0) {
      await TalentPool.create({
        candidateId: candidate.id,
        candidateName: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        area: candidate.desiredPosition || job.department,
        level: pick(['junior', 'pleno', 'senior', 'especialista'], i),
        availability: pick(['imediata', 'ate_15_dias', 'ate_30_dias', 'empregado'], i),
        rating: candidate.rating,
        lastContactAt: addDays(-1 * (i % 20)),
        status: pick(['ativo', 'em_contato', 'reservado', 'inativo'], i),
        notes: 'Banco de talentos alimentado por carga de teste.',
        createdAt: historicalDate(i, 160, 4),
        updatedAt: historicalDate(i, 110, 5),
      });
    }

    if (i % 7 === 0) {
      await Admission.create({
        candidateId: candidate.id,
        employeeName: candidate.name,
        jobTitle: job.title,
        department: job.department,
        managerName: job.managerName,
        startDate: historicalDate(i, 120, 5),
        status: pick(['documentos_pendentes', 'exame_pendente', 'contrato_pendente', 'acessos_pendentes', 'integracao_agendada'], i),
        documentsStatus: pick(['pendente', 'enviado', 'validado', 'recusado'], i),
        medicalExamStatus: pick(['pendente', 'agendado', 'realizado', 'apto'], i),
        contractStatus: pick(['pendente', 'enviado', 'assinado'], i),
        accessStatus: pick(['pendente', 'solicitado', 'liberado'], i),
        equipmentStatus: pick(['pendente', 'separado', 'entregue', 'nao_aplica'], i),
        notes: 'Admissão gerada automaticamente para teste.',
        createdAt: historicalDate(i, 120, 5),
        updatedAt: historicalDate(i, 90, 6),
      });
    }



    if (i % 9 === 0) {
      await Employee.create({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        document: `${String(10000000000 + i).slice(0, 11)}`,
        jobTitle: job.title,
        department: job.department,
        managerName: job.managerName,
        admissionDate: historicalDate(i, 160, 9),
        contractType: pick(['clt', 'pj', 'temporario', 'estagio'], i),
        salary: 2800 + (i % 14) * 650,
        benefits: 'Vale refeição, vale transporte, plano de saúde e trilha de desenvolvimento.',
        status: pick(['ativo', 'experiencia', 'ferias', 'afastado'], i),
        experienceReview30: addDays(30 + (i % 5)),
        experienceReview60: addDays(60 + (i % 5)),
        experienceReview90: addDays(90 + (i % 5)),
        notes: 'Colaborador criado automaticamente para BI gerencial.',
        createdAt: historicalDate(i, 160, 9),
        updatedAt: historicalDate(i, 80, 3),
      });

      await OnboardingTask.create({
        employeeName: candidate.name,
        title: pick(['Separar equipamentos', 'Criar acessos', 'Enviar kit boas-vindas', 'Treinamento inicial'], i),
        responsibleName: pick(['Marina RH', 'TI Interno', 'Gestor da Área'], i),
        dueDate: addDays((i % 20) - 7),
        status: pick(['pendente', 'em_andamento', 'concluida', 'atrasada'], i),
        category: pick(['documentos', 'acessos', 'equipamentos', 'integracao', 'treinamento'], i),
        notes: 'Tarefa de onboarding criada para testes de BI.',
        createdAt: historicalDate(i, 130, 11),
        updatedAt: historicalDate(i, 75, 4),
      });
    }

    if (i % 18 === 0) {
      await TimeOffRequest.create({
        employeeName: candidate.name,
        type: pick(['ferias', 'atestado', 'licenca', 'afastamento', 'ausencia_justificada', 'banco_horas'], i),
        startDate: addDays((i % 28) - 12),
        endDate: addDays((i % 28) - 7),
        status: pick(['solicitado', 'em_analise', 'aprovado', 'concluido'], i),
        approvedBy: pick(['Gestor da Área', 'Marina RH'], i),
        reason: 'Solicitação criada automaticamente para teste de BI.',
        notes: 'Registro de afastamento/férias gerado por seed.',
        createdAt: historicalDate(i, 120, 12),
        updatedAt: historicalDate(i, 70, 5),
      });
    }

    if (i % 40 === 0) {
      await Termination.create({
        employeeName: candidate.name,
        jobTitle: job.title,
        type: pick(['pedido_demissao', 'empresa_sem_justa_causa', 'termino_contrato', 'acordo'], i),
        requestedAt: historicalDate(i, 110, 13),
        lastDay: addDays((i % 18) + 3),
        status: pick(['em_andamento', 'aviso_previo', 'documentos_pendentes', 'concluido'], i),
        accessBlocked: i % 2 === 0,
        equipmentReturned: i % 3 === 0,
        exitInterviewDone: i % 4 === 0,
        notes: 'Desligamento fictício para indicadores gerenciais.',
        createdAt: historicalDate(i, 110, 13),
        updatedAt: historicalDate(i, 60, 6),
      });
    }

    await HrDocument.create({
      candidateId: candidate.id,
      personName: candidate.name,
      personType: 'candidato',
      documentType: pick(['Currículo', 'RG/CPF', 'Certificado', 'Comprovante de residência'], i),
      status: pick(['pendente', 'enviado', 'validado', 'recusado', 'vencido'], i),
      dueDate: addDays(5 + (i % 20)),
      fileUrl: null,
      validatedBy: i % 5 === 0 ? 'Patrícia Almeida' : null,
      notes: 'Controle documental criado por seed de volume.',
      createdAt: historicalDate(i, 180, 6),
      updatedAt: historicalDate(i, 90, 7),
    });

    const fileName = `${stamp}-${String(i + 1).padStart(4, '0')}-candidato.txt`;
    const fileContent = `Documento de teste do candidato ${candidate.name}.\nGerado automaticamente pelo FlowPeople.\n`;
    fs.writeFileSync(path.join(uploadDir, fileName), fileContent, 'utf-8');

    await CandidateDocument.create({
      candidateId: candidate.id,
      documentType: i % 2 === 0 ? 'curriculo' : 'documento_pessoal',
      originalName: `${candidate.name.replace(/\s+/g, '-').toLowerCase()}-teste.txt`,
      fileName,
      filePath: `/uploads/candidates/${fileName}`,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(fileContent),
      uploadedBy: null,
      notes: 'Arquivo fictício criado para teste de anexos.',
      createdAt: historicalDate(i, 180, 7),
      updatedAt: historicalDate(i, 90, 8),
    });
  }

  console.log(`Carga FlowPeople concluída: ${total} candidatos e registros relacionados criados.`);
  console.log('Login: admin@flowpeople.com | Senha: Admin@12345');
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Erro ao popular volume FlowPeople:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
