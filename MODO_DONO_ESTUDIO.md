# Flowtatoo — Modo dono do estúdio

Esta versão foi ajustada para um único usuário gerenciar o próprio estúdio de tatuagem pelo celular.

## Principais mudanças

- Interface clara, leve e mobile-first.
- Navegação inferior estilo app de smartphone.
- Menu simplificado: Agenda, Hoje, Clientes, Meu Perfil, BI e Ajustes.
- Páginas de usuários/auditoria removidas da navegação principal.
- Textos ajustados para uso individual: “meu estúdio”, “meu perfil” e “agenda pessoal”.
- Cadastro de perfil artístico usado como responsável padrão quando existir apenas um artista cadastrado.
- Identidade visual refeita com tons claros: branco, azul claro, azul principal, areia suave e verde sálvia.

## Login padrão

E-mail: admin@flowtatoo.com  
Senha: Admin@12345

Para criar ou resetar o usuário:

```powershell
cd backend
node scripts/create-admin.js
```

## Rodar o projeto

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Dados de teste

```powershell
cd backend
npm run seed:tattoo -- 200
```

## Atualização — controle de pagamento

- Agendamento agora registra valor total, sinal/adiantamento, total já pago, forma de pagamento e observações financeiras.
- O sistema calcula se o cliente não pagou, pagou sinal, pagou parte ou pagou tudo.
- A agenda exibe barra de progresso do pagamento em cada horário.
- O dashboard mobile foi compactado para encaixar melhor no smartphone.
- O BI recebeu indicadores de recebido, saldo em aberto, pagamentos parciais e pagamentos quitados.
