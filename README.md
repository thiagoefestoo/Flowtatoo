# Flowtatoo

Sistema mobile-first para estúdio de tatuagem, com agenda/calendário como módulo principal.

## Módulos principais

- Dashboard do estúdio
- Agenda com calendário mensal e visão do dia
- Alertas de horários de hoje, confirmação pendente, sinal pendente e prioridade alta
- Cadastro de clientes
- Cadastro de tatuadores
- BI gerencial com curvas e gráficos por data
- Interface estilo Android, adaptada para smartphone

## Execução local

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

## Login padrão

```txt
E-mail: admin@flowtatoo.com
Senha: Admin@12345
```

## Dados de teste

```powershell
cd backend
npm run seed:tattoo -- 200
```

Carga maior:

```powershell
npm run seed:tattoo -- 800
```
