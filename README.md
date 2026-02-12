# SignFlow

Minimalist personal sign-in console with FastAPI + SQLite backend and React (Vite + Tailwind) frontend.

## Features
- CRUD for Sites, Runs, Logs
- CookieCloud sync stub endpoint
- Masked env configuration endpoint
- APScheduler heartbeat job (placeholder)
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
# edit .env as needed
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env as needed
npm run dev
```

## API Endpoints

Base: `/api/v1`

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
- `POST /cookiecloud/sync`

## Notes
- Scheduler currently emits heartbeat logs every 60 seconds.
- CookieCloud sync is a stub; implement HTTP call in `app/services/cookiecloud.py`.
