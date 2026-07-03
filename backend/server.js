require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');

require('./app/models/user');
require('./app/models/auditLog');
require('./app/models/jobOpening');
require('./app/models/candidate');
require('./app/models/candidateDocument');
require('./app/models/recruitmentProcess');
require('./app/models/interview');
require('./app/models/talentPool');
require('./app/models/hrProposal');
require('./app/models/admission');
require('./app/models/employee');
require('./app/models/hrDocument');
require('./app/models/onboardingTask');
require('./app/models/timeOffRequest');
require('./app/models/termination');
require('./app/models/tattooClient');
require('./app/models/tattooArtist');
require('./app/models/tattooAppointment');

require('./app/models/company');
require('./app/models/customer');
require('./app/models/customerDocument');

require('./app/models/lead');
require('./app/models/opportunity');
require('./app/models/activity');
require('./app/models/activityDocument');
require('./app/models/interaction');
require('./app/models/proposal');
require('./app/models/proposalDocument');
require('./app/models/entityDocument');
require('./app/models/campaign');
require('./app/models/delivery');
require('./app/models/deliveryOccurrence');
require('./app/models/supplier');
require('./app/models/product');
require('./app/models/stockMovement');
require('./app/models/deliveryItem');
require('./app/models/purchase');
require('./app/models/purchaseItem');
require('./app/models/sale');
require('./app/models/saleItem');
require('./app/models/costCenter');
require('./app/models/accountPlan');
require('./app/models/financialEntry');
require('./app/models/financialPaymentProof');
require('./app/models/contract');
require('./app/models/project');
require('./app/models/supplierDocument');





const hrDashboardRoutes = require('./app/routes/hrDashboardRoutes');
const hrBiRoutes = require('./app/routes/hrBiRoutes');
const jobOpeningRoutes = require('./app/routes/jobOpeningRoutes');
const candidateRoutes = require('./app/routes/candidateRoutes');
const candidateDocumentRoutes = require('./app/routes/candidateDocumentRoutes');
const recruitmentProcessRoutes = require('./app/routes/recruitmentProcessRoutes');
const interviewRoutes = require('./app/routes/interviewRoutes');
const talentPoolRoutes = require('./app/routes/talentPoolRoutes');
const hrProposalRoutes = require('./app/routes/hrProposalRoutes');
const admissionRoutes = require('./app/routes/admissionRoutes');
const employeeRoutes = require('./app/routes/employeeRoutes');
const hrDocumentRoutes = require('./app/routes/hrDocumentRoutes');
const onboardingTaskRoutes = require('./app/routes/onboardingTaskRoutes');
const timeOffRequestRoutes = require('./app/routes/timeOffRequestRoutes');
const terminationRoutes = require('./app/routes/terminationRoutes');
const tattooClientRoutes = require('./app/routes/tattooClientRoutes');
const tattooArtistRoutes = require('./app/routes/tattooArtistRoutes');
const tattooAppointmentRoutes = require('./app/routes/tattooAppointmentRoutes');
const tattooDashboardRoutes = require('./app/routes/tattooDashboardRoutes');

const authRoutes = require('./app/routes/authRoutes');
const healthRoutes = require('./app/routes/healthRoutes');
const companyRoutes = require('./app/routes/companyRoutes');
const customerRoutes = require('./app/routes/customerRoutes');
const customerDocumentRoutes = require('./app/routes/customerDocumentRoutes');

const crmDashboardRoutes = require('./app/routes/crmDashboardRoutes');
const leadRoutes = require('./app/routes/leadRoutes');
const opportunityRoutes = require('./app/routes/opportunityRoutes');
const activityRoutes = require('./app/routes/activityRoutes');
const activityDocumentRoutes = require('./app/routes/activityDocumentRoutes');
const interactionRoutes = require('./app/routes/interactionRoutes');
const proposalRoutes = require('./app/routes/proposalRoutes');
const proposalDocumentRoutes = require('./app/routes/proposalDocumentRoutes');
const entityDocumentRoutes = require('./app/routes/entityDocumentRoutes');
const campaignRoutes = require('./app/routes/campaignRoutes');
const deliveryRoutes = require('./app/routes/deliveryRoutes');
const deliveryOccurrenceRoutes = require('./app/routes/deliveryOccurrenceRoutes');
const supplierRoutes = require('./app/routes/supplierRoutes');
const productRoutes = require('./app/routes/productRoutes');
const stockMovementRoutes = require('./app/routes/stockMovementRoutes');
const purchaseRoutes = require('./app/routes/purchaseRoutes');
const saleRoutes = require('./app/routes/saleRoutes');
const financialRoutes = require('./app/routes/financialRoutes');
const contractRoutes = require('./app/routes/contractRoutes');
const projectRoutes = require('./app/routes/projectRoutes');
const dashboardRoutes = require('./app/routes/dashboardRoutes');
const userRoutes = require('./app/routes/userRoutes');
const costCenterRoutes = require('./app/routes/costCenterRoutes');
const accountPlanRoutes = require('./app/routes/accountPlanRoutes');
const auditLogRoutes = require('./app/routes/auditLogRoutes');
const alertRoutes = require('./app/routes/alertRoutes');
const supplierDocumentRoutes = require('./app/routes/supplierDocumentRoutes');

const app = express();

app.set('json escape', false);

app.use((req, res, next) => {
  res.setHeader('Content-Language', 'pt-BR');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Default-Charset', 'utf-8');
  res.charset = 'utf-8';

  const originalJson = res.json.bind(res);

  res.json = function jsonWithUtf8(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };

  next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Origem não permitida pelo CORS.'));
      },
    }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Flowtatoo API online.',
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/tattoo-dashboard', tattooDashboardRoutes);
app.use('/api/tattoo-clients', tattooClientRoutes);
app.use('/api/tattoo-artists', tattooArtistRoutes);
app.use('/api/tattoo-appointments', tattooAppointmentRoutes);

app.use('/api/hr-dashboard', hrDashboardRoutes);
app.use('/api/hr-bi', hrBiRoutes);
app.use('/api/job-openings', jobOpeningRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/candidate-documents', candidateDocumentRoutes);
app.use('/api/recruitment-processes', recruitmentProcessRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/talent-pool', talentPoolRoutes);
app.use('/api/hr-proposals', hrProposalRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/hr-documents', hrDocumentRoutes);
app.use('/api/onboarding-tasks', onboardingTaskRoutes);
app.use('/api/time-off-requests', timeOffRequestRoutes);
app.use('/api/terminations', terminationRoutes);

app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/crm-dashboard', crmDashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-documents', activityDocumentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/proposal-documents', proposalDocumentRoutes);
app.use('/api/entity-documents', entityDocumentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-occurrences', deliveryOccurrenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-documents', customerDocumentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/cost-centers', costCenterRoutes);
app.use('/api/account-plans', accountPlanRoutes);
app.use('/api/supplier-documents', supplierDocumentRoutes);


app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.query("SET client_encoding TO 'UTF8';");
    console.log('Banco conectado com sucesso.');

    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados com o banco.');
    }

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
      console.log(`Flowtatoo API rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();