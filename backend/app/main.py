from fastapi import FastAPI
from app.api.v1.routes.signins import router as signins_router

app = FastAPI(title="Personal Sign-in API", version="0.1.0")

@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

app.include_router(signins_router, prefix="/api/v1/signins", tags=["signins"])
