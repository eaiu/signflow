# API Specification (Draft)

Base URL: `/api/v1`

## Auth (minimal)
> This app is designed for personal use. If you require multi-user or public access, add full auth.

## Endpoints

### Health
- **GET** `/health`
- **Response**: `200 OK`
```json
{ "status": "ok" }
```

### List Jobs
- **GET** `/jobs`
- **Response** `200 OK`
```json
[
  {
    "id": "site:1",
    "name": "site:1",
    "next_run_time": "2026-02-12T20:10:00Z"
  }
]
```

### Create Sign-in
- **POST** `/signins`
- **Body**
```json
{
  "note": "string (optional)",
  "device": "string (optional)",
  "location": "string (optional)"
}
```
- **Response** `201 Created`
```json
{
  "id": 1,
  "created_at": "2026-02-12T20:06:00+08:00",
  "note": "string",
  "device": "string",
  "location": "string"
}
```

### List Sign-ins
- **GET** `/signins`
- **Query Params**
  - `limit` (int, default 50, max 200)
  - `offset` (int, default 0)
- **Response** `200 OK`
```json
[
  {
    "id": 1,
    "created_at": "2026-02-12T20:06:00+08:00",
    "note": "string",
    "device": "string",
    "location": "string"
  }
]
```

### Get Sign-in
- **GET** `/signins/{id}`
- **Response** `200 OK`
```json
{
  "id": 1,
  "created_at": "2026-02-12T20:06:00+08:00",
  "note": "string",
  "device": "string",
  "location": "string"
}
```

### Delete Sign-in
- **DELETE** `/signins/{id}`
- **Response** `204 No Content`

### Logs (SSE)
- **GET** `/logs/stream`
- **Query Params**
  - `run_id` (optional)
  - `since_id` (optional)
  - `poll_interval` (seconds, optional)
- **Response** `200 OK` (SSE events)
```json
{ "id": 12, "run_id": 3, "level": "info", "message": "Run #3 started", "created_at": "2026-02-12T20:10:00Z" }
```

### CookieCloud Sync
- **POST** `/cookiecloud/sync?profile=default`
- **Response** `200 OK`
```json
{ "ok": true, "profile": "default", "message": "CookieCloud sync done" }
```

### Config
- **GET** `/config`
- **Response** `200 OK`
```json
{
  "project_name": "SignFlow",
  "api_v1_prefix": "/api/v1",
  "environment": "local",
  "database_url": "sqlite:///./data/signflow.db",
  "cookiecloud_url": "",
  "cookiecloud_key": "**",
  "cookiecloud_password": "**",
  "cookiecloud_timeout": 8,
  "cookiecloud_verify_ssl": true,
  "cookiecloud_send_json": true,
  "scheduler_enabled": true,
  "api_token": "**",
  "plugin_paths": "app.plugins",
  "plugins": [
    {
      "key": "echo",
      "name": "Echo",
      "description": "Return a quick echo response for testing."
    }
  ]
}
```

## Errors
Standard JSON errors:
```json
{ "detail": "error message" }
```
