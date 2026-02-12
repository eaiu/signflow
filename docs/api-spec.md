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

## Errors
Standard JSON errors:
```json
{ "detail": "error message" }
```
