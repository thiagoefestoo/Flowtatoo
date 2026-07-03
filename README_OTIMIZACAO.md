# Flowtatoo — versão otimizada

Esta versão mantém somente os módulos usados pelo aplicativo atual:

- autenticação e perfil;
- agenda e pagamentos;
- clientes;
- perfil do tatuador;
- dashboard e BI;
- sino e central de alertas;
- health check para deploy.

## Melhorias aplicadas

- remoção dos módulos antigos de ERP, CRM, RH, entregas e estoque;
- backend inicializa apenas 5 modelos do banco;
- rotas e controllers não utilizados foram removidos;
- páginas do frontend agora são carregadas sob demanda;
- consulta de alertas usa cache curto e campos mínimos;
- atualização do sino pausa quando o aplicativo está em segundo plano;
- índices adicionados às tabelas mais consultadas;
- limite JSON reduzido de 10 MB para 2 MB;
- dependência `multer` removida porque esta base não utiliza uploads;
- scripts de seed antigos removidos;
- auditoria técnica desativada por padrão para evitar uma escrita extra no banco em cada alteração.

## Banco de dados

Na primeira execução desta versão, use temporariamente:

```env
DB_SYNC=true
```

Isso permite criar os novos índices. Depois que o backend iniciar com sucesso, altere para:

```env
DB_SYNC=false
```

Em produção, manter `DB_SYNC=false` reduz o tempo de inicialização e evita alterações automáticas no banco.

## Comandos

Backend:

```powershell
cd backend
npm install
npm run check
npm run dev
```

Frontend:

```powershell
cd frontend
pnpm install
pnpm run build
pnpm run dev
```

Carga pequena:

```powershell
cd backend
npm run seed:demo
```

Carga personalizada:

```powershell
npm run seed:tattoo -- 200
```

## Auditoria opcional

Por padrão, use `AUDIT_ENABLED=false`. Para voltar a registrar auditoria técnica no banco, altere para `AUDIT_ENABLED=true` e execute uma inicialização com `DB_SYNC=true`.
