from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.seed import seed_database
from app.api import (
    routes_dashboard,
    routes_traffic,
    routes_pipeline,
    routes_threats,
    routes_runtime,
    routes_response,
    routes_reports
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Ensure baseline data is seeded
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AEGIS — AI-Driven DevSecOps Framework for Cloud-Native Telecom Applications API",
    lifespan=lifespan
)

# CORS configuration supporting localhost and any Vercel deployment domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(routes_dashboard.router, prefix=settings.API_V1_STR)
app.include_router(routes_traffic.router, prefix=settings.API_V1_STR)
app.include_router(routes_pipeline.router, prefix=settings.API_V1_STR)
app.include_router(routes_threats.router, prefix=settings.API_V1_STR)
app.include_router(routes_runtime.router, prefix=settings.API_V1_STR)
app.include_router(routes_response.router, prefix=settings.API_V1_STR)
app.include_router(routes_reports.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "AEGIS Telecom Security Engine",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "docs_url": "/docs"
    }
