# Deploy

## Frontend na Vercel

Use a raiz do repositorio como projeto. O arquivo `vercel.json` ja aponta a instalacao, build e saida para `frontend/`.

Configure a variavel de ambiente na Vercel:

```env
VITE_DATA_MODE=api
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_MOCK_LATENCY_MS=0
```

## Backend no Render

Use o blueprint `render.yaml` na raiz do repositorio ou crie um Web Service com:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /api/health
```

Configure as variaveis do `backend/.env.render.example` no Render. Em `AUTOCAR_CORS_ORIGINS`, use o dominio real da Vercel:

```env
AUTOCAR_CORS_ORIGINS=["https://your-vercel-app.vercel.app"]
```

Depois de publicar o backend no Render, copie a URL publica e use em `VITE_API_URL` na Vercel.
