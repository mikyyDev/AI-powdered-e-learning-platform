from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, users, courses, enrollment, payments, chat, ai, video_calls, ratings, teacher


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    for folder in ("avatars", "thumbnails", "files"):
        os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered learning platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

app.include_router(auth.router,       prefix="/api")
app.include_router(users.router,      prefix="/api")
app.include_router(courses.router,    prefix="/api")
app.include_router(enrollment.router, prefix="/api")
app.include_router(payments.router,   prefix="/api")
app.include_router(chat.router,       prefix="/api")
app.include_router(ai.router,          prefix="/api")
app.include_router(video_calls.router, prefix="/api")
app.include_router(ratings.router,     prefix="/api")
app.include_router(teacher.router,     prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
