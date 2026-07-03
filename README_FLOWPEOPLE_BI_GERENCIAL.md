# FlowPeople - BI Gerencial

Este pacote adiciona um módulo de BI gerencial ao FlowPeople.

## O que foi incluído

- Nova página protegida `/bi-gerencial`.
- Novo item de menu **BI Gerencial**.
- Nova API autenticada `GET /api/hr-bi/gerencial`.
- Filtros por período: 30, 60, 90, 180, 365 dias e intervalo personalizado.
- Curvas por data para candidatos, entrevistas e admissões.
- Gráfico de movimentação diária.
- Funil de candidatura até contratação.
- Indicadores de conversão, propostas, admissões, documentos e alertas.
- Distribuições por origem, status, etapa, departamento e cargos desejados.
- Seed de volume ajustado para distribuir datas historicamente e alimentar os gráficos.

## Comandos úteis

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

Gerar dados para BI:

```powershell
cd backend
npm run seed:volume -- 300
```

Carga maior:

```powershell
cd backend
npm run seed:volume -- 800
```

Ou usando variável:

```powershell
cd backend
$env:FLOWPEOPLE_VOLUME=500
npm run seed:volume
```

Login padrão:

```text
admin@flowpeople.com
Admin@12345
```
