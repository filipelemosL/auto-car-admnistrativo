from fastapi import APIRouter

from app.routers import budgets, clients, finance, health, reminders, service_reports

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(service_reports.router, prefix="/service-reports", tags=["service-reports"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
