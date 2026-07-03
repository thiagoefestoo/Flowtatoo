require('dotenv').config();

const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const User = require('../app/models/user');
const TattooClient = require('../app/models/tattooClient');
const TattooArtist = require('../app/models/tattooArtist');
const TattooAppointment = require('../app/models/tattooAppointment');

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function money(min, max) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function timeSlot(index) {
  const slots = ['09:00:00','10:30:00','12:00:00','13:30:00','15:00:00','16:30:00','18:00:00','19:30:00'];
  return slots[index % slots.length];
}

function addMinutes(timeValue, minutes) {
  const [hours, mins] = String(timeValue).split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, mins, 0);
  date.setMinutes(date.getMinutes() + Number(minutes || 120));
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

async function ensureAdmin() {
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  const [user] = await User.findOrCreate({
    where: { email: 'admin@flowpeople.com' },
    defaults: {
      name: 'Administrador FlowTattoo',
      email: 'admin@flowpeople.com',
      passwordHash,
      role: 'admin',
      status: 'ativo',
    },
  });

  await user.update({ passwordHash, role: 'admin', status: 'ativo', name: user.name || 'Administrador FlowTattoo' });
}

async function main() {
  const total = Number(process.argv[2] || process.env.FLOWTATTOO_VOLUME || 120);

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await ensureAdmin();

  const firstNames = ['Ana','Bruno','Camila','Diego','Eduarda','Felipe','Giovana','Henrique','Isabela','Joao','Karina','Lucas','Marina','Nicolas','Olivia','Pedro','Rafaela','Samuel','Talita','Victor','Yasmin','Caio','Bianca','Renata','Gustavo'];
  const lastNames = ['Silva','Santos','Oliveira','Souza','Pereira','Costa','Ribeiro','Almeida','Ferreira','Mendes','Lima','Rocha','Martins','Moreira','Barbosa'];
  const cities = ['Joinville','Curitiba','Sao Paulo','Florianopolis','Ponta Grossa','Itajai','Blumenau'];
  const styles = ['fineline','blackwork','old school','realismo','minimalista','oriental','lettering','geometrico','tribal','aquarela','pontilhismo'];
  const areas = ['braco','antebraco','costela','perna','panturrilha','ombro','nuca','peito','mao','tornozelo','costas'];
  const titles = ['Projeto autoral','Fechamento de braco','Tattoo minimalista','Lettering especial','Retoque programado','Primeira tattoo','Arte personalizada','Composicao floral','Traços finos','Sessao longa'];

  const artistPayloads = [
    { name: 'Maya Ink', phone: '47999910001', instagram: '@maya.ink', specialties: 'fineline, minimalista, floral', commissionPercent: 55, color: '#8b5cf6' },
    { name: 'Theo Black', phone: '47999910002', instagram: '@theoblacktattoo', specialties: 'blackwork, geometrico, tribal', commissionPercent: 50, color: '#111827' },
    { name: 'Luna Realismo', phone: '47999910003', instagram: '@lunarealismo', specialties: 'realismo, sombreado', commissionPercent: 60, color: '#f97316' },
    { name: 'Nico Old', phone: '47999910004', instagram: '@nicooldschool', specialties: 'old school, colorida', commissionPercent: 50, color: '#06b6d4' },
  ];

  const artists = [];
  for (const payload of artistPayloads) {
    const [artist] = await TattooArtist.findOrCreate({ where: { instagram: payload.instagram }, defaults: payload });
    await artist.update(payload);
    artists.push(artist);
  }

  const clients = [];
  for (let i = 0; i < Math.max(40, Math.ceil(total * 0.6)); i += 1) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const phone = `47${String(980000000 + i).slice(0, 9)}`;
    const [client] = await TattooClient.findOrCreate({
      where: { phone },
      defaults: {
        name,
        phone,
        whatsapp: phone,
        email: `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')}@email.com`,
        city: pick(cities),
        instagram: `@${name.toLowerCase().replace(/\s+/g, '')}${i}`,
        source: pick(['instagram','whatsapp','indicacao','google','retorno','outro']),
        allergies: Math.random() > 0.86 ? 'Relatou sensibilidade na pele. Confirmar antes do procedimento.' : null,
        medicalNotes: Math.random() > 0.9 ? 'Confirmar medicação de uso contínuo.' : null,
        status: Math.random() > 0.88 ? 'vip' : 'ativo',
      },
    });
    clients.push(client);
  }

  await TattooAppointment.destroy({ where: {} });

  for (let i = 0; i < total; i += 1) {
    const estimatedMinutes = pick([60, 90, 120, 150, 180, 240, 300]);
    const startTime = timeSlot(i);
    const status = pick(['orcamento','aguardando_sinal','agendado','confirmado','em_atendimento','finalizado','cancelado','reagendado']);
    const appointmentDate = isoDate(addDays(Math.floor(Math.random() * 150) - 45));
    const price = money(180, 2400);
    const deposit = Math.random() > 0.36 ? Math.min(price, money(80, 500)) : 0;

    await TattooAppointment.create({
      clientId: pick(clients).id,
      artistId: pick(artists).id,
      title: pick(titles),
      serviceType: pick(['orcamento','tattoo','retoque','avaliacao','piercing','outro']),
      style: pick(styles),
      bodyArea: pick(areas),
      sizeLabel: pick(['pequena','media','grande','sessao fechada','micro tattoo','fechamento']),
      appointmentDate,
      startTime,
      endTime: addMinutes(startTime, estimatedMinutes),
      estimatedMinutes,
      price,
      deposit,
      paymentStatus: deposit > 0 ? pick(['sinal_pago','parcial','pago']) : 'pendente',
      status,
      confirmationStatus: status === 'confirmado' || status === 'finalizado' ? 'confirmado' : pick(['nao_enviado','aguardando_cliente','sem_resposta']),
      reminderMinutesBefore: pick([120, 240, 720, 1440, 2880]),
      priority: Math.random() > 0.88 ? 'alta' : 'normal',
      notes: Math.random() > 0.55 ? 'Conferir referência, bancada e termo antes do horário.' : null,
      careInstructionsSent: status === 'finalizado' ? Math.random() > 0.35 : false,
    });
  }

  console.log(`FlowTattoo: ${clients.length} clientes, ${artists.length} tatuadores e ${total} agendamentos gerados.`);
  console.log('Login: admin@flowpeople.com / Admin@12345');
  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Erro ao gerar volume FlowTattoo:', error);
  await sequelize.close();
  process.exit(1);
});
