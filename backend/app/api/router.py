from fastapi import APIRouter

from app.routers import admin, budgets, clients, company, documents, finance, health, reminders, service_orders, service_reports

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(service_reports.router, prefix="/service-reports", tags=["service-reports"])
api_router.include_router(service_orders.router, prefix="/service-orders", tags=["service-orders"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(company.router, prefix="/company", tags=["company"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
