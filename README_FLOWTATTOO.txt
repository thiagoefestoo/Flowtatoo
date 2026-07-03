FLOWTATTOO - Studio Calendar OS

Sistema adaptado para estudio de tatuagem, com foco em agenda/calendario, alertas e uso em smartphones.

Principais modulos adicionados:
- Dashboard do estudio
- Agenda inteligente com calendario mensal
- Alertas de horarios do dia, confirmacao pendente, sinal pendente e prioridade alta
- Cadastro de clientes obrigatorio antes do agendamento
- Cadastro de tatuadores com especialidades, cor de agenda e comissao
- BI gerencial com curvas por data, volume diario, receita, status, servicos e produtividade por tatuador
- Interface mobile-first para funcionar bem em smartphones

Rotas principais:
Frontend:
- /agenda
- /clientes
- /tatuadores
- /dashboard
- /bi-gerencial

Backend:
- /api/tattoo-dashboard/summary
- /api/tattoo-dashboard/public-summary
- /api/tattoo-dashboard/bi
- /api/tattoo-clients
- /api/tattoo-artists
- /api/tattoo-appointments

Comandos:
Backend:
cd backend
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

Gerar dados de teste:
cd backend
npm run seed:tattoo -- 200

Login padrao:
E-mail: admin@flowpeople.com
Senha: Admin@12345
