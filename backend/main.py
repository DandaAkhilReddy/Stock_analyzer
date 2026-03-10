"""
ReddyFit ML Backend - FastAPI Application
Provides ML-powered recommendations for workouts and meals
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from typing import Optional
import os
from dotenv import load_dotenv

from app.routers import recommendations, recipes, workouts, nutrition
from app.core.config import settings

load_dotenv()

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID", "reddyfit-dcf41"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv("FIREBASE_CERT_URL")
    })
    firebase_admin.initialize_app(cred)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 ReddyFit ML Backend starting up...")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    print(f"🔥 Firebase Project: {os.getenv('FIREBASE_PROJECT_ID', 'reddyfit-dcf41')}")
    yield
    # Shutdown
    print("👋 ReddyFit ML Backend shutting down...")

app = FastAPI(
    title="ReddyFit ML API",
    description="Machine Learning powered fitness and nutrition recommendations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://agreeable-water-04e942910.1.azurestaticapps.net",
        "https://*.azurestaticapps.net"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Dependency
async def verify_firebase_token(authorization: Optional[str] = Header(None)) -> dict:
    """Verify Firebase ID token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # Extract token from "Bearer <token>"
        token = authorization.split("Bearer ")[-1] if "Bearer" in authorization else authorization
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")

# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "ReddyFit ML API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "firebase": "connected",
        "ml_models": "loaded"
    }

# Include routers
app.include_router(
    recommendations.router,
    prefix="/api/recommendations",
    tags=["ML Recommendations"]
)

app.include_router(
    recipes.router,
    prefix="/api/recipes",
    tags=["Custom Recipes"]
)

app.include_router(
    workouts.router,
    prefix="/api/workouts",
    tags=["Workout Plans"]
)

app.include_router(
    nutrition.router,
    prefix="/api/nutrition",
    tags=["Nutrition Analysis"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
