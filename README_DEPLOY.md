# Flowtatoo — Deploy

Base de deploy para o Flowtatoo, sistema de RH/PeopleOps com frontend React + Vite e backend Node + Express.

## Backend

Configure as variáveis do backend no provedor de hospedagem:

```env
DATABASE_URL=sua_url_postgresql_neon
JWT_SECRET=troque_esta_chave
DB_SYNC=true
CORS_ORIGIN=https://seu-frontend.vercel.app
```

Comandos sugeridos:

```bash
cd backend
npm install
npm run start
```

Para criar dados demonstrativos e o usuário inicial:

```bash
npm run seed:demo
```

## Frontend

Configure a URL da API no frontend:

```env
VITE_API_URL=https://sua-api.onrender.com/api
```

Comandos:

```bash
cd frontend
npm install
npm run build
```

## Login inicial de demonstração

- E-mail: `admin@flowtatoo.com`
- Senha: `Admin@12345`
