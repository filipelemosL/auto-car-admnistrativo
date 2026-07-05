import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.keepalive import run_database_keepalive, stop_database_keepalive

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    keepalive_task = asyncio.create_task(run_database_keepalive())
    try:
        yield
    finally:
        await stop_database_keepalive(keepalive_task)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    summary="Base de API administrativa para oficina mecanica.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "api_prefix": settings.api_prefix,
    }
