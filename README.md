# SignFlow

Minimalist personal sign-in console with FastAPI + SQLite backend and React (Vite + Tailwind) frontend.

## Features
- Token-protected API (simple API token)
- Local login page + protected routes
- CRUD for Sites, Runs, Logs
- CookieCloud sync endpoint
- Masked env configuration endpoint
- APScheduler heartbeat job + site cron mapping
- Site plugin system with hooks
- SSE log stream endpoint
- Minimalist modern UI (dashboard, sites, logs, jobs, settings)

## Project Structure
- `backend/` FastAPI + SQLModel
- `frontend/` React + Vite + Tailwind
- `docs/` notes

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env as needed (set API_TOKEN to protect the API)
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env as needed (point API url if needed)
npm run dev
```

## API Endpoints

Base: `/api/v1`

All endpoints require an API token when `API_TOKEN` is set. Provide it via:
- `X-API-Token: <token>` header (preferred)
- `Authorization: Bearer <token>` header
- `?api_token=<token>` query param (used by SSE)

- `GET /health`
- `GET /sites`
- `POST /sites`
- `GET /sites/{id}`
- `PATCH /sites/{id}`
- `DELETE /sites/{id}`
- `GET /runs`
- `POST /runs`
- `GET /runs/{id}`
- `PATCH /runs/{id}`
- `DELETE /runs/{id}`
- `GET /logs`
- `POST /logs`
- `GET /logs/{id}`
- `DELETE /logs/{id}`
- `GET /logs/stream` (SSE)
- `GET /config`
- `GET /jobs`
- `POST /cookiecloud/sync`

## Notes
- Scheduler emits heartbeat logs every 30 seconds and executes queued runs.
- Add cron schedules by putting `cron: */30 * * * *` inside site notes.
- Set `plugin_key` on a site to select a plugin.
- CookieCloud sync posts CryptoJS-compatible payload to `/update`.
