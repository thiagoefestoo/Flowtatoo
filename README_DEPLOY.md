# Flowtatoo — Deploy

Aplicativo mobile para gestão de estúdio de tatuagem, com frontend React/Vite e backend Node/Express.

## Backend no Render

Variáveis:

```env
DATABASE_URL=sua_url_postgresql_neon
JWT_SECRET=troque_esta_chave
JWT_EXPIRES_IN=8h
DB_SYNC=false
CORS_ORIGIN=https://flowtatoo.vercel.app
NODE_ENV=production
```

Na primeira publicação desta versão otimizada, use `DB_SYNC=true` somente uma vez para criação dos índices. Depois volte para `false`.

Configuração:

```text
Root Directory: backend
Build Command: npm ci --omit=dev
Start Command: npm start
Health Check: /api/health
```

## Frontend na Vercel

Variável:

```env
VITE_API_URL=https://sua-api.onrender.com/api
```

Comandos locais:

```powershell
cd frontend
pnpm install
pnpm run build
vercel --prod --force
```

O `vercel.json` já contém o build com pnpm, a pasta `dist` e a regra de navegação para React Router.

## Administrador

```powershell
cd backend
node scripts/create-admin.js
```

Login padrão do script:

- E-mail: `admin@flowtatoo.com`
- Senha: `Admin@12345`
