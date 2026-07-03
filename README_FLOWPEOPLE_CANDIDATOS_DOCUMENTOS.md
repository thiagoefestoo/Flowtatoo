# FlowPeople - fluxo candidato primeiro + documentos

## O que foi adicionado

- Cadastro de documentos anexados diretamente ao candidato.
- Botão **Documentos** na página **Candidatos**.
- Campo opcional de anexo no momento de cadastrar um candidato.
- Nova API `/api/candidate-documents` para listar, anexar e remover arquivos do candidato.
- Tabela `flowpeople_candidate_documents`.
- As páginas de processo seletivo, entrevista, banco de talentos, proposta, admissão e documentos RH agora usam candidato cadastrado como origem.
- Ao selecionar um candidato, o sistema preenche automaticamente nome, e-mail, telefone, cargo/área quando aplicável.
- Script de volume para gerar candidatos e registros relacionados.

## Fluxo recomendado

1. Cadastre o candidato em **Candidatos**.
2. Anexe currículo, RG, CPF, certificados ou documentos iniciais.
3. Use o candidato já cadastrado nos módulos:
   - Processos seletivos
   - Entrevistas
   - Banco de talentos
   - Propostas
   - Admissões
   - Documentos RH
4. O histórico fica mais limpo porque o candidato passa a ser o centro do fluxo.

## Comandos PowerShell para gerar dados

Entre no backend:

```powershell
cd backend
```

Criar demo pequena:

```powershell
npm run seed:demo
```

Criar 50 candidatos e registros relacionados:

```powershell
npm run seed:volume -- 50
```

Criar 200 candidatos e registros relacionados:

```powershell
npm run seed:volume -- 200
```

Criar 500 candidatos e registros relacionados:

```powershell
npm run seed:volume -- 500
```

Também funciona com variável de ambiente:

```powershell
$env:FLOWPEOPLE_VOLUME=300
npm run seed:volume
```

## Login padrão

```txt
E-mail: admin@flowpeople.com
Senha: Admin@12345
```

## Observação

Para as novas colunas e tabelas aparecerem no Neon, deixe no `.env` do backend:

```env
DB_SYNC=true
```

Depois rode:

```powershell
npm run dev
```
