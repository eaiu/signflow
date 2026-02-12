# Personal Sign-in Web App

A minimalist personal sign-in web app with an independent frontend and a FastAPI backend backed by SQLite. Built for clarity, speed, and a “Minimalist Modern” design system.

## Stack
- **Frontend:** (framework-agnostic) HTML/CSS/JS scaffold
- **Backend:** FastAPI (Python)
- **Database:** SQLite

## Structure
```
projects/personal-signin-app/
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  │  └─ v1/
│  │  │     └─ routes/
│  │  ├─ core/
│  │  ├─ db/
│  │  ├─ schemas/
│  │  └─ services/
│  └─ tests/
├─ frontend/
│  ├─ public/
│  └─ src/
└─ docs/
```

## Minimalist Modern (Design System Notes)
- Clean layout, generous whitespace
- Neutral palette with one strong accent color
- Simple typography, limited font weights
- Subtle elevation (shadows) and soft borders
- Clear focus states, accessible contrast

## Quick Start (local)
> **Note:** The backend is scaffolded only; no commands are executed by this assistant.

1) Create a Python virtual environment and install dependencies.
2) Run the FastAPI app with Uvicorn.
3) Serve the frontend as static files (any lightweight static server).

## API Spec
See `docs/api-spec.md`.

## Database Schema
See `docs/database-schema.sql`.

## Repo Initialization (later)
If you want to create a Git repo later:
1) `git init`
2) `git add .`
3) `git commit -m "Initial scaffold"`
4) Create a remote repo (GitHub/GitLab/etc.)
5) `git remote add origin <REMOTE_URL>`
6) `git push -u origin main`
