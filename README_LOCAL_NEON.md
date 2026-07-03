# Flowtatoo — execução local com Neon

## 1. Backend

Crie o arquivo `backend/.env` com base em `backend/.env.example`:

```env
PORT=3001
DATABASE_URL=sua_url_postgresql_neon
JWT_SECRET=flowtatoo_local_secret
DB_SYNC=true
CORS_ORIGIN=http://localhost:5173
```

Depois rode:

```bash
cd backend
npm install
npm run dev
```

A API deve iniciar em:

```txt
http://localhost:3001/api
```

## 2. Dados de exemplo

Em outro terminal:

```bash
cd backend
npm run seed:demo
```

Login criado:

- E-mail: `admin@flowtatoo.com`
- Senha: `Admin@12345`

## 3. Frontend

Crie `frontend/.env` se quiser apontar para a API local:

```env
VITE_API_URL=http://localhost:3001/api
```

Depois rode:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, geralmente:

```txt
http://localhost:5173
```
