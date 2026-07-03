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
const HrDocument = require('../app/models/hrDocument');
const OnboardingTask = require('../app/models/onboardingTask');
const TalentPool = require('../app/models/talentPool');

async function ensureAdmin() {
  const email = 'admin@flowtatoo.com';
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  await User.findOrCreate({
    where: { email },
    defaults: {
      name: 'Administrador Flowtatoo',
      email,
      passwordHash,
      role: 'admin',
      status: 'ativo',
      notes: 'Administrador criado para demonstração.',
    },
  });
}

async function main() {
  await sequelize.authenticate();
  await sequelize.query("SET client_encoding TO 'UTF8';");
  await sequelize.sync({ alter: true });

  await ensureAdmin();

  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12);

  const jobs = await JobOpening.bulkCreate([
    { code: `RH-${stamp}-01`, title: 'Analista de Recursos Humanos', department: 'RH', seniority: 'pleno', contractType: 'clt', workModel: 'hibrido', location: 'São Paulo - SP', openings: 1, salaryMin: 4200, salaryMax: 5600, status: 'entrevistas', priority: 'alta', recruiterName: 'Marina RH', managerName: 'Diretoria Administrativa', deadline: new Date(), description: 'Atuação em recrutamento, seleção e admissão.', requirements: 'Experiência com entrevistas, triagem e indicadores.' },
    { code: `RH-${stamp}-02`, title: 'Desenvolvedor Full Stack', department: 'Tecnologia', seniority: 'senior', contractType: 'pj', workModel: 'remoto', location: 'Remoto', openings: 2, salaryMin: 9000, salaryMax: 13000, status: 'triagem', priority: 'urgente', recruiterName: 'Marina RH', managerName: 'Coordenação de TI', deadline: new Date(), description: 'Desenvolvimento web ponta a ponta.', requirements: 'React, Node, banco relacional e APIs.' },
    { code: `RH-${stamp}-03`, title: 'Assistente Administrativo', department: 'Administrativo', seniority: 'junior', contractType: 'clt', workModel: 'presencial', location: 'Campinas - SP', openings: 1, salaryMin: 2300, salaryMax: 2800, status: 'aberta', priority: 'media', recruiterName: 'Carlos RH', managerName: 'Gestão Administrativa', deadline: new Date(), description: 'Rotinas administrativas e atendimento interno.', requirements: 'Organização, Excel e boa comunicação.' },
  ]);

  const candidates = await Candidate.bulkCreate([
    { name: 'Ana Carolina Mendes', email: `ana.${stamp}@flowtatoo.com`, phone: '(11) 90000-1001', city: 'São Paulo', state: 'SP', desiredPosition: jobs[0].title, source: 'linkedin', salaryExpectation: 5200, status: 'em_processo', stage: 'entrevista_rh', rating: 9, notes: 'Perfil aderente à vaga de RH.' },
    { name: 'Bruno Henrique Lima', email: `bruno.${stamp}@flowtatoo.com`, phone: '(11) 90000-1002', city: 'Santo André', state: 'SP', desiredPosition: jobs[1].title, source: 'indicacao', salaryExpectation: 12000, status: 'em_triagem', stage: 'triagem_curricular', rating: 8, notes: 'Boa experiência técnica.' },
    { name: 'Camila Rocha', email: `camila.${stamp}@flowtatoo.com`, phone: '(19) 90000-1003', city: 'Campinas', state: 'SP', desiredPosition: jobs[2].title, source: 'site', salaryExpectation: 2600, status: 'novo', stage: 'inscrito', rating: 7, notes: 'Aguardando contato inicial.' },
  ]);

  await RecruitmentProcess.bulkCreate([
    { candidateId: candidates[0].id, candidateName: candidates[0].name, jobTitle: jobs[0].title, recruiterName: 'Marina RH', stage: 'entrevista_rh', status: 'em_andamento', score: 86, startedAt: new Date(), nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000), strengths: 'Comunicação e vivência de RH.', risks: 'Validar pretensão salarial.' },
    { candidateId: candidates[1].id, candidateName: candidates[1].name, jobTitle: jobs[1].title, recruiterName: 'Marina RH', stage: 'triagem_curricular', status: 'em_andamento', score: 78, startedAt: new Date(), nextActionAt: new Date(Date.now() + 48 * 60 * 60 * 1000), strengths: 'Stack aderente.', risks: 'Checar disponibilidade.' },
  ]);

  await Interview.bulkCreate([
    { candidateId: candidates[0].id, candidateName: candidates[0].name, jobTitle: jobs[0].title, interviewerName: 'Marina RH', interviewType: 'rh', scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000), locationOrLink: 'Google Meet', status: 'confirmada', result: 'aguardando' },
    { candidateId: candidates[1].id, candidateName: candidates[1].name, jobTitle: jobs[1].title, interviewerName: 'Coordenação de TI', interviewType: 'tecnica', scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000), locationOrLink: 'Microsoft Teams', status: 'agendada', result: 'aguardando' },
  ]);

  await TalentPool.create({ candidateId: candidates[2].id, candidateName: candidates[2].name, email: candidates[2].email, phone: candidates[2].phone, area: candidates[2].desiredPosition || 'Administrativo', level: 'pleno', availability: 'ate_30_dias', rating: 8, status: 'ativo', notes: 'Bom perfil para futuras vagas comerciais.' });

  await Admission.create({ candidateId: candidates[0].id, employeeName: candidates[0].name, jobTitle: jobs[0].title, department: 'Financeiro', managerName: 'Gestão Financeira', startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'documentos_pendentes', documentsStatus: 'pendente', medicalExamStatus: 'agendado', contractStatus: 'pendente', accessStatus: 'pendente', equipmentStatus: 'nao_aplica' });

  await Employee.bulkCreate([
    { name: 'Patrícia Almeida', email: `patricia.${stamp}@flowtatoo.com`, phone: '(11) 90000-3001', document: `100${stamp}`, jobTitle: 'Coordenadora de RH', department: 'RH', managerName: 'Diretoria', admissionDate: new Date(), contractType: 'clt', salary: 7800, status: 'ativo' },
    { name: 'Rafael Oliveira', email: `rafael.${stamp}@flowtatoo.com`, phone: '(11) 90000-3002', document: `200${stamp}`, jobTitle: 'Analista de Sistemas', department: 'Tecnologia', managerName: 'Coordenação de TI', admissionDate: new Date(), contractType: 'pj', salary: 9500, status: 'experiencia' },
  ]);

  await HrDocument.bulkCreate([
    { candidateId: candidates[0].id, personName: candidates[0].name, personType: 'candidato', documentType: 'RG/CPF', status: 'pendente', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { candidateId: candidates[1].id, personName: candidates[1].name, personType: 'candidato', documentType: 'Currículo validado', status: 'validado', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), validatedBy: 'Patrícia Almeida' },
  ]);

  const candidateUploadDir = path.join(__dirname, '../uploads/candidates');
  fs.mkdirSync(candidateUploadDir, { recursive: true });

  const candidateDocuments = candidates.map((candidate, index) => {
    const fileName = `${stamp}-${index + 1}-documento-demo.txt`;
    const fileContent = `Documento demonstrativo do candidato ${candidate.name}.\nFlowtatoo - base de teste.\n`;
    fs.writeFileSync(path.join(candidateUploadDir, fileName), fileContent, 'utf-8');

    return {
      candidateId: candidate.id,
      documentType: index === 0 ? 'curriculo' : 'documento_pessoal',
      originalName: `${candidate.name.replace(/\s+/g, '-').toLowerCase()}-demo.txt`,
      fileName,
      filePath: `/uploads/candidates/${fileName}`,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(fileContent),
      uploadedBy: null,
      notes: 'Registro de documento demonstrativo. Substitua por arquivo real no uso normal.',
    };
  });

  await CandidateDocument.bulkCreate(candidateDocuments);

  await OnboardingTask.bulkCreate([
    { employeeName: 'Juliana Martins', title: 'Solicitar documentos admissionais', responsibleName: 'Patrícia Almeida', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: 'pendente', category: 'documentos' },
    { employeeName: 'Rafael Oliveira', title: 'Liberar e-mail corporativo', responsibleName: 'TI Interno', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), status: 'em_andamento', category: 'acessos' },
  ]);

  console.log('Base de demonstração Flowtatoo criada com sucesso.');
  console.log('Login: admin@flowtatoo.com');
  console.log('Senha: Admin@12345');
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Erro ao popular demonstração:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
