FLOWPEOPLE - BASE RH / PEOPLEOPS

Sistema de RH criado sobre a base técnica dos sistemas FlowSoftware já desenvolvidos, agora com identidade visual própria e independente.

Módulos incluídos nesta base:
- Dashboard RH
- Vagas
- Candidatos
- Processos seletivos
- Entrevistas e agendamento
- Banco de talentos
- Propostas RH
- Admissões
- Colaboradores
- Documentos RH
- Onboarding
- Férias e afastamentos
- Desligamentos
- Relatórios
- Auditoria
- Usuários e permissões
- Configurações

Stack:
- Frontend React + Vite
- Backend Node + Express
- PostgreSQL / Neon
- Sequelize
- JWT
- Auditoria
- UTF-8 reforçado

Identidade visual:
- Novo tema FlowPeople Aurora UI
- Paleta: ameixa profunda, violeta, coral, âmbar, menta e areia
- Favicon próprio FlowPeople
- Interface separada visualmente das bases anteriores
- Arquivo principal: frontend/src/flowpeople-theme.css
- Guia: IDENTIDADE_VISUAL_FLOWPEOPLE.md

Login inicial sugerido:
E-mail: admin@flowpeople.com
Senha: Admin@12345

Para iniciar:
1. Crie o .env em backend com DATABASE_URL.
2. Deixe DB_SYNC=true na primeira execução.
3. Rode npm run dev no backend.
4. Rode npm run dev no frontend.
5. Opcional: rode npm run seed:demo no backend para criar dados de exemplo.
