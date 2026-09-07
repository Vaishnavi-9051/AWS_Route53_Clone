import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import auth, hosted_zones, dns_records
from .seed import seed_database

app = FastAPI(title="Route53 Clone API", version="0.1.0")

# CORS configuration – allow the Next.js dev server
origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(dns_records.router)


@app.on_event("startup")
async def startup_event():
    """Create tables and seed the DB on startup if empty."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Seed data (idempotent)
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Route53 Clone API", "docs": "/docs"}
